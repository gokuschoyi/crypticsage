import re
from .models_wgan_gp import Generator, Discriminator
from keras.initializers import RandomNormal
from dotenv import load_dotenv
from keras import backend as K
from .util import (
    plot_intermediate_predictions,
    getLastSavedModelCheckpoint,
    broadcastTrainingBatchLosses,
    generate_additional_dates,
    broadcastTrainingStatus,
    plot_validation_metrics,
    calculatePredictomRMSE,
    log_training_metrics,
    saveTrainScalers,
    closeFileWriters,
    initFileWriters,
    scalar_function,
    transform_data,
    removeSavedModels,
    getYLabels,
    saveModel,
)
import tensorflow as tf
import pandas as pd
import numpy as np
import logging
import psutil
import redis
import keras
import json
import time
import os

# from memory_profiler import profile

# Load environment variables from the .env file
load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port)  # type: ignore


class WGANGP(keras.models.Model):  # train functions for the wgan-gp model
    def __init__(self, process_id, uid, model_id, training_parameters, existing_data, re_train=False, checkpoint=""):
        super(WGANGP, self).__init__()
        self.tb_logging = False
        self.g_optimizer = keras.optimizers.Adam(learning_rate=training_parameters['g_learning_rate'], beta_1=0.5, beta_2=0.9)
        self.d_optimizer = keras.optimizers.Adam(learning_rate=training_parameters['d_learning_rate'], beta_1=0.5, beta_2=0.9)
        self.discriminator = keras.models.Model()
        self.generator = keras.models.Model()
        self.total_training_batches = 0  # total number of training batches
        self.gp_lambda = 10
        self.lambda_1 = 0.5  # => adding extra losses significatively speeds up training and convergence)
        self.lambda_2 = 0.5  # => adding extra losses significatively speeds up training and convergence

        self.logs_dir = "logs/" + model_id
        self.process_id = process_id
        self.uid = uid
        self.model_id = model_id
        self.re_train = re_train
        self.checkpoint = checkpoint
        self.existing_data = existing_data # flag used to send corelation matrix to the client

        self.to_predict = training_parameters['to_predict']
        self.training_size = training_parameters['training_size']
        self.time_step = training_parameters['time_step']
        self.look_ahead = training_parameters['look_ahead']
        self.epochs = training_parameters['epochs']
        self.batchSize = training_parameters['batchSize']
        self.transformation_order = training_parameters['transformation_order']
        self.feature_size = len(training_parameters['transformation_order'])
        self.do_validation = training_parameters['do_validation']
        self.early_stopping_flag = training_parameters['early_stopping_flag']
        self.n_discriminator = training_parameters['n_critic']
        self.intermediate_result_step = training_parameters['intermediate_result_step']
        self.model_save_checkpoint = training_parameters['model_save_checkpoint']

        self.features_df = pd.DataFrame()  # features dataframe loaded from redis
        self.split_index = None  # split index for train and test data

        self.train_data = pd.DataFrame()  # train data - original values xTrain
        self.test_data = pd.DataFrame()  # test data
        # self.y_labels = pd.DataFrame()  # y labels from train data -original values yTrain

        self.x_scalar = None  # x scalar transformer
        self.y_scalar = None  # y scalar transformer

        self.xTrain_norm = None  # normalized x train data
        self.yTrain_norm = None  # normalized y train data

        self.x_train = None  # transformed x train data
        self.y_train = None  # transformed y train data
        self.past_y_train = None  # transformed past y train data

        self.xTest_norm = None  # normalized x test data
        self.yTest_norm = None  # normalized y test data

        self.xt_test = None  # transformed x test data
        self.yt_test = None  # transformed y test data
        self.past_yt_test = None  # transformed past y test data

        broadcastTrainingStatus(self.uid, "notify", "WGAN_GP class initialized successfully")

    def get_model_config(self):
        return {
            "process_id": self.process_id,
            "model_id ": self.model_id,
            "to_predict": self.to_predict,
            "training_size": self.training_size,
            "time_step": self.time_step,
            "look_ahead": self.look_ahead,
            "epochs": self.epochs,
            "batchSize": self.batchSize,
            "do_validation": self.do_validation,
            "early_stopping_flag": self.early_stopping_flag,
            "n_critics": self.n_discriminator,
            "intermediate_result_step": self.intermediate_result_step,
            "model_save_checkpoint": self.model_save_checkpoint,
        }

    def fetchFeaturesFromRedis(self):  # fetch the features from redis and convert it to pandas dataframe. Also saves the split indes for train and test data
        logging.critical(f"{self.process_id} : Fetching features from redis.")
        features_redis = redisStore.hget(self.process_id, "features")
        df = pd.DataFrame.from_dict(json.loads(features_redis))  # type: ignore
        self.features_df = df  # type: ignore

        # calculate the split index based on training size
        self.split_index = int((self.training_size * self.features_df.shape[0]) / 100)

        if (self.existing_data):
            metrics = redisStore.hget(self.process_id, 'feature_metrics')
            broadcastTrainingStatus(self.uid, "feature_relations", json.loads(metrics))  # type: ignore

    def splitDataToTrainAndTest(self):  # split the data into train and test sets based on split index
        logging.critical(f"{self.process_id} : Splitting data to train and test.")
        self.train_data = self.features_df.iloc[:self.split_index, :]
        self.test_data = self.features_df.iloc[self.split_index:, :]
        logging.info(f"Features shape : {self.features_df.shape}")
        logging.info(f"Train data shape : {self.train_data.shape}")
        logging.info(f"Test data shape : {self.test_data.shape}")

    def normalizetrainingData(self):  # normalize the training data
        logging.critical(f"{self.process_id} : Normalizing training data.")
        y_labels_train = getYLabels(self.train_data, self.transformation_order, self.to_predict, len(self.train_data.columns))
        X_Scalar, Y_Scalar = scalar_function(self.train_data, y_labels_train)
        self.xTrain_norm = X_Scalar.transform(self.train_data)
        self.yTrain_norm = Y_Scalar.transform(y_labels_train)

        if self.do_validation:
            self.xTest_norm = X_Scalar.transform(self.test_data)
            self.yTest_norm = Y_Scalar.transform(getYLabels(self.test_data, self.transformation_order, self.to_predict, len(self.test_data.columns)))

            logging.info(f"X test norm shape : {self.xTest_norm.shape}")
            logging.info(f"Y test norm shape : {self.yTest_norm.shape}")

        self.x_scalar = X_Scalar
        self.y_scalar = Y_Scalar

        logging.info(f"X train norm shape : {self.xTrain_norm.shape}")
        logging.info(f"Y train norm shape : {self.yTrain_norm.shape}")
        broadcastTrainingStatus(self.uid, "notify", "(6) : Training data normalized...")

    def transformDataForTraining(self):  # transform the data for training
        logging.critical(f"{self.process_id} : Transforming data for training.")
        start = time.time()
        xT, yT, past_yT = transform_data(self.xTrain_norm, self.yTrain_norm, self.time_step, self.look_ahead, type_='training')
        logging.info(f"X, Y, PY shapes (Batch adjust B) : {xT.shape}, {yT.shape}, {past_yT.shape}")

        num_samples, seq_length, features = xT.shape
        num_batches, remainder = divmod(num_samples, self.batchSize)

        xT=tf.slice(xT, [remainder, 0, 0], [num_samples-remainder, seq_length, features])
        yT=tf.slice(yT, [remainder, 0], [num_samples-remainder, -1])
        past_yT=tf.slice(past_yT, [remainder, 0, 0], [num_samples-remainder, seq_length, 1])
        logging.info(f"X, Y, PY shapes (Batch adjust A) : {xT.shape}, {yT.shape}, {past_yT.shape}")
        logging.info(f"TRANSFORM Time taken:  {time.time() - start}")

        self.total_training_batches = num_batches
        self.x_train = xT
        self.y_train = yT
        self.past_y_train = past_yT

        broadcastTrainingStatus(self.uid, "notify", "(7) : Training data created...")

        xtSize = self.x_train.shape[0] * self.x_train.shape[1] * self.x_train.shape[2] * 8 # type: ignore
        ytSize = self.y_train.shape[0] * self.y_train.shape[1] * 8 # type: ignore
        pytSize = self.past_y_train.shape[0] * self.past_y_train.shape[1] * self.past_y_train.shape[2] * 8 # type: ignore
        logging.info(f"Memory size of the array in bytes : X, Y, PY : {xtSize}, {ytSize}, {pytSize}")
        logging.info(f"Total memory in bytes: {round((xtSize+ytSize+pytSize)/ (1000*1000),3)} MB")

    def initializeModels(self):  # initialize the generator and discriminator models
        logging.critical(f"{self.process_id} : Initializing generator and Discriminator models.")
        weight_initializer = RandomNormal(mean=0.00, stddev=0.02, seed=42)
        generator = Generator(weight_initializer, self.time_step, self.feature_size, self.look_ahead)
        self.discriminator = Discriminator(weight_initializer, self.time_step, self.look_ahead)
        
        if self.re_train:
            count = self.checkpoint.split("_")[1] # type: ignore
            saved_model_path = f"./saved_models/{self.model_id}/{self.checkpoint}/gen_model_{count}"
            print(f'Retrain,  Saved model path : {saved_model_path}')
            generator.load_weights(f"{saved_model_path}")
            self.generator = generator
        else:
            self.generator = generator
        broadcastTrainingStatus(self.uid, "notify", "(8) : Generator and Discriminator model initialized...")

    def process_data(self): # process the data, fetch features, split data, normalize data, transform data and initialize models
        self.fetchFeaturesFromRedis()
        self.splitDataToTrainAndTest()
        self.normalizetrainingData()
        self.transformDataForTraining()
        self.initializeModels()

    @tf.function
    def gradient_penalty(self, batch_size, real_output, generated_output) -> tf.Tensor: # calculate the gradient penalty
        # 1. get the interpolated data
        alpha = tf.random.normal([batch_size, self.time_step + self.look_ahead, 1], 0.0, 1.0)
        diff = generated_output - tf.cast(real_output, tf.float32)
        interpolated = tf.cast(real_output, tf.float32) + alpha * diff

        with tf.GradientTape() as gp_tape:
            gp_tape.watch(interpolated)
            # 2. Get the discriminator output for this interpolated data.
            pred = self.discriminator(interpolated, training=True)  # type: ignore

        # 3. Calculate the gradients w.r.t to this interpolated data.
        grads = gp_tape.gradient(pred, [interpolated])
        if grads is not None:
            grads = grads[0]

        # 3. Calculate the norm of the gradients
        gp = tf.reduce_mean(tf.pow(tf.subtract(tf.sqrt(tf.reduce_sum(tf.square(grads), axis=[1, 2])), 1.0), 2))
        return gp

    @tf.function
    def trianDiscriminatorOneStep(self, real_input, real_price, past_y, batch_size): # train the discriminator for one step
        print('train d one step traced')
        # transform the real data to the required format
        real_y_reshape = tf.reshape(real_price, [real_price.shape[0], real_price.shape[1], 1])
        real_output = tf.concat([tf.cast(past_y, tf.float32), tf.cast(real_y_reshape, tf.float32)], axis=1)

        # generate fake output
        generated_data = self.generator(real_input, training=True)  # type: ignore
        generated_data_reshape = tf.reshape(generated_data, [generated_data.shape[0], generated_data.shape[1], 1])  # type: ignore # reshape the data
        generated_output = tf.concat([tf.cast(past_y, tf.float32), generated_data_reshape], axis=1)

        D_real = self.discriminator(real_output, training=True)  # type: ignore # Get the logits for the real data
        D_generated = self.discriminator(generated_output, training=True)  # type: ignore # Get the logits for the generated data

        # Calculate discriminator loss using generated and real logits
        real_loss = tf.cast(tf.reduce_mean(D_real), tf.float32)
        generated_loss = tf.cast(tf.reduce_mean(D_generated), tf.float32)
        d_cost = tf.subtract(generated_loss ,real_loss)  # type: ignore #  wasserstein loss

        # Calculate the gradient penalty
        gp = self.gradient_penalty(batch_size, real_output, generated_output)

        # Add the gradient penalty to the original discriminator loss
        d_loss = tf.add(d_cost, tf.multiply(gp ,self.gp_lambda))  # type: ignore

        return d_loss

    @tf.function 
    def trainGeneratorOneStep(self, real_input, real_price, past_y): # train the generator for one step
        print('train g one step traced')
        # generate fake output
        generated_data = self.generator(real_input, training=True)  # type: ignore
        generated_data_reshape = tf.reshape(generated_data, [generated_data.shape[0], generated_data.shape[1], 1])  # type: ignore # type: ignore
        generated_output = tf.concat([tf.cast(past_y, tf.float32), generated_data_reshape], axis=1)

        real_y_reshape = tf.reshape(real_price, [real_price.shape[0], real_price.shape[1], 1])

        # Get the discriminator logits for fake data
        G_generated = self.discriminator(generated_output, training=True)  # type: ignore

        # Calculate the generator loss
        g_mse = tf.reduce_mean(keras.losses.MSE(real_y_reshape, generated_data_reshape))
        g_rmse = tf.sqrt(g_mse)
        g_mae = tf.reduce_mean(keras.losses.MAE(real_y_reshape, generated_data_reshape))
        g_mape = tf.reduce_mean(keras.losses.MAPE(real_y_reshape, generated_data_reshape))
        g_sign = tf.reduce_mean(tf.abs(tf.subtract(tf.sign(tf.cast(real_y_reshape, tf.float32)), tf.sign(generated_data_reshape))))
        g_mean = (-tf.reduce_mean(G_generated))
        g_loss = g_mean + (self.lambda_1) * (g_mse) + (self.lambda_2) * (g_sign)

        return g_mse, g_sign, g_loss, g_rmse, g_mae, g_mape

    @tf.function
    def getGeneratorPredictions(self, xt_test): # get the predictions from the generator
        predictions = self.generator(xt_test)  
        return predictions

    def train_step(self, data_generator, trainDOneStep, trainGOneStep): # train the model for one epoch
        # Training the discriminator for n_discriminator times
        print("------------------DISC---------------------")
        for critic_iter in range(self.n_discriminator):
            batch_d_losses = []
            batch_no = 1

            with tf.GradientTape() as d_tape:
                for batch_x, batch_y, batch_past_y in data_generator:
                    batch_d_loss = trainDOneStep(batch_x, batch_y, batch_past_y, self.batchSize)
                    batch_d_losses.append(batch_d_loss)

                    # individual batch losses for discriminator
                    broadcastTrainingBatchLosses(
                        model="discriminator",
                        uid=self.uid,
                        total_training_batches=self.total_training_batches,                        
                        batch_no=batch_no,
                        batch_size=self.batchSize,
                        batch_d_loss=batch_d_loss,
                        critic_iter=critic_iter,
                        batch_g_loss=None,
                        )
                    batch_no = batch_no + 1

                d_loss = tf.reduce_mean(batch_d_losses)
                print(f"D Loss for {critic_iter + 1} : {float(d_loss)}")

            # Get the gradients w.r.t the discriminator loss
            d_grads = d_tape.gradient(d_loss, self.discriminator.trainable_variables)
            # Update the weights of the discriminator using the discriminator optimizer
            self.d_optimizer.apply_gradients(zip(d_grads, self.discriminator.trainable_variables))  # type: ignore

        # Training the generator once
        batch_no = 1
        batch_g_mse_ = []
        batch_g_sign_ = []
        batch_g_losses = []
        batch_g_rmse_ = []
        batch_g_mae_ = []
        batch_g_mape_ = []

        print("------------------GENE---------------------")
        with tf.GradientTape() as g_tape:
            for batch_x, batch_y, batch_past_y in data_generator:
                (
                    batch_g_mse,
                    batch_g_sign,
                    batch_g_loss,
                    batch_g_rmse,
                    batch_g_mae,
                    batch_g_mape,
                ) = trainGOneStep(batch_x, batch_y, batch_past_y)
                batch_g_mse_.append(batch_g_mse)
                batch_g_sign_.append(batch_g_sign)
                batch_g_losses.append(batch_g_loss)
                batch_g_rmse_.append(batch_g_rmse)
                batch_g_mae_.append(batch_g_mae)
                batch_g_mape_.append(batch_g_mape)

                # individual batch losses for generator
                broadcastTrainingBatchLosses(
                        model="generator",
                        uid=self.uid,
                        total_training_batches=self.total_training_batches,                        
                        batch_no=batch_no,
                        batch_size=self.batchSize,
                        batch_d_loss=None,
                        critic_iter=None,
                        batch_g_loss=batch_g_loss,
                        )
                batch_no = batch_no + 1

            g_mse = tf.reduce_mean(batch_g_mse_)
            g_sign = tf.reduce_mean(batch_g_sign_)
            g_loss = tf.reduce_mean(batch_g_losses)
            g_rmse = tf.reduce_mean(batch_g_rmse_)
            g_mae = tf.reduce_mean(batch_g_mae_)
            g_mape = tf.reduce_mean(batch_g_mape_)

            print(f"G Loss : {float(g_loss)}")

        # Get the gradients w.r.t the generator loss
        g_grads = g_tape.gradient(g_loss, self.generator.trainable_variables)
        # Update the weights of the generator using the generator optimizer
        self.g_optimizer.apply_gradients(zip(g_grads, self.generator.trainable_variables))  # type: ignore

        return (
            {
                "discriminator_loss": d_loss,  # type: ignore
                "generator_loss": g_loss,
                "g_mse": g_mse,
                "g_sign": g_sign,
                "g_rmse": g_rmse,
                "g_mae": g_mae,
                "g_mape": g_mape,
            }
        )

    def validateOnTest(self, epoch, fw_test_real): # validate the generator on test data
        # validate the model
        if (self.xt_test is None) or (self.yt_test is None):
            xt_t, yt_t, past_yt_t = transform_data(self.xTest_norm, self.yTest_norm, self.time_step, self.look_ahead, type_='training')
            self.xt_test = xt_t
            self.yt_test = yt_t
            xt_test = xt_t
            yt_test = yt_t
        else:
            xt_test = self.xt_test
            yt_test = self.yt_test

        predictions = self.getGeneratorPredictions(xt_test)  # type: ignore

        if self.tb_logging:
            plot_intermediate_predictions(
                self.y_scalar,
                self.intermediate_result_step,
                self.logs_dir,
                epoch,
                yt_test,
                fw_test_real,
                predictions,
            )

        g_mse_val = tf.reduce_mean(keras.losses.MSE(yt_test, predictions))
        g_rmse_val = tf.sqrt(g_mse_val)
        g_sign_val = tf.reduce_mean(tf.abs(tf.sign(tf.cast(yt_test, 'float32')) - tf.sign(predictions)))  # type: ignore
        g_mae_val = tf.reduce_mean(keras.losses.MAE(yt_test, predictions))
        g_mape_val = tf.reduce_mean(keras.losses.MAPE(yt_test, predictions))

        message = {
            "validation_metrics": {
                "mse": np.array(g_mse_val).tolist(),  # Convert ndarray to list
                "sign": np.array(g_sign_val).tolist(),  # Convert ndarray to list
                "rmse": np.array(g_rmse_val).tolist(),  # Convert ndarray to list
                "mae": np.array(g_mae_val).tolist(),  # Convert ndarray to list
                "mape": np.array(g_mape_val).tolist(),  # Convert ndarray to list
            }
        }

        print(f"Val MSE : {g_mse_val}, Val Sign : {g_sign_val}")
        return message

    def generateForecast(self, forecast_type, epoch=None): # generate the forecast
        if (self.xTest_norm is None) or (self.yTest_norm is None):
            xTest_norm = self.x_scalar.transform(self.test_data)  # type: ignore
            yTest_norm = self.y_scalar.transform(getYLabels(self.test_data, self.transformation_order, self.to_predict, len(self.test_data.columns)))  # type: ignore
        else:
            xTest_norm = self.xTest_norm
            yTest_norm = self.yTest_norm

        xt_f, yt_f, past_yt_f = transform_data(xTest_norm, yTest_norm, self.time_step, self.look_ahead, type_='forecast')
        # x_train_np = xt_f

        predictions = self.getGeneratorPredictions(xt_f)  # type: ignore
        predictions_ = np.array(predictions)
        predictions_1d = predictions_.reshape(-1, 1)  # type: ignore
        predictions_scaled = self.y_scalar.inverse_transform(predictions_1d)  # type: ignore
        predictions_2d = predictions_scaled.reshape([predictions_.shape[0], predictions_.shape[1]])  # type: ignore
        predictions_df = pd.DataFrame(predictions_2d)  # scaled predictions

        fill_values = predictions_df.iloc[-1, 1:]  # last prediction values to fill the forecast

        null_data_df = pd.DataFrame(np.full((self.look_ahead-1, self.look_ahead), np.nan))  # creating null data for shifting
        predictions_df = pd.concat([predictions_df, null_data_df], ignore_index=True)  # adding additional rows for forecast

        for col_index, col_name in enumerate(predictions_df.columns):  # shifting the columns to match the dates
            predictions_df[col_name] = predictions_df[col_name].shift(periods=col_index, fill_value=None)

        for i in range(len(fill_values)):  # filling the last values
            idx = len(predictions_df) - (i + 1)
            predictions_df.iloc[idx, :-1] = predictions_df.iloc[idx, :-1].fillna(fill_values[len(fill_values) - i])

        dates_redis = redisStore.hget(self.process_id, "dates")
        dates_df = pd.DataFrame.from_dict(json.loads(dates_redis))  # type: ignore

        buffered_dates = generate_additional_dates(dates_df, self.look_ahead)  # adding additional dates for forecast - future dates

        combined_final = buffered_dates.join(predictions_df).astype('str')

        if forecast_type == 'final_forecast':
            pred_array_obj = combined_final.to_dict(orient='records')

            final_predictions = combined_final.values
            rmse = calculatePredictomRMSE(final_predictions, self.look_ahead)

            redisStore.hmset(self.process_id, {"predictions": json.dumps(pred_array_obj), "forecast_rmse": json.dumps(rmse)})
        else:
            first_pred_df = combined_final.iloc[:, :3]
            first_pred_array_obj = first_pred_df.to_dict(orient='records')

            first_predictions = first_pred_df.values
            first_rmse = calculatePredictomRMSE(first_predictions, self.look_ahead)

            broadcastTrainingStatus(self.uid, "intermediate_forecast", {"data": first_pred_array_obj, "rmse": first_rmse, "epoch": epoch})

    def generatedConcreteFunctions(self): # Creating the concrete functions for the train steps, discriminator and generator
        broadcastTrainingStatus(self.uid, "notify", "(9) : Tracing Discriminator and Generator functions...")
        trainDOneStep = self.trianDiscriminatorOneStep.get_concrete_function( 
            tf.TensorSpec(shape=[self.batchSize, self.time_step, self.feature_size], dtype=tf.float64),  # real_input
            tf.TensorSpec(shape=[self.batchSize, self.look_ahead], dtype=tf.float64),  # real_price
            tf.TensorSpec(shape=[self.batchSize, self.time_step, tf.constant(1)], dtype=tf.float64),  # past_y
            tf.TensorSpec(shape=[], dtype=tf.int32),    # batch_size
            )

        trainGOneStep = self.trainGeneratorOneStep.get_concrete_function(
            tf.TensorSpec(shape=[self.batchSize, self.time_step, self.feature_size], dtype=tf.float64),
            tf.TensorSpec(shape=[self.batchSize, self.look_ahead], dtype=tf.float64),
            tf.TensorSpec(shape=[self.batchSize, self.time_step, 1], dtype=tf.float64)
        )
        broadcastTrainingStatus(self.uid, "notify", "(9) : Discriminator and Generator functions traced...")

        return trainDOneStep, trainGOneStep

    def generate_epoch_end_message(self, epoch, loss):  # generate the message to broadcast to the client
        message = {  # message to broadcast to the client ( Training )
            "epoch": epoch + 1,
            "log": {
                "memory": loss["epoch_ram_diff"],
                "losses": {
                    "discriminator_loss": np.array(loss["discriminator_loss"]).tolist(),  # Convert ndarray to list
                    "generator_loss": np.array(loss["generator_loss"]).tolist(),  # Convert ndarray to list
                },
                "training_metrics": {
                    "mse": np.array(loss["g_mse"]).tolist(),  # Convert ndarray to list
                    "sign": np.array(loss["g_sign"]).tolist(),  # Convert ndarray to list
                    "rmse": np.array(loss["g_rmse"]).tolist(),  # Convert ndarray to list
                    "mae": np.array(loss["g_mae"]).tolist(),  # Convert ndarray to list
                    "mape": np.array(loss["g_mape"]).tolist(),  # Convert ndarray to list
                },
            },
        }
        return message

    def train(self): # train the model
        if self.tb_logging: # initialize the file writers if true
            file_writers = initFileWriters(self.logs_dir)
            print(f'tensorboard --logdir={self.logs_dir}')
        else:
            file_writers={}

        self.process_data()  # process the data
        
        epoch_start = 0
        epoch_end = self.epochs
        if self.re_train:
            removeSavedModels(self.model_id, self.checkpoint) # Removing the models greater than selected checkpoint 
            
            latest_saved = int(self.checkpoint.split("_")[1])
            print(f"Last saved checkpoint : {latest_saved}")
            epoch_start = latest_saved
            epoch_end = latest_saved + self.epochs
            self.epochs = epoch_end
            print(f"Epoch start : {epoch_start}, Epoch end : {epoch_end}")
            
        start = time.time()
        dataset_ = tf.data.Dataset.from_tensor_slices((self.x_train, self.y_train, self.past_y_train))
        data_generator = dataset_.batch(self.batchSize).prefetch(tf.data.experimental.AUTOTUNE)
        print(f"Time taken DATA GENE:, {time.time() - start}")

        trainDOneStep, trainGOneStep = self.generatedConcreteFunctions()  # get the concrete functions

        start_time = time.time()
        ram_beg_train = psutil.virtual_memory()
        broadcastTrainingStatus(self.uid, "notify", "(10) : Training has started...")
        logging.critical(f"{self.process_id} : Training started")
        # with tf.profiler.experimental.Profile(self.logs_dir, tf.profiler.experimental.ProfilerOptions(python_tracer_level=1)):
        for epoch in range(epoch_start, epoch_end): # training the model
            broadcastTrainingStatus(self.uid, "epochBegin", epoch)
            logging.error(f"epoch {epoch + 1} of {self.epochs}")
            epoch_start_time = time.time()
            train_ram_start = psutil.virtual_memory()

            loss = self.train_step(data_generator,trainDOneStep,trainGOneStep) # Train the model for one

            train_ram_end = psutil.virtual_memory()
            epoch_ram_diff = (train_ram_end.used / (1024 ** 2)) - (train_ram_start.used / (1024 ** 2))
            loss['epoch_ram_diff'] = epoch_ram_diff

            if self.model_save_checkpoint > 0 and ((epoch + 1) % self.model_save_checkpoint == 0):  # save the model after every model_save_checkpoint epochs
                saveModel(epoch, self.model_id, self.generator)

            if self.intermediate_result_step > 0 and (epoch + 1) % self.intermediate_result_step == 0:  # generate the forecast after every intermediate_result epochs
                self.generateForecast('intermediate_forecast', epoch + 1)

            message = self.generate_epoch_end_message(epoch, loss)  # generate the message to broadcast to the client ( Training )

            if self.do_validation: # validate test data if true
                fw_test_real = file_writers.get("test/test_real") or None
                val_message = self.validateOnTest(epoch,fw_test_real=fw_test_real)

                message["log"]["validation_metrics"] = val_message["validation_metrics"] # message to broadcast to the client ( Validation )

            if self.tb_logging: # logging of train losses for tensorboard 
                log_training_metrics(  # log the training metrics for tensorboard
                    loss,
                    epoch,
                    fw_d_loss=file_writers["losses/d_loss"],
                    fw_g_loss=file_writers["losses/g_loss"],
                    fw_g_mse=file_writers["metrics/g_mse"],
                    fw_g_sign=file_writers["metrics/g_sign"],
                    fw_g_rmse=file_writers["metrics/rmse"],
                    fw_g_mae=file_writers["metrics/mae"],
                    fw_g_mape=file_writers["metrics/mape"],
                    fw_memory=file_writers["metrics_memory/train_memory"]
                )

                if self.do_validation:
                    plot_validation_metrics(
                        val_losses=val_message["validation_metrics"],
                        epoch=epoch,
                        fw_validation_pred_mse=file_writers["validation/pred_mse"],
                        fw_validation_pred_sign=file_writers["validation/pred_sign"],
                        fw_validation_pred_rmse=file_writers["validation/pred_rmse"],
                        fw_validation_pred_mae=file_writers["validation/pred_mae"],
                        fw_validation_pred_mape=file_writers["validation/pred_mape"],
                    )

            epoch_end_time = time.time() - epoch_start_time
            print(f"D Loss: {loss['discriminator_loss'].numpy():.6f}, G Loss: {loss['generator_loss'].numpy():.6f}, Time taken: {epoch_end_time:.6f} sec, Step Time : {epoch_end_time / ((self.n_discriminator + 1)*self.total_training_batches):.6f} sec")

            broadcastTrainingStatus(self.uid, "epochEnd", message)

        logging.critical(f"{self.process_id} : Training completed")

        ram_aft_train = psutil.virtual_memory()
        ram_diff = (ram_aft_train.used / (1024 ** 2)) - (ram_beg_train.used / (1024 ** 2))
        logging.error(f"Memory usage : {ram_diff}")
        logging.error(f"Training time: {time.time() - start_time} sec")

        if(self.model_save_checkpoint == 0):
            saveModel(self.epochs - 1, self.model_id, self.generator)
        elif(self.epochs % self.model_save_checkpoint != 0):
            saveModel(self.epochs - 1, self.model_id, self.generator)

        saveTrainScalers(self.model_id, self.x_scalar, self.y_scalar)

        if self.tb_logging:
            closeFileWriters(file_writers)
            print(f'tensorboard --logdir={self.logs_dir}')

        broadcastTrainingStatus(self.uid, "trainingEnd", "Training completed")
        broadcastTrainingStatus(self.uid, "notify", "(10) : Training completed")

        # make the foreacst on the test data
        self.generateForecast('final_forecast')
        broadcastTrainingStatus(self.uid, "prediction_completed", "Training completed", process_id=self.process_id)

        K.clear_session()

        return '(WORKER) : Training Completed!!'  # type: ignore

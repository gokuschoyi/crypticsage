from unicodedata import category
import uuid
from keras.layers import Bidirectional, LSTM, Dense, Flatten, Conv1D, Dropout, LeakyReLU
from .util import scalar_function, tranform_data, generate_batches, yield_batches
from keras.initializers import RandomNormal
from dotenv import load_dotenv
from keras import Sequential
from keras import backend as K
import tensorflow as tf
import datetime as dt
import pandas as pd
import numpy as np
import logging
import psutil
import redis
import keras
import json
import time
import os


# Load environment variables from the .env file
load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port)  # type: ignore
redisPubSubConn = redis.Redis(host=redis_host, port=redis_port)  # type: ignore


def Generator(weight_initializer, input_dim, feature_size, output_dim) -> keras.models.Model:
    model = Sequential()
    model.add(
        Conv1D(
            32,
            kernel_size=2,
            strides=1,
            padding="same",
            kernel_initializer=weight_initializer,
            batch_input_shape=(None, input_dim, feature_size),
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(
        Bidirectional(
            LSTM(
                64,
                activation="relu",
                kernel_initializer=weight_initializer,
                return_sequences=False,
                dropout=0.3,
                recurrent_dropout=0.0,
            )
        )
    )
    # model.add(Flatten())

    model.add(Dense(64, activation="linear"))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))
    model.add(Dense(32, activation="linear"))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))

    model.add(Dense(output_dim))
    return model


def Discriminator(weight_initializer, time_step, look_ahead) -> keras.models.Model:
    model = Sequential()
    model.add(
        Conv1D(
            32,
            kernel_size=2,
            strides=1,
            kernel_initializer=weight_initializer,
            padding="same",
            input_shape=(time_step + look_ahead, 1),
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(
        Conv1D(
            64,
            kernel_size=2,
            strides=1,
            kernel_initializer=weight_initializer,
            padding="same",
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(Flatten())

    model.add(Dense(64, activation="linear", use_bias=True))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))
    model.add(Dense(32, activation="linear", use_bias=True))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))

    model.add(Dense(1, activation="linear"))
    return model


# train the wgan model


class WGANGP(keras.models.Model):
    def __init__(self, process_id, uid, model_id, training_parameters):
        super(WGANGP, self).__init__()
        self.logs_dir = "logs/" + model_id
        self.generator = None
        self.discriminator = None
        self.model_save_checkpoint = 50
        self.global_step = 1
        self.n_discriminator = 3
        self.gp_lambda = 10
        self.lambda_1 = 0.5  # => adding extra losses significatively speeds up training and convergence)
        self.lambda_2 = 0.5  # => adding extra losses significatively speeds up training and convergence
        self.d_optimizer = keras.optimizers.Adam(learning_rate=0.0004, beta_1=0.5, beta_2=0.9)
        self.g_optimizer = keras.optimizers.Adam(learning_rate=0.0001, beta_1=0.5, beta_2=0.9)
        self.uid = uid
        self.process_id = process_id
        self.model_id = model_id
        self.to_predict = training_parameters['to_predict']
        self.training_size = training_parameters['training_size']
        self.time_step = training_parameters['time_step']
        self.look_ahead = training_parameters['look_ahead']
        self.feature_size = len(training_parameters['transformation_order'])
        self.epochs = training_parameters['epochs']
        self.batchSize = training_parameters['batchSize']
        self.transformation_order = training_parameters['transformation_order']
        self.do_validation = training_parameters['do_validation']
        self.early_stopping_flag = training_parameters['early_stopping_flag']

        self.features_df = pd.DataFrame()  # features dataframe loaded from redis
        self.split_index = None  # split index for train and test data

        self.train_data = pd.DataFrame()  # train data - original values xTrain
        self.test_data = pd.DataFrame()  # test data
        # self.y_labels = pd.DataFrame()  # y labels from train data -original values yTrain

        self.x_scalar = None  # x scalar
        self.y_scalar = None  # y scalar

        self.xTrain_norm = None  # normalized x train data
        self.yTrain_norm = None  # normalized y train data

        self.xTest_norm = None  # normalized x test data
        self.yTest_norm = None  # normalized y test data

        self.x_train = None  # transformed x train data
        self.y_train = None  # transformed y train data
        self.past_y_train = None  # transformed past y train data

        self.real_input_batches = None  # real input batches
        self.real_price_batches = None  # real price batches
        self.past_y_batches = None  # past y batches

        self.broadcastTrainingStatus("notify", "WGAN_GP class initialized successfully")

    def get_model_config(self):
        return {
            "time_step": self.time_step,
            "look_ahead": self.look_ahead,
            "process_id": self.process_id,
            "to_predict": self.to_predict,
            "training_size": self.training_size,
            "epochs": self.epochs,
            "batchSize": self.batchSize,
            "do_validation": self.do_validation,
            "early_stopping_flag": self.early_stopping_flag,
            "model_id ": self.model_id,
        }

    def broadcastTrainingStatus(self, event, message):
        match event:
            case "notify":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "notify", "uid": self.uid, "message": message}),
                )
            case "epochBegin":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "epochBegin", "uid": self.uid, "epoch": message}),
                )
            case "epochEnd":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "epochEnd", "uid": self.uid, "epoch": message['epoch'], "log": message['log']})
                )
            case "batchEnd":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "batchEnd", "uid": self.uid, "batch": message['batch'], "log": message['log']})
                )
            case "trainingEnd":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "trainingEnd", "uid": self.uid})
                )
            case "error":
                redisPubSubConn.publish(
                    "model_training_channel",
                    json.dumps({"event": "error", "uid": self.uid, "message": message}),
                )

    # fetch the features from redis and convert it to pandas dataframe. Also saves the split indes for train and test data
    def fetchFeaturesFromRedis(self):
        features_redis = redisStore.hget(self.process_id, "features")
        df = pd.DataFrame.from_dict(json.loads(features_redis))  # type: ignore
        print(df.head(10))
        print(df.tail(10))
        self.features_df = df  # type: ignore

        logging.info(f"Features shape : {self.features_df.shape}")
        # calculate the split index based on training size
        self.split_index = int((self.training_size * self.features_df.shape[0]) / 100)

    # split the data into train and test sets based on split index
    def splitDataToTrainAndTest(self):
        self.train_data = self.features_df.iloc[:self.split_index, :]
        self.test_data = self.features_df.iloc[self.split_index:, :]
        logging.info(f"Train data shape : {self.train_data.shape}")
        logging.info(f"Test data shape : {self.test_data.shape}")

    # get the y labels from the train data
    def getYLabels(self, data):
        index = None
        for i, item in enumerate(self.transformation_order):
            if item["value"] == self.to_predict:
                index = i
                break

        y_labels = data.iloc[
            :, [i for i in range(len(self.train_data.columns)) if i == index]
        ]
        return y_labels

    def normalizetrainingData(self):
        y_labels_train = self.getYLabels(self.train_data)
        X_Scalar, Y_Scalar = scalar_function(self.train_data, y_labels_train)
        self.xTrain_norm = X_Scalar.transform(self.train_data)
        self.yTrain_norm = Y_Scalar.transform(y_labels_train)

        if self.do_validation:
            self.xTest_norm = X_Scalar.transform(self.test_data)
            self.yTest_norm = Y_Scalar.transform(self.getYLabels(self.test_data))

            print(f"X test norm shape : {self.xTest_norm.shape}")
            print(f"Y test norm shape : {self.yTest_norm.shape}")

        self.x_scalar = X_Scalar
        self.y_scalar = Y_Scalar

        logging.info(f"X train norm shape : {self.xTrain_norm.shape}")
        logging.info(f"Y train norm shape : {self.yTrain_norm.shape}")
        self.broadcastTrainingStatus("notify", "(6) : Training data normalized...")

    def transformDataForTraining(self):
        xT, yT, past_yT = tranform_data(self.xTrain_norm, self.yTrain_norm)

        print(f"X train shape : {np.array(xT).shape}")
        print(f"y train shape : {np.array(yT).shape}")
        print(f"past y shape : {np.array(past_yT).shape}")

        print("-------------------------")

        self.x_train = np.array(xT)
        self.y_train = np.array(yT)
        self.past_y_train = np.array(past_yT)
        self.broadcastTrainingStatus("notify", "(7) : Training data created...")

        xtSize = self.x_train.nbytes
        ytSize = self.y_train.nbytes
        pytSize = self.past_y_train.nbytes
        print(f"Memory size of the array in bytes: {xtSize}")
        print(f"Memory size of the array in bytes: {ytSize}")
        print(f"Memory size of the array in bytes: {pytSize}")
        print(f"Total memory in bytes: {round((xtSize+ytSize+pytSize)/ (1000*1000),3)} MB")

    # @tf.function
    # def _trace_generator(self, input_data):
    #     print(input_data.shape)
    #     return self.generator(input_data, training=False)  # type: ignore

    def initializeModels(self):
        # writer = tf.summary.create_file_writer(self.logs_dir)  # type: ignore

        weight_initializer = RandomNormal(mean=0.00, stddev=0.02, seed=42)
        self.generator = Generator(weight_initializer, self.time_step, self.feature_size, self.look_ahead)
        self.discriminator = Discriminator(weight_initializer, self.time_step, self.look_ahead)

        # tf.summary.trace_on(graph=True, profiler=True)  # type: ignore
        # self._trace_generator(tf.zeros((1, self.time_step, self.feature_size)))

        # with writer.as_default():
        #     tf.summary.trace_export(  # type: ignore
        #         name="generator_trace",
        #         step=0,
        #         profiler_outdir=self.logs_dir)
        #     writer.flush()
        # writer.close()
        self.broadcastTrainingStatus("notify", "(8) : Generator and Discriminator model initialized...")

    def generateBatches(self):
        self.real_input_batches = generate_batches(self.x_train, self.batchSize)
        self.real_price_batches = generate_batches(self.y_train, self.batchSize)
        self.past_y_batches = generate_batches(self.past_y_train, self.batchSize)

        self.broadcastTrainingStatus("notify", "(9) : Batches generated...")

    def gradient_penalty(self, batch_size, real_output, generated_output) -> tf.Tensor:
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
        norm = tf.sqrt(tf.reduce_sum(tf.square(grads), axis=[1, 2]))
        gp = tf.reduce_mean((norm - 1.0) ** 2)
        return gp

    @tf.function
    def trianDiscriminatorOneStep(self, real_input, real_price, past_y, batch_size):
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
        d_cost = generated_loss - real_loss  # type: ignore #  wasserstein loss

        # Calculate the gradient penalty
        gp = self.gradient_penalty(batch_size, real_output, generated_output)

        # Add the gradient penalty to the original discriminator loss
        d_loss = d_cost + gp * self.gp_lambda  # type: ignore

        return d_loss

    @tf.function
    def trainGeneratorOneStep(self, real_input, real_price, past_y):
        # generate fake output
        generated_data = self.generator(real_input, training=True)  # type: ignore
        generated_data_reshape = tf.reshape(generated_data, [generated_data.shape[0], generated_data.shape[1], 1])  # type: ignore # type: ignore
        generated_output = tf.concat([tf.cast(past_y, tf.float32), generated_data_reshape], axis=1)

        real_y_reshape = tf.reshape(real_price, [real_price.shape[0], real_price.shape[1], 1])

        # Get the discriminator logits for fake data
        G_generated = self.discriminator(generated_output, training=True)  # type: ignore

        # Calculate the generator loss
        g_mse = tf.reduce_mean(keras.losses.MSE(real_y_reshape, generated_data_reshape))
        g_sign = tf.reduce_mean(tf.abs(tf.subtract(tf.sign(tf.cast(real_y_reshape, 'float32')), tf.sign(generated_data_reshape))))
        g_mean = (1) * (-tf.reduce_mean(G_generated))
        g_loss = g_mean + (self.lambda_1) * (g_mse) + (self.lambda_2) * (g_sign)

        return g_mse, g_sign, g_loss, generated_data

    def train_step(
        self,
        epoch,
        file_writer_d_batch_loss,
        file_writer_g_batch_loss,
        file_writer_trainStep_memory,
    ):
        train_ram_start = psutil.virtual_memory()
        batch_d_losses = []
        for _ in range(self.n_discriminator):
            batch_generator = yield_batches(self.x_train, self.y_train, self.past_y_train, self.batchSize)
            batch_no = 1
            batch_d_losses = []
            print("------------------DISC---------------------")

            with tf.GradientTape() as d_tape:
                for batch_x, batch_y, batch_past_y in batch_generator:
                    batch_size = batch_x.shape[0]
                    batch_d_loss = self.trianDiscriminatorOneStep(batch_x, batch_y, batch_past_y, batch_size)
                    batch_d_losses.append(batch_d_loss)
                    print(f'Batch loss (Discriminator) for {batch_no} : {np.array(batch_d_loss)}')

                    message = {
                        "batch": batch_no,
                        "log": {
                            "model": "discriminator",
                            "batch": batch_no,
                            "size": batch_size,
                            "loss": np.array(batch_d_loss).tolist(),  # Convert ndarray to list
                            # "totalNoOfBatch": total_batches
                        }
                    }
                    self.broadcastTrainingStatus("batchEnd", message)
                    batch_no = batch_no + 1

                d_loss = tf.reduce_mean(batch_d_losses)
                print(f"d_loss : {np.array(d_loss)}")

                # Get the gradients w.r.t the discriminator loss
                d_grads = d_tape.gradient(d_loss, self.discriminator.trainable_variables)  # type: ignore
                # Update the weights of the discriminator using the discriminator optimizer
                self.d_optimizer.apply_gradients(zip(d_grads, self.discriminator.trainable_variables))  # type: ignore
                del d_grads

        print("------------------GENE---------------------")
        batch_generator = yield_batches(self.x_train, self.y_train, self.past_y_train, self.batchSize)
        batch_no = 1
        batch_g_losses = []
        batch_g_mse_ = []
        batch_g_sign_ = []
        batches_generated_data = np.empty((0, self.look_ahead))  # type: ignore
        with tf.GradientTape() as g_tape:
            for batch_x, batch_y, batch_past_y in batch_generator:
                batch_size = batch_x.shape[0]
                batch_g_mse, batch_g_sign, batch_g_loss, generated_data = self.trainGeneratorOneStep(batch_x, batch_y, batch_past_y)  # type: ignore
                batch_g_mse_.append(batch_g_mse)
                batch_g_sign_.append(batch_g_sign)
                batch_g_losses.append(batch_g_loss)
                batches_generated_data = np.concatenate((batches_generated_data, generated_data), axis=0)  # type: ignore
                print(f'Batch loss (Generater) for {batch_no} : {np.array(batch_g_loss)}')

                with file_writer_d_batch_loss.as_default():
                    tf.summary.scalar("batch_losses", batch_d_losses[batch_no - 1], self.global_step)  # type: ignore
                    file_writer_d_batch_loss.flush()

                with file_writer_g_batch_loss.as_default():
                    tf.summary.scalar("batch_losses", batch_g_loss, self.global_step)
                    file_writer_g_batch_loss.flush()

                self.global_step = self.global_step + 1

                message = {
                    "batch": batch_no,
                    "log": {
                        "model": "generator",
                        "batch": batch_no,
                        "size": batch_size,
                        "loss": np.array(batch_g_loss).tolist(),  # Convert ndarray to list
                        "g_mse": np.array(batch_g_mse).tolist(),  # Convert ndarray to list
                        "g_sign": np.array(batch_g_sign).tolist(),  # Convert ndarray to list
                        # "totalNoOfBatch": total_batches
                    }
                }
                self.broadcastTrainingStatus("batchEnd", message)
                batch_no = batch_no + 1

            g_loss = tf.reduce_mean(batch_g_losses)
            g_mse = tf.reduce_mean(batch_g_mse_)
            g_sign = tf.reduce_mean(batch_g_sign_)

            print(f"g_loss : {np.array(g_loss)}")

            # Get the gradients w.r.t the generator loss
            g_grads = g_tape.gradient(g_loss, self.generator.trainable_variables)  # type: ignore
            # Update the weights of the generator using the generator optimizer
            self.g_optimizer.apply_gradients(zip(g_grads, self.generator.trainable_variables))  # type: ignore
            del g_grads

        train_ram_end = psutil.virtual_memory()
        batch_ram_diff = (train_ram_end.used / (1024 ** 2)) - (train_ram_start.used / (1024 ** 2))

        with file_writer_trainStep_memory.as_default():
            tf.summary.scalar("memory", batch_ram_diff, epoch + 1)
            file_writer_trainStep_memory.flush()

        return (
            batches_generated_data,
            {"discriminator_loss": d_loss, "generator_loss": g_loss, "g_mse": g_mse, "g_sign": g_sign}  # type: ignore
        )

    def train(self):
        start_time = time.time()
        real_upscaled = self.y_scalar.inverse_transform(np.array(self.y_train))  # type: ignore
        real_price = np.array(real_upscaled)
        print(self.logs_dir)

        file_writer_d_loss = tf.summary.create_file_writer(self.logs_dir + "/metrics/d_loss")  # type: ignore
        file_writer_g_loss = tf.summary.create_file_writer(self.logs_dir + "/metrics/g_loss")  # type: ignore
        file_writer_g_mse = tf.summary.create_file_writer(self.logs_dir + "/metrics/g_mse")  # type: ignore
        file_writer_g_sign = tf.summary.create_file_writer(self.logs_dir + "/metrics/g_sign")  # type: ignore

        file_writer_d_batch_loss = tf.summary.create_file_writer(self.logs_dir + "/metrics_batch/d_batch_loss")  # type: ignore
        file_writer_g_batch_loss = tf.summary.create_file_writer(self.logs_dir + "/metrics_batch/g_batch_loss")  # type: ignore
        file_writer_trainStep_memory = tf.summary.create_file_writer(self.logs_dir + "/metrics_memory/train_memory")  # type: ignore

        file_writer_predictions_pred_mse = tf.summary.create_file_writer(self.logs_dir + "/predictions/pred_mse")  # type: ignore
        file_writer_predictions_pred_sign = tf.summary.create_file_writer(self.logs_dir + "/predictions/pred_sign")  # type: ignore

        fw_test_real = tf.summary.create_file_writer(self.logs_dir + "/test/test_real")  # type: ignore

        ram_beg_train = psutil.virtual_memory()
        # train the model
        for epoch in range(self.epochs):
            self.broadcastTrainingStatus("epochBegin", epoch + 1)
            logging.error(f"epoch {epoch + 1} of {self.epochs}")

            generated_data, loss = self.train_step(
                epoch,
                file_writer_d_batch_loss,
                file_writer_g_batch_loss,
                file_writer_trainStep_memory,
            )

            print(f"Discriminator Loss: {loss['discriminator_loss'].numpy()}, Generator Loss: {loss['generator_loss'].numpy()}")
            with file_writer_d_loss.as_default():
                tf.summary.scalar("losses", loss["discriminator_loss"].numpy(), epoch+1)
                file_writer_d_loss.flush()

            with file_writer_g_loss.as_default():
                tf.summary.scalar("losses", loss["generator_loss"].numpy(), epoch+1)
                file_writer_g_loss.flush()

            with file_writer_g_mse.as_default():
                tf.summary.scalar("losses", loss["g_mse"], epoch + 1)  # type: ignore
                file_writer_g_mse.flush()

            with file_writer_g_sign.as_default():
                tf.summary.scalar("losses", loss["g_sign"], epoch + 1)  # type: ignore
                file_writer_g_sign.flush()

            if ((epoch + 1) % self.model_save_checkpoint == 0):
                print('saving model weights')

                # Generate a unique ID for the subfolder
                subfolder_id = uuid.uuid4()
                main_folder_path = f'./saved_models/{self.model_id}'
                subfolder_path = f'{main_folder_path}/{subfolder_id}'

                # Create the main folder and subfolder if they don't exist
                if not os.path.exists(subfolder_path):
                    os.makedirs(subfolder_path)

                # Save the model in a file with the name of the epoch
                file_path = f'{subfolder_path}/gen_model_{epoch+1}'
                print(f'model save path : {file_path}')
                self.generator.save_weights(file_path)  # type: ignore

            message = {
                "epoch": epoch + 1,
                "log": {
                    "discriminator_loss": np.array(loss["discriminator_loss"]).tolist(),  # Convert ndarray to list
                    "generator_loss": np.array(loss["generator_loss"]).tolist(),  # Convert ndarray to list
                    "generator_mse": np.array(loss["g_mse"]).tolist(),  # Convert ndarray to list
                    "generator_sign": np.array(loss["g_sign"]).tolist(),  # Convert ndarray to list
                }
            }

            if self.do_validation:
                # validate the model
                xt_test, yt_test, past_yt_test = tranform_data(self.xTest_norm, self.yTest_norm)
                print(f"X test shape : {np.array(xt_test).shape}")
                print(f"y test shape : {np.array(yt_test).shape}")
                print(f"past y test shape : {np.array(past_yt_test).shape}")

                if (epoch / 0.234234 == 0):
                    yt_test_scaled = np.array(self.y_scalar.inverse_transform(np.array(yt_test)))  # type: ignore
                    with fw_test_real.as_default():
                        for step in range(len(yt_test)):
                            tf.summary.scalar("test", yt_test_scaled[step][0], step)
                        fw_test_real.flush()
                    fw_test_real.close()
                predictions = self.generator(np.array(xt_test))  # type: ignore
                print(f"Predictions shape : {np.array(predictions).shape}")
                # type: ignore

                if ((epoch + 1) % self.model_save_checkpoint == 0):
                    predictions_scaled = np.array(self.y_scalar.inverse_transform(np.array(predictions)))  # type: ignore
                    fw_test_pred = tf.summary.create_file_writer(self.logs_dir + f"/test/test_pred_{epoch+1}")  # type: ignore
                    with fw_test_pred.as_default():
                        for step in range(len(np.array(predictions))):
                            tf.summary.scalar("test", predictions_scaled[step][0], step)
                        fw_test_pred.flush()
                    fw_test_pred.close()

                g_mse_val = np.mean(keras.losses.MSE(yt_test, predictions))
                g_sign_val = np.mean(np.abs(np.sign(yt_test) - np.sign(np.array(predictions))))

                with file_writer_predictions_pred_mse.as_default():
                    tf.summary.scalar("test_metric", g_mse_val, epoch + 1)  # type: ignore
                    file_writer_predictions_pred_mse.flush()

                with file_writer_predictions_pred_sign.as_default():
                    tf.summary.scalar("test_metric", g_sign_val, epoch + 1)
                    file_writer_predictions_pred_sign.flush()

                print(f"Validation MSE : {g_mse_val}, Validation Sign : {g_sign_val}")

                message["log"]["generator_mse_val"] = np.array(g_mse_val).tolist()  # Convert ndarray to list # type: ignore
                message["log"]["generator_sign_val"] = np.array(g_sign_val).tolist()  # Convert ndarray to list # type: ignore

            self.broadcastTrainingStatus("epochEnd", message)

        file_writer_d_loss.close()
        file_writer_g_loss.close()
        file_writer_g_mse.close()
        file_writer_g_sign.close()
        file_writer_d_batch_loss.close()
        file_writer_g_batch_loss.close()
        file_writer_trainStep_memory.close()
        file_writer_predictions_pred_mse.close()
        file_writer_predictions_pred_sign.close()

        ram_aft_train = psutil.virtual_memory()
        ram_diff = (ram_aft_train.used / (1024 ** 2)) - (ram_beg_train.used / (1024 ** 2))
        print(f"Memory usage : {ram_diff}")
        print(f"Training time: {time.time() - start_time} sec")
        print(f'tensorboard --logdir={self.logs_dir}')
        self.broadcastTrainingStatus("trainingEnd", "Training completed")
        self.broadcastTrainingStatus("notify", "(10) : Training completed")

        # generated_upscaled = self.y_scalar.inverse_transform(generated_data)  # type: ignore
        # generated_price = np.array(generated_upscaled)

        # with file_writer_predictions_act.as_default():
        #     for step in range(len(real_price)):
        #         tf.summary.scalar("predictions", real_price[step][0], step)
        # file_writer_predictions_act.close()

        # with file_writer_predictions_pred.as_default():
        #     for step in range(len(generated_price)):
        #         tf.summary.scalar("predictions",  generated_price[step][0], step)
        # file_writer_predictions_pred.close()

        K.clear_session()

        return real_price, generated_data  # type: ignore

from sklearn.preprocessing import MinMaxScaler
from dotenv import load_dotenv
import tensorflow as tf
from joblib import dump
import pandas as pd
import numpy as np
import shutil
import redis
import json
import os

# Load environment variables from the .env file
load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port)  # type: ignore
redisPubSubConn = redis.Redis(host=redis_host, port=redis_port)  # type: ignore


def getYLabels(data, transformation_order, to_predict, column_length):  # get the y labels from the train data
    index = None
    for i, item in enumerate(transformation_order):
        if item["value"] == to_predict:
            index = i
            break

    y_labels = data.iloc[
        :, [i for i in range(column_length) if i == index]
    ]
    return y_labels


def scalar_function(x, y):
    X_Scalar = MinMaxScaler(feature_range=(-1, 1))
    Y_Scalar = MinMaxScaler(feature_range=(-1, 1))
    X_Scalar.fit(x)
    Y_Scalar.fit(y)

    return X_Scalar, Y_Scalar


def transform_data(xTrain_norm, yTrain_norm, n_steps_in, n_steps_out, type_):
    X_data = np.array(xTrain_norm)
    y_data = np.array(yTrain_norm)
    X = list()
    y = list()
    past_y = list()
    length = len(X_data)

    for i in range(0, length, 1):
        X_value = X_data[i: i + n_steps_in][:, :]
        y_value = y_data[i + n_steps_in: i + (n_steps_in + n_steps_out)][:, 0]
        past_y_value = y_data[i: i + n_steps_in][:, :]
        if (type_ == 'training'):
            if len(X_value) == n_steps_in and len(y_value) == n_steps_out:
                X.append(X_value)
                y.append(y_value)
                past_y.append(past_y_value)
        else:
            if len(X_value) == n_steps_in:
                X.append(X_value)
                past_y.append(past_y_value)
            if len(y_value) == n_steps_out:
                y.append(y_value)
    del X_data, y_data
    return tf.convert_to_tensor(X), tf.convert_to_tensor(y), tf.convert_to_tensor(past_y)


def generate_additional_dates(dates_df, n):
    # Convert the 'date' column to datetime format
    dates_df['date'] = pd.to_datetime(dates_df['date'], format='%d/%m/%Y, %I:%M:%S %p')

    # Convert the 'date' column to the desired format
    dates_df['date'] = dates_df['date'].dt.strftime('%m/%d/%Y, %I:%M:%S %p')
    
    # Get the last date in the DataFrame
    last_date = dates_df.iloc[-1, 0]

    # Get the frequency of the dates (assuming it's hourly)
    frequency = pd.infer_freq(dates_df['date'])

    # Generate n additional dates
    additional_dates = pd.date_range(start=last_date, periods=n+1, freq=frequency)[1:]  # type: ignore

    # Format the dates to the desired format
    formatted_dates = [date.strftime("%m/%d/%Y, %I:%M:%S %p") for date in additional_dates]

    # Create a DataFrame with the additional dates
    additional_dates_df = pd.DataFrame({'date': formatted_dates, 'actual': 'null'})

    # Concatenate the additional dates DataFrame with the original dates DataFrame
    dates_df = pd.concat([dates_df, additional_dates_df]).reset_index(drop=True)

    return dates_df


def calculatePredictomRMSE(predictions, look_ahead):
    sliced = predictions[look_ahead:predictions.shape[0]-look_ahead, 1:]
    rmse_ = {}
    real_value = sliced[:, 0]

    for i in range(sliced.shape[1] - 1):
        predicted_value = sliced[:, i+1]
        real_tensor = tf.convert_to_tensor(real_value, dtype='float32')
        pred_tensor = tf.convert_to_tensor(predicted_value, dtype='float32')
        mse = np.mean(np.square(np.subtract(real_tensor, pred_tensor)))
        rmse = np.sqrt(mse)
        # print(f'RMSE for period {i+1}: {rmse}')
        rmse_[f'period_{i+1}'] = f'{rmse}'

    return rmse_


def broadcastTrainingStatus(model_id, event, message, process_id=None):
    match event:
        case 'feature_relations':
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "feature_relations", "training_model_id": model_id, "metrics": message}),
            )
        case "notify":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "notify", "training_model_id": model_id, "message": message}),
            )
        case "epochBegin":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "epochBegin", "training_model_id": model_id, "epoch": message["epoch"], "epochs":message["epochs"]}),
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "epochBegin", "update_model_id": model_id, "model_id":model_id, "epoch": message["epoch"], "epochs":message["epochs"]}),
            )
        case "epochEnd":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "epochEnd", "training_model_id": model_id, "epoch": message['epoch'], "log": message['log']})
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "epochEnd", "update_model_id": model_id, "model_id":model_id, "epoch": message['epoch'], "log": message['log']})
            )
        case "batchEnd":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "batchEnd", "training_model_id": model_id, "batch": message['batch'], "log": message['log']})
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "batchEnd", "update_model_id": model_id, "model_id":model_id, "batch": message['batch'], "log": message['log']})
            )
        case "trainingEnd":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "trainingEnd", "training_model_id": model_id})
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "trainingEnd", "training_model_id": model_id, "model_id":model_id })
            )
        case "prediction_completed":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "prediction_completed", "training_model_id": model_id, "model": 'WGAN-GP', "id": process_id})
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "prediction_completed", "update_model_id": model_id, "model_id":model_id, "model": 'WGAN-GP', "id": process_id})
            )
        case "intermediate_forecast":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "intermediate_forecast", "training_model_id": model_id, "intermediate_forecast": message['data'], "epoch": message['epoch'], "rmse": message['rmse']})
            )
        case "error":
            redisPubSubConn.publish(
                "model_training_channel",
                json.dumps({"event": "error", "training_model_id": model_id, "message": message}),
            )
            redisPubSubConn.publish(
                "model_update_channel",
                json.dumps({"event": "error", "update_model_id": model_id, "message": message})
            )


def log_training_metrics(
    losses,
    epoch,
    fw_d_loss,
    fw_g_loss,
    fw_g_mse,
    fw_g_sign,
    fw_g_rmse,
    fw_g_mae,
    fw_g_mape,
    fw_memory
):
    with fw_d_loss.as_default():
        tf.summary.scalar("training_losses", losses["discriminator_loss"].numpy(), epoch+1)
        fw_d_loss.flush()

    with fw_g_loss.as_default():
        tf.summary.scalar("training_losses", losses["generator_loss"].numpy(), epoch+1)
        fw_g_loss.flush()

    with fw_g_mse.as_default():
        tf.summary.scalar("losses", losses["g_mse"], epoch + 1)  # type: ignore
        fw_g_mse.flush()

    with fw_g_sign.as_default():
        tf.summary.scalar("losses", losses["g_sign"], epoch + 1)  # type: ignore
        fw_g_sign.flush()

    with fw_g_rmse.as_default():
        tf.summary.scalar("losses", losses["g_rmse"], epoch + 1)
        fw_g_rmse.flush()

    with fw_g_mae.as_default():
        tf.summary.scalar("losses", losses["g_mae"], epoch + 1)
        fw_g_mae.flush()

    with fw_g_mape.as_default():
        tf.summary.scalar("losses", losses["g_mape"], epoch + 1)
        fw_g_mape.flush()
        
    with fw_memory.as_default():
        tf.summary.scalar("memory", losses['batch_ram_diff'], epoch + 1)
        fw_memory.flush()


def saveTrainScalers(model_id, x_scalar, y_scalar):
    scalar_folder_path = f'./saved_models/{model_id}/scalers'

    if not os.path.exists(scalar_folder_path):
        os.makedirs(scalar_folder_path)

    x_scalar_path = f'{scalar_folder_path}/x_scalar'
    y_scalar_path = f'{scalar_folder_path}/y_scalar'

    dump(x_scalar, x_scalar_path)
    dump(y_scalar, y_scalar_path)
    print('Scalars saved.')


def plot_intermediate_predictions(y_scalar, intermediate_result_step, logs_dir, epoch, yt_test, fw_test_real, predictions):
    if intermediate_result_step > 0:
        if (epoch / 0.234234 == 0):
            yt_test_scaled = tf.constant(y_scalar.inverse_transform(yt_test))  # type: ignore
            with fw_test_real.as_default():
                for step in range(yt_test.shape[0]):  # type: ignore
                    tf.summary.scalar("test", yt_test_scaled[step][0], step)  # type: ignore
                fw_test_real.flush()
            del yt_test_scaled

        # print(f"Predictions shape : {predictions.shape}")
        predictions_scaled = tf.constant(y_scalar.inverse_transform(predictions))  # type: ignore

        if ((epoch + 1) % intermediate_result_step == 0):
            fw_test_pred = tf.summary.create_file_writer(logs_dir + f"/test/test_pred_{epoch+1}")  # type: ignore
            with fw_test_pred.as_default():
                for step in range(predictions.shape[0]):  # type: ignore
                    tf.summary.scalar("test", predictions_scaled[step][0], step)  # type: ignore
                fw_test_pred.flush()
            fw_test_pred.close()


def plot_validation_metrics(
    val_losses,
    epoch,
    fw_validation_pred_mse,
    fw_validation_pred_sign,
    fw_validation_pred_rmse,
    fw_validation_pred_mae,
    fw_validation_pred_mape,
):
    with fw_validation_pred_mse.as_default():
        tf.summary.scalar("test_metric", val_losses["mse"], epoch + 1)  # type: ignore
        fw_validation_pred_mse.flush()

    with fw_validation_pred_sign.as_default():
        tf.summary.scalar("test_metric", val_losses["sign"], epoch + 1)
        fw_validation_pred_sign.flush()

    with fw_validation_pred_rmse.as_default():
        tf.summary.scalar("test_metric", val_losses["rmse"], epoch + 1)
        fw_validation_pred_rmse.flush()

    with fw_validation_pred_mae.as_default():
        tf.summary.scalar("test_metric", val_losses["mae"], epoch + 1)
        fw_validation_pred_mae.flush()

    with fw_validation_pred_mape.as_default():
        tf.summary.scalar("test_metric", val_losses["mape"], epoch + 1)
        fw_validation_pred_mape.flush()


def saveModel(epoch, model_id, generator):
    # Generate a unique ID for the subfolder
    subfolder_id = f'checkpoint_{epoch+1}'
    main_folder_path = f'./saved_models/{model_id}'
    subfolder_path = f'{main_folder_path}/{subfolder_id}'

    # Create the main folder and subfolder if they don't exist
    if not os.path.exists(subfolder_path):
        os.makedirs(subfolder_path)

    # Save the model in a file with the name of the epoch
    file_path = f'{subfolder_path}/gen_model_{epoch+1}'
    print(f'Model weights saved.  Path : {file_path}')
    generator.save_weights(file_path)  # type: ignore


def initFileWriters(logs_dir):
    metrics = [
        "metrics_batch/d_batch_loss", "metrics_batch/g_batch_loss", "metrics_memory/train_memory",
        "losses/d_loss", "losses/g_loss", "metrics/g_mse", "metrics/g_sign", "metrics/rmse", "metrics/mae", "metrics/mape",
        "validation/pred_mse", "validation/pred_sign", "validation/pred_rmse", "validation/pred_mae", "validation/pred_mape",
        "test/test_real"
    ]

    file_writers = {metric: tf.summary.create_file_writer(logs_dir + f"/{metric}") for metric in metrics}  # type: ignore
    return file_writers


def closeFileWriters(file_writers):
    for writer in file_writers.values():
        writer.close()


def broadcastTrainingBatchLosses(model, model_id, total_training_batches, batch_no, batch_size, batch_d_loss, critic_iter, batch_g_loss):
    if model == 'discriminator':
        message = {
            "batch": batch_no,
            "log": {
                "model": "discriminator",
                "critic_iteration": critic_iter + 1,
                "batch": batch_no,
                "size": batch_size, # type: ignore
                "loss": float(batch_d_loss),  # Convert ndarray to list # type: ignore 
                "totalNoOfBatch": total_training_batches 
            }
        }   
        broadcastTrainingStatus(model_id, "batchEnd", message)
    else:
        message = {
            "batch": batch_no,
            "log": {
                "model": "generator",
                "batch": batch_no,
                "size": batch_size,
                "loss": float(batch_g_loss),  # Convert ndarray to list
                "totalNoOfBatch": total_training_batches
            }
        }
        broadcastTrainingStatus(model_id, "batchEnd", message)


def yield_batches(real_input, real_price, past_y, batch_size):
    num_samples, seq_length, features = real_input.shape
    num_batches, remainder = divmod(num_samples, batch_size)

    if remainder > 0:
        initial_batch_input = tf.slice(real_input, [0,0,0], [remainder,real_input.shape[1],real_input.shape[2]])
        initial_batch_price = tf.slice(real_price, [0,0], [remainder,real_price.shape[1]])
        initial_batch_past_y = tf.slice(past_y, [0,0,0], [remainder,past_y.shape[1], past_y.shape[2]])
        yield initial_batch_input, initial_batch_price, initial_batch_past_y

    real_input_batches = tf.slice(real_input, [remainder,0,0],[batch_size * num_batches, real_input.shape[1], real_input.shape[2]])
    real_price_batches = tf.slice(real_price, [remainder,0],[batch_size * num_batches,real_price.shape[1]])
    past_y_batches = tf.slice(past_y,[remainder,0,0],[batch_size * num_batches, past_y.shape[1], past_y.shape[2]])

    reshaped_input_batches = tf.reshape(real_input_batches, [num_batches, batch_size, seq_length, features])
    reshaped_price_batches = tf.reshape(real_price_batches, [num_batches, batch_size, -1])
    reshaped_past_y_batches = tf.reshape(past_y_batches, [num_batches, batch_size, seq_length, -1])
    
    # print(reshaped_input_batches.shape)
    # print(reshaped_price_batches.shape)
    # print(reshaped_past_y_batches.shape)

    for input_batch, price_batch ,past_y_batch in zip(reshaped_input_batches, reshaped_price_batches, reshaped_past_y_batches):
        yield input_batch, price_batch, past_y_batch


def tfDatasetGenerator(real_input, real_price, past_y, batch_size):
    dataset = tf.data.Dataset.from_generator(
        lambda: yield_batches(real_input, real_price, past_y, batch_size),
        output_signature=(
            tf.TensorSpec(shape=(None, real_input.shape[1], real_input.shape[2]), dtype=tf.float32), # type: ignore
            tf.TensorSpec(shape=(None, real_price.shape[1]), dtype=tf.float32), # type: ignore
            tf.TensorSpec(shape=(None, past_y.shape[1], past_y.shape[2]), dtype=tf.float32), # type: ignore
        )
    )
    
    return dataset


def getLastSavedModelCheckpoint(model_id):
    model_folder_path = f'./saved_models/{model_id}'
    # List all subfolders in the main folder
    subfolders = [
        name for name in os.listdir(model_folder_path) if os.path.isdir(os.path.join(model_folder_path, name))
    ]
    # Filter subfolders with the name pattern 'checkpoint_'
    subfolders = [folder for folder in subfolders if folder.startswith("checkpoint_")]
    # Extract the numeric part from each subfolder name and find the maximum
    highest_checkpoint = max(int(folder.split("_")[1]) for folder in subfolders)
    return highest_checkpoint


def removeSavedModels(model_id, checkpoint):
    model_path = f'./saved_models/{model_id}'
    checkpoints = []
    if os.path.exists(model_path):
        # print('Model data present')
        checkpoints = [name for name in os.listdir(model_path) if os.path.isdir(os.path.join(model_path, name)) and name.startswith('checkpoint')]
        
        filtered_checkpoints = [cp for cp in checkpoints if int(cp.split('_')[1]) > int(checkpoint.split('_')[1])]
        for cp in filtered_checkpoints:
            cp_folderpath = f"./saved_models/{model_id}/{cp}"
            if os.path.exists(cp_folderpath):
                shutil.rmtree(cp_folderpath)
                print(f"Directory '{cp_folderpath}' removed successfully.")
            else:
                print(f"Directory '{cp_folderpath}' does not exist.")
    else:
        print('Model data does not exist')
    return checkpoints
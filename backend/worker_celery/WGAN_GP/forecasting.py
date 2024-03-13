from textwrap import fill
from keras.initializers import RandomNormal
from .models_wgan_gp import Generator
from joblib import load
import pandas as pd
import numpy as np
import logging
import json
import os
from .util import generate_additional_dates


def generateNormalizedData(model_id, x_train, n_steps_in, lenFeatures, to_predict_index):
    # loading the saved x scalar and normalizing the data
    scalar_folder_path = f"./saved_models/{model_id}/scalers"
    X_scalar = load(f"{scalar_folder_path}/x_scalar")
    x_train_normalized = X_scalar.transform(x_train)
    # logging.critical(f"Normlized feature : {x_train_normalized[lenFeatures - 1]}")

    # Transform the normalized data to the shape required for training
    X_data = np.array(x_train_normalized)
    length = len(X_data)
    X = list()

    for i in range(length):
        X_val = X_data[i : i + n_steps_in][:, :]
        if len(X_val) == n_steps_in:
            X.append(X_val)

    X = np.array(X)
    logging.info(f"X shape : {X.shape}")
    return X


def loadAndPredict(model_id, X, n_steps_in, row_features, n_steps_out):
    # Load the model and make the prediction
    model_folder_path = f"./saved_models/{model_id}"
    # List all subfolders in the main folder
    subfolders = [
        name for name in os.listdir(model_folder_path) if os.path.isdir(os.path.join(model_folder_path, name))
    ]
    # Filter subfolders with the name pattern 'checkpoint_'
    subfolders = [folder for folder in subfolders if folder.startswith("checkpoint_")]
    # Extract the numeric part from each subfolder name and find the maximum
    highest_checkpoint = max(int(folder.split("_")[1]) for folder in subfolders)
    # Construct the path to the folder with the highest number
    highest_checkpoint_folder_path = os.path.join(
        model_folder_path, f"checkpoint_{highest_checkpoint}/gen_model_{highest_checkpoint}"
    )
    logging.critical(f"Loading model from : {highest_checkpoint_folder_path}")

    # Load the generator model
    weight_initializer = RandomNormal(mean=0.00, stddev=0.02, seed=42)

    generator_model = Generator(weight_initializer, n_steps_in, row_features, n_steps_out)
    # generator_model.summary()
    generator_model.load_weights(f"{highest_checkpoint_folder_path}")

    predictions = generator_model(X)

    scalar_folder_path = f"./saved_models/{model_id}/scalers"
    Y_scalar = load(f"{scalar_folder_path}/y_scalar")

    prediction_ = np.array(predictions)
    predictions_1d = prediction_.reshape(-1, 1)
    predictions_scaled = Y_scalar.inverse_transform(predictions_1d)
    prediction_2d = predictions_scaled.reshape(prediction_.shape[0], prediction_.shape[1])

    return prediction_2d


def generateAdditionalDates(dates, n_steps_out, period):
    dates_df = pd.DataFrame.from_dict(dates)
    # print(f"Dates : {dates_df.tail(10)}")

    dates_df["date"] = pd.to_datetime(dates_df["date"], format="%d/%m/%Y, %I:%M:%S %p")
    dates_df["date"] = dates_df["date"].dt.strftime("%m/%d/%Y, %I:%M:%S %p")

    # print(f"Dates before frm : {dates_df.tail(10)}")

    # Get the last date in the DataFrame
    last_date = dates_df.iloc[-1, 0]

    frequency = period
    # print(f"Frequency : {frequency}, Last Date : {last_date}")

    # Generate n additional dates
    additional_dates = pd.date_range(start=last_date, periods=n_steps_out + 1, freq=frequency)[1:]  # type: ignore

    # Format the dates to the desired format
    formatted_dates = [date.strftime("%m/%d/%Y, %I:%M:%S %p") for date in additional_dates]

    additional_dates_df = pd.DataFrame({"date": formatted_dates, "actual": "null"})

    dates_df = pd.concat([dates_df, additional_dates_df]).reset_index(drop=True)

    # print(f"Dates after frm : {dates_df.tail(10)}")
    return dates_df


def makeForecast(data):
    uid = data["uid"]
    model_id = data["m_id"]
    x_train = json.loads(data["features"])
    to_predict_index = data["to_predict_index"]
    n_steps_in = data["lookAhead"]
    n_steps_out = data["timeStep"]
    period = data["period"]
    totalTickerCount = data["totalTickerCount"]
    dates = json.loads(data["dates"])[n_steps_in:]

    lenFeatures = len(x_train)
    lenDates = len(dates)
    row_features = len(x_train[0])

    logging.error(f"Making prediction for user : {uid} for model : {model_id}")
    logging.critical(f"lenFeatures : {lenFeatures}, lenDates : {lenDates}")
    # logging.critical(f"Last feature : {x_train[lenFeatures - 1]}")
    # logging.critical(f"Last Date :{dates[lenDates - 1]}")
    # logging.info(f"ytain value: {y_train[lenFeatures - 1]}")

    X = generateNormalizedData(model_id, x_train, n_steps_in, lenFeatures, to_predict_index)

    predictions = loadAndPredict(model_id, X, n_steps_in, row_features, n_steps_out)
    predictions_df = pd.DataFrame(predictions)

    fill_values = predictions_df.iloc[-1, 1:]
    # print(f"Fill values : {fill_values}")

    null_data_df = pd.DataFrame(np.full((n_steps_out - 1, n_steps_out), np.nan))  # creating null data for shifting
    # print(f"Null data : {null_data_df}")
    predictions_df = pd.concat([predictions_df, null_data_df], ignore_index=True)  # adding additional rows for forecast

    # print(f"Predictions : {predictions_df.tail(10)}")

    for col_index, col_name in enumerate(predictions_df.columns):  # shifting the columns to match the dates
        predictions_df[col_name] = predictions_df[col_name].shift(periods=col_index, fill_value=None)

    # print(f"Predictions : {predictions_df.tail(10)}")

    for i in range(len(fill_values)):  # filling the last values
        idx = len(predictions_df) - (i + 1)
        predictions_df.iloc[idx, :-1] = predictions_df.iloc[idx, :-1].fillna(fill_values[len(fill_values) - i])

    # print(f"Predictions : {predictions_df.tail(10)}")

    additionalDates = generateAdditionalDates(dates, n_steps_out, period)

    combined_final = additionalDates.join(predictions_df).astype("str")

    # print(f"Combined final : {combined_final.tail(10)}")

    data_to_send_to_client = combined_final[-(totalTickerCount + n_steps_out) :]
    print(f"Data to send to client : {data_to_send_to_client}")

    pred_array_obj = data_to_send_to_client.to_dict(orient="records")

    print(f"Prediction completed for user : {uid} for model : {model_id}")

    return pred_array_obj


def convertPredictionToCorrectFormat(data):
    forecast = pd.DataFrame.from_dict(json.loads(data["forecast"]))
    dates = pd.DataFrame.from_dict(json.loads(data["dates"]))
    fill_values = forecast.iloc[-1, 1:]
    n_steps_out = data["lookAhead"]
    period = data["period"]
    totalTickerCount = data["totalTickerCount"]
    mean = json.loads(data["mean"])
    variance = json.loads(data["variance"])

    print(f"Mean : {mean[0]}")
    print(f"Variance : {variance[0]}")

    def calculate_original_price(value, variance, mean):
        if pd.isnull(value):
            return None
        return round((value * (variance**0.5)) + mean, 2)

    forecast = forecast.map(lambda x: calculate_original_price(x, variance[0], mean[0]))
    fill_values = fill_values.map(lambda x: calculate_original_price(x, variance[0], mean[0]))
    # print(f"Forecast : {forecast.head(5)}")
    print(f"Forecast : {forecast.tail(10)}")

    # print(f"Dates : {dates.head(5)}")
    print(f"Dates : {dates.tail(10)}")

    null_data_df = pd.DataFrame(np.full((n_steps_out - 1, n_steps_out), np.nan))  # creating null data for shifting

    forecast = pd.concat([forecast, null_data_df], ignore_index=True)  # adding additional rows for forecast

    for col_index, col_name in enumerate(forecast.columns):  # shifting the columns to match the dates
        forecast[col_name] = forecast[col_name].shift(periods=col_index, fill_value=None)

    print(f"Predictions : {forecast.tail(10)}")

    print(len(fill_values))

    for i in range(len(fill_values)):  # filling the last values
        idx = len(forecast) - (i + 1)
        forecast.iloc[idx, :-1] = forecast.iloc[idx, :-1].fillna(fill_values[len(fill_values) - i])

    print(f"Predictions : {forecast.tail(10)}")

    additionalDates = generateAdditionalDates(dates, n_steps_out, period)
    combined_final = additionalDates.join(forecast).astype("str")
    print(f"Combined final : {combined_final.tail(10)}")

    data_to_send_to_client = combined_final[-(totalTickerCount + n_steps_out) :]
    print(f"Data to send to client : {data_to_send_to_client}")

    pred_array_obj = data_to_send_to_client.to_dict(orient="records")

    return pred_array_obj

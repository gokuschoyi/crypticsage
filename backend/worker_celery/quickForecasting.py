import pandas as pd
from chronos import ChronosPipeline
import torch
import numpy as np
import redis
import json
import os

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port)  # type: ignore


def perform_quick_forecasting(data):
    print("Inside perform_quick_forecasting, selected appropriate model")
    redis_key = data["redis_key"]
    forecasting_model = data["model_data"]["forecasting_model"]
    print(f"Redis key for data : {redis_key}")
    print(f"Forecasting model : {forecasting_model}")

    if forecasting_model == "chronos":
        return chronos_forecasting(data)


def chronos_forecasting(data):
    print("Inside Chronos forecasting model")
    redis_key = data["redis_key"]
    model_forecasting_type = data["model_data"]["forecasting_model_type"]
    chronos_model_path = "./chronos_models/chronos-t5-" + model_forecasting_type

    parameters = data["model_data"]["parameters"]
    to_predict = parameters["to_predict_flag"]
    
    print(f"Parameters : {parameters}")
    
    print(f"Chronos model path : {chronos_model_path}")

    hist_data_from_redis = redisStore.get(redis_key)
    loaded_json = json.loads(hist_data_from_redis)  # type: ignore
    last_date = loaded_json[len(loaded_json) - 1]["openTime"]
    histData_df = pd.DataFrame(loaded_json)

    histData_df[to_predict] = histData_df[to_predict].astype(float)

    pipeline = ChronosPipeline.from_pretrained(
        chronos_model_path,
        torch_dtype=torch.bfloat16,
    )

    # context must be either a 1D tensor, a list of 1D tensors,
    # or a left-padded 2D tensor with batch as the first dimension
    context = torch.tensor(histData_df[to_predict])

    # forecast shape: [num_series, num_samples, prediction_length]
    forecast = pipeline.predict(
        context,
        prediction_length=parameters["look_ahead"],
        num_samples=parameters["samples"],  # Number of sample paths to predict
        temperature=parameters["scaled_temperature"],  # Temperature to use for generating sample tokens.
        top_k=parameters["top_k"],  # Top-k parameter to use for generating sample tokens.
        top_p=parameters["scaled_top_p"],  # Top-p parameter to use for generating sample tokens.
    )

    low, median, high = np.quantile(forecast[0].numpy(), [0.1, 0.5, 0.9], axis=0)
    final = pd.DataFrame({"low": low, "close": median, "high": high})

    print("-------------------")
    print(forecast.shape)
    # print(final.tail(5))

    final_obj = final.to_dict(orient="records")
    return {"message": "Quick forecasting completed", "result": final_obj, "last_date": last_date}

from matplotlib.font_manager import json_dump
from WGAN_GP.trainer import WGANGP
from WGAN_GP import forecasting
from WGAN_GP import util
from dotenv import load_dotenv
from celeryWorker import app
import redis
import json
import os
import time

# Load environment variables from the .env file
load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port)  # type: ignore


@app.task
def trainModel(data):
    message = data["message"]
    uid = data["uid"]
    model_id = data["m_id"]
    model_process_id = data["model_proces_id"]
    existing_data = data["existing_data"]
    print(message)  # message from nodejs server
    print(f"existing_data : {existing_data}")
    print(f"Training has started for user : {uid}, model process id : {model_process_id}")
    time.sleep(0.3)
    # fetch the training parameters from redis
    t_param_redis = redisStore.hget(model_process_id, "training_parameters")
    training_parameters = json.loads(t_param_redis)  # type: ignore

    wgan_gp = WGANGP(model_process_id, uid, model_id, training_parameters, existing_data)

    # print(wgan_gp.get_model_config())

    wgan_gp.train()

    print("Training completed")


@app.task
def retrainModel(data):
    message = data["message"]
    uid = data["uid"]
    model_id = data["m_id"]
    model_process_id = data["model_proces_id"]
    existing_data = data["existing_data"]
    checkpoint = data["checkpoint"]
    print(message)
    print(f"Model ID : {model_id}")
    print(f"Checkpoint : {checkpoint}")
    print(f"existing_data : {existing_data}")
    
    t_param_redis = redisStore.hget(model_process_id, "training_parameters")
    training_parameters = json.loads(t_param_redis)  # type: ignore
    # print(training_parameters)

    print(f"Retraining has started for user : {uid}, model process id : {model_process_id}")
    time.sleep(0.3)

    wgan_gp = WGANGP(
        model_process_id, uid, model_id, training_parameters, existing_data, re_train=True, checkpoint=checkpoint
    )
    wgan_gp.train()
    print(f"Retraining completed for user : {uid}, model process id : {model_process_id}")


@app.task
def makePrediction(data):
    message = data["message"]
    uid = data["uid"]
    model_id = data["m_id"]
    print(message)

    time.sleep(0.3)
    result = forecasting.makeForecast(data)
    # result = result.numpy().tolist()  # type: ignore

    final_result = {
        "uid": uid,
        "model_id": model_id,
        "predictions": json.dumps(result),
    }
    return final_result


@app.task
def convertPredictionToCorrectFormat(data):
    message = data["message"]
    print(message)

    time.sleep(0.3)
    result = forecasting.convertPredictionToCorrectFormat(data)
    # result = result.numpy().tolist()  # type: ignore

    final_result = {"transformed": json.dumps(result)}
    return final_result


@app.task
def testing(data):
    message = data["message"]
    print(message)
    time.sleep(2)
    checkpoints = util.removeSavedModels(data["model_id"], data["checkpoint"])
    return {"message": "Testing successful", "checkpoints": json.dumps(checkpoints)}

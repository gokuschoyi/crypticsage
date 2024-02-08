from WGAN_GP.models import WGANGP
from dotenv import load_dotenv
from celeryWorker import app
import redis
import json
import os

# Load environment variables from the .env file
load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redisStore = redis.Redis(host=redis_host, port=redis_port) # type: ignore


@app.task
def trainModel(data):
    message = data["message"]
    print(message)
    uid = data["uid"]
    model_id = data["m_id"]
    model_process_id = data["model_proces_id"]
    print(f"Training has started for user : {uid}, model process id : {model_process_id}")

    # fetch the training parameters from redis
    t_param_redis = redisStore.hget(model_process_id, "training_parameters")
    training_parameters = json.loads(t_param_redis)  # type: ignore

    wgan_gp = WGANGP(model_process_id, uid, model_id, training_parameters)

    print(wgan_gp.get_model_config())

    wgan_gp.fetchFeaturesFromRedis()
    wgan_gp.splitDataToTrainAndTest()
    # wgan_gp.getYLabels()
    wgan_gp.normalizetrainingData()

    wgan_gp.transformDataForTraining()

    wgan_gp.initializeModels()

    real, pred = wgan_gp.train()

    print("Training completed")

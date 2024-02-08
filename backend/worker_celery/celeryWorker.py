from celery import Celery

# celery -A celeryWorker.app worker -E --loglevel=info --max-memory-per-child 100000 - start the celery worker
# celery -A celeryWorker.app flower -E --loglevel=info - start the celery flower
# htop [-dChusv]
app = Celery(
    main="wgan_gp_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    broker_connection_retry_on_startup=True,
    include=["celeryTasks"],
)

app.conf.task_default_queue = "wgan_gp_training"

if __name__ == "__main__":
    app.start()

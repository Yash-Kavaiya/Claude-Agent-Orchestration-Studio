"""
Celery Application Configuration
Handles async task queue for workflow execution
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Create Celery application
celery_app = Celery(
    "claude_agent_orchestration",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.workflow_execution",
        "app.tasks.node_execution",
        "app.tasks.cleanup",
    ],
)

# Celery Configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution settings
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # 55 minutes soft limit
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,
    result_backend_transport_options={
        "master_name": "mymaster",
        "socket_timeout": 5,
    },

    # Worker settings
    worker_prefetch_multiplier=1,  # Only fetch one task at a time
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    worker_disable_rate_limits=False,

    # Event settings
    worker_send_task_events=True,
    task_send_sent_event=True,

    # Broker settings
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,

    # Task routes (route tasks to specific queues)
    task_routes={
        "app.tasks.workflow_execution.*": {"queue": "workflow_execution"},
        "app.tasks.node_execution.*": {"queue": "node_execution"},
        "app.tasks.cleanup.*": {"queue": "cleanup"},
    },

    # Task priority
    task_queue_max_priority=10,
    task_default_priority=5,

    # Beat schedule (periodic tasks)
    beat_schedule={
        "cleanup-old-executions": {
            "task": "app.tasks.cleanup.cleanup_old_executions",
            "schedule": crontab(hour=2, minute=0),  # Run at 2 AM daily
            "options": {"queue": "cleanup"},
        },
        "cleanup-failed-tasks": {
            "task": "app.tasks.cleanup.cleanup_failed_tasks",
            "schedule": crontab(hour=3, minute=0),  # Run at 3 AM daily
            "options": {"queue": "cleanup"},
        },
    },
)

# Task retry configuration
celery_app.conf.task_annotations = {
    "*": {
        "max_retries": 3,
        "default_retry_delay": 60,  # 1 minute
    },
    "app.tasks.workflow_execution.execute_workflow": {
        "max_retries": 2,
        "default_retry_delay": 120,  # 2 minutes
    },
    "app.tasks.node_execution.execute_node": {
        "max_retries": 3,
        "default_retry_delay": 30,  # 30 seconds
    },
}


# Task events
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery setup"""
    print(f"Request: {self.request!r}")
    return {"status": "ok", "message": "Celery is working!"}


# Configure logging
if not settings.DEBUG:
    celery_app.conf.worker_hijack_root_logger = False


# Export celery app
__all__ = ["celery_app"]

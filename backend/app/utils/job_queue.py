import asyncio
import time
import uuid
from typing import Any, Callable, Dict, Optional

class JobStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Job:
    def __init__(self, fn: Callable, args: tuple = (), kwargs: Optional[Dict[str, Any]] = None):
        self.id = str(uuid.uuid4())
        self.fn = fn
        self.args = args
        self.kwargs = kwargs or {}
        self.status = JobStatus.PENDING
        self.created_at = time.time()
        self.started_at: Optional[float] = None
        self.finished_at: Optional[float] = None
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.progress_pct: int = 0

class InMemoryJobQueue:
    def __init__(self, max_concurrency: int = 1):
        self.queue: asyncio.Queue[Job] = asyncio.Queue()
        self.jobs: Dict[str, Job] = {}
        self.max_concurrency = max_concurrency
        self._workers_started = False
        self._stop = False

    async def start_workers(self):
        if self._workers_started:
            return
        self._workers_started = True
        for _ in range(self.max_concurrency):
            asyncio.create_task(self._worker())

    async def _worker(self):
        while not self._stop:
            job: Job = await self.queue.get()
            try:
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                # Inject a progress callback into kwargs if supported
                def _progress(pct: int, frac: float):
                    job.progress_pct = max(0, min(100, int(pct)))
                job.kwargs.setdefault("progress_callback", _progress)
                res = await self._maybe_await(job.fn(*job.args, **job.kwargs))
                job.result = res
                job.status = JobStatus.COMPLETED
            except Exception as e:
                job.error = str(e)
                job.status = JobStatus.FAILED
            finally:
                job.finished_at = time.time()
                self.queue.task_done()

    async def _maybe_await(self, val):
        if asyncio.iscoroutine(val):
            return await val
        return val

    async def submit(self, fn: Callable, *args, **kwargs) -> str:
        job = Job(fn, args, kwargs)
        self.jobs[job.id] = job
        await self.queue.put(job)
        await self.start_workers()
        return job.id

    def get(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    def status(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self.get(job_id)
        if not job:
            return None
        return {
            "id": job.id,
            "status": job.status,
            "progress": job.progress_pct,
            "result": job.result,
            "error": job.error,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
        }

# Singleton queue instance configured elsewhere
job_queue = InMemoryJobQueue()


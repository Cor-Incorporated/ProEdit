import type { ExportQuality } from "@/features/export/types";
import { getEnvNumber } from "@/lib/utils/env";
import { processExportJob } from "./server";

interface PendingExportJob {
  jobId: string;
  userId: string;
  projectId: string;
  quality: ExportQuality;
  enqueuedAt?: number;
}

interface QueueState {
  pending: PendingExportJob[];
  active: PendingExportJob[];
  runningPerUser: Map<string, number>;
  processing: boolean;
}

export const MAX_CONCURRENT_EXPORTS = Math.floor(getEnvNumber("EXPORT_MAX_CONCURRENT", 2, { min: 1 }));
export const MAX_CONCURRENT_EXPORTS_PER_USER = Math.floor(
  getEnvNumber("EXPORT_MAX_PER_USER", 1, { min: 1 })
);
const EXPORT_QUEUE_JOB_TTL_MS = getEnvNumber("EXPORT_QUEUE_JOB_TTL_MS", 10 * 60 * 1000, { min: 1 });

type MutableQueueState = QueueState & { initialized?: boolean };

function getQueueState(): MutableQueueState {
  const globalKey = "__PROEDIT_EXPORT_QUEUE__";
  const globalAny = globalThis as typeof globalThis & {
    __PROEDIT_EXPORT_QUEUE__?: MutableQueueState;
  };

  if (!globalAny[globalKey]) {
    globalAny[globalKey] = {
      pending: [],
      active: [],
      runningPerUser: new Map(),
      processing: false,
      initialized: true,
    };
  }

  return globalAny[globalKey]!;
}

async function runNextJob(state: MutableQueueState): Promise<void> {
  if (state.processing) {
    return;
  }

  state.processing = true;

  try {
    cleanupExpiredPendingJobs(state, Date.now());

    while (state.pending.length > 0 && state.active.length < MAX_CONCURRENT_EXPORTS) {
      const nextIndex = state.pending.findIndex((job) => {
        const current = state.runningPerUser.get(job.userId) ?? 0;
        return current < MAX_CONCURRENT_EXPORTS_PER_USER;
      });

      if (nextIndex === -1) {
        break;
      }

      const [job] = state.pending.splice(nextIndex, 1);
      state.active.push(job);
      state.runningPerUser.set(job.userId, (state.runningPerUser.get(job.userId) ?? 0) + 1);

      void processExportJob(job.jobId)
        .catch((error) => {
          console.error("[ExportQueue] Job failed:", error);
        })
        .finally(() => {
          finalizeJob(state, job);
          void runNextJob(state);
        });
    }
  } finally {
    state.processing = false;
  }
}

export function enqueueExportJob(job: PendingExportJob): void {
  const state = getQueueState();
  cleanupExpiredPendingJobs(state, Date.now());

  // Deduplicate queued jobs
  if (
    state.pending.some((pending) => pending.jobId === job.jobId) ||
    state.active.some((active) => active.jobId === job.jobId)
  ) {
    return;
  }

  state.pending.push({ ...job, enqueuedAt: Date.now() });
  void runNextJob(state);
}

function cleanupExpiredPendingJobs(state: MutableQueueState, now: number): void {
  if (state.pending.length === 0) {
    return;
  }

  // Queue state is an in-memory singleton; mutating in place keeps references in sync.
  const before = state.pending.length;
  state.pending = state.pending.filter((job) => {
    if (!job.enqueuedAt) {
      return true;
    }
    return now - job.enqueuedAt <= EXPORT_QUEUE_JOB_TTL_MS;
  });

  if (before !== state.pending.length) {
    console.warn(
      "[ExportQueue] Removed stale pending export job(s):",
      before - state.pending.length
    );
  }
}

function finalizeJob(state: MutableQueueState, job: PendingExportJob): void {
  const activeIndex = state.active.findIndex((activeJob) => activeJob.jobId === job.jobId);
  if (activeIndex !== -1) {
    state.active.splice(activeIndex, 1);
  }

  const previousCount = state.runningPerUser.get(job.userId) ?? 0;
  if (previousCount <= 1) {
    state.runningPerUser.delete(job.userId);
  } else {
    state.runningPerUser.set(job.userId, previousCount - 1);
  }
}

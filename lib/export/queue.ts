import type { ExportQuality } from "@/features/export/types";
import { processExportJob } from "./server";

interface PendingExportJob {
  jobId: string;
  userId: string;
  projectId: string;
  quality: ExportQuality;
}

interface QueueState {
  pending: PendingExportJob[];
  active: PendingExportJob[];
  runningPerUser: Map<string, number>;
  processing: boolean;
}

export const MAX_CONCURRENT_EXPORTS = Number(process.env.EXPORT_MAX_CONCURRENT ?? 2);
export const MAX_CONCURRENT_EXPORTS_PER_USER = Number(process.env.EXPORT_MAX_PER_USER ?? 1);

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
          const activeIndex = state.active.findIndex((activeJob) => activeJob.jobId === job.jobId);
          if (activeIndex !== -1) {
            state.active.splice(activeIndex, 1);
          }
          state.runningPerUser.set(
            job.userId,
            Math.max(0, (state.runningPerUser.get(job.userId) ?? 1) - 1)
          );
          void runNextJob(state);
        });
    }
  } finally {
    state.processing = false;
  }
}

export function enqueueExportJob(job: PendingExportJob): void {
  const state = getQueueState();

  // Deduplicate queued jobs
  if (
    state.pending.some((pending) => pending.jobId === job.jobId) ||
    state.active.some((active) => active.jobId === job.jobId)
  ) {
    return;
  }

  state.pending.push(job);
  void runNextJob(state);
}

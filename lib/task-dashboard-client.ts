import { TASK_DASHBOARD_URL } from "./constants";

export type TaskDashboardSummary = {
  overdueCount: number | null;
  configured: boolean;
  source: "api" | "unconfigured" | "error";
  message: string;
};

type TaskApiPayload = {
  overdueCount?: number;
  taskTelat?: number;
  overdue?: number;
  tasks_overdue?: number;
  data?: {
    overdueCount?: number;
    taskTelat?: number;
    overdue?: number;
  };
};

function resolveApiUrl(): string | null {
  const explicit = process.env.TASK_DASHBOARD_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const base = (process.env.NEXT_PUBLIC_TASK_DASHBOARD_URL ?? TASK_DASHBOARD_URL).replace(/\/$/, "");
  return `${base}/api/integrations/nf3/summary`;
}

function parseOverdueCount(payload: TaskApiPayload): number | null {
  const candidates = [
    payload.overdueCount,
    payload.taskTelat,
    payload.overdue,
    payload.tasks_overdue,
    payload.data?.overdueCount,
    payload.data?.taskTelat,
    payload.data?.overdue
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
  }

  return null;
}

/** Ambil jumlah task telat dari Task Dashboard eksternal (server-only). */
export async function fetchTaskOverdueCount(): Promise<TaskDashboardSummary> {
  const url = resolveApiUrl();
  if (!url) {
    return {
      overdueCount: null,
      configured: false,
      source: "unconfigured",
      message: "TASK_DASHBOARD_API_URL belum diset"
    };
  }

  const apiKey = process.env.TASK_DASHBOARD_API_KEY?.trim();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      return {
        overdueCount: null,
        configured: true,
        source: "error",
        message: `Task API ${res.status}`
      };
    }

    const payload = (await res.json()) as TaskApiPayload;
    const overdueCount = parseOverdueCount(payload);

    if (overdueCount == null) {
      return {
        overdueCount: null,
        configured: true,
        source: "error",
        message: "Format respons Task API tidak dikenali"
      };
    }

    return {
      overdueCount,
      configured: true,
      source: "api",
      message: "Dari Task Dashboard"
    };
  } catch {
    return {
      overdueCount: null,
      configured: true,
      source: "error",
      message: "Task API tidak terjangkau"
    };
  }
}

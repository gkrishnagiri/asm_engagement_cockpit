import type {
  AnalysisOutput,
  DashboardSummary,
  DataPoint,
  Deliverable,
  Engagement,
  EvidenceItem,
  Finding,
  Reminder,
  StakeholderQuestion,
  Subtask,
  Task,
  TextRefinementRequest,
  TextRefinementResponse,
  Workstream,
} from "./types";

const API_BASE_URL = "http://localhost:8020/api";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return getJson<DashboardSummary>("/dashboard/summary");
}

export function getEngagements(): Promise<Engagement[]> {
  return getJson<Engagement[]>("/engagements");
}

export function getWorkstreams(): Promise<Workstream[]> {
  return getJson<Workstream[]>("/workstreams");
}

export function getDeliverables(): Promise<Deliverable[]> {
  return getJson<Deliverable[]>("/deliverables");
}

export function getTasks(): Promise<Task[]> {
  return getJson<Task[]>("/tasks");
}

export function getSubtasks(): Promise<Subtask[]> {
  return getJson<Subtask[]>("/subtasks");
}

export function getDataPoints(): Promise<DataPoint[]> {
  return getJson<DataPoint[]>("/data-points");
}

export function getStakeholderQuestions(): Promise<StakeholderQuestion[]> {
  return getJson<StakeholderQuestion[]>("/stakeholder-questions");
}

export function getFindings(): Promise<Finding[]> {
  return getJson<Finding[]>("/findings");
}

export function getAnalysisOutputs(): Promise<AnalysisOutput[]> {
  return getJson<AnalysisOutput[]>("/analysis-outputs");
}

export function getEvidenceItems(): Promise<EvidenceItem[]> {
  return getJson<EvidenceItem[]>("/evidence-items");
}

export function getActiveReminders(): Promise<Reminder[]> {
  return getJson<Reminder[]>("/reminders/active");
}

export function generateReminders(): Promise<{
  generated_or_updated: number;
  active_reminders: number;
}> {
  return postJson("/reminders/generate");
}

export function refineText(payload: TextRefinementRequest): Promise<TextRefinementResponse> {
  return postJson<TextRefinementResponse>("/refine-text", payload);
}

export function createFinding(payload: {
  subtask_id: string;
  title: string;
  finding_type?: string | null;
  severity?: string | null;
  finding_text: string;
  business_impact?: string | null;
  recommendation?: string | null;
  status?: string;
  confidence_level?: string | null;
}): Promise<Finding> {
  return postJson<Finding>("/findings", payload);
}

export function createAnalysisOutput(payload: {
  subtask_id: string;
  analysis_title: string;
  analysis_type?: string | null;
  analysis_text: string;
  methodology?: string | null;
  assumptions?: string | null;
  limitations?: string | null;
  status?: string;
  confidence_level?: string | null;
}): Promise<AnalysisOutput> {
  return postJson<AnalysisOutput>("/analysis-outputs", payload);
}
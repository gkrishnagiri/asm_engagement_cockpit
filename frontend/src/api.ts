import type {
  AnalysisOutput,
  DashboardSummary,
  DataPoint,
  Deliverable,
  DeliverableReview,
  Engagement,
  EvidenceItem,
  Finding,
  LlmRecommendation,
  Reminder,
  StakeholderQuestion,
  Subtask,
  Task,
  TextRefinementRequest,
  TextRefinementResponse,
  TimesheetEntry,
  TimesheetSummary,
  UploadedFile,
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
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return response.json() as Promise<T>;
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
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

export function getUploadedFiles(): Promise<UploadedFile[]> {
  return getJson<UploadedFile[]>("/uploaded-files");
}

export function getLlmRecommendations(): Promise<LlmRecommendation[]> {
  return getJson<LlmRecommendation[]>("/llm-recommendations");
}

export function getDeliverableReviews(): Promise<DeliverableReview[]> {
  return getJson<DeliverableReview[]>("/deliverable-reviews");
}

export function getTimesheets(): Promise<TimesheetEntry[]> {
  return getJson<TimesheetEntry[]>("/timesheets");
}

export function getTimesheetSummaries(): Promise<TimesheetSummary[]> {
  return getJson<TimesheetSummary[]>("/timesheet-summaries");
}

export function getUploadedFileDownloadUrl(uploadedFileId: string): string {
  return `${API_BASE_URL}/uploaded-files/${uploadedFileId}/download`;
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

export function uploadFile(payload: {
  file: File;
  description?: string;
  upload_category?: string;
  subtask_id?: string;
  data_point_id?: string;
  stakeholder_question_id?: string;
  finding_id?: string;
  analysis_output_id?: string;
  evidence_item_id?: string;
  uploaded_by?: string;
}): Promise<UploadedFile> {
  const formData = new FormData();

  formData.append("file", payload.file);

  if (payload.description) formData.append("description", payload.description);
  if (payload.upload_category) formData.append("upload_category", payload.upload_category);
  if (payload.subtask_id) formData.append("subtask_id", payload.subtask_id);
  if (payload.data_point_id) formData.append("data_point_id", payload.data_point_id);
  if (payload.stakeholder_question_id) formData.append("stakeholder_question_id", payload.stakeholder_question_id);
  if (payload.finding_id) formData.append("finding_id", payload.finding_id);
  if (payload.analysis_output_id) formData.append("analysis_output_id", payload.analysis_output_id);
  if (payload.evidence_item_id) formData.append("evidence_item_id", payload.evidence_item_id);
  if (payload.uploaded_by) formData.append("uploaded_by", payload.uploaded_by);

  return postFormData<UploadedFile>("/uploaded-files", formData);
}

export function generateLlmRecommendation(payload: {
  deliverable_id?: string | null;
  task_id?: string | null;
  subtask_id?: string | null;
  finding_id?: string | null;
  analysis_output_id?: string | null;
  recommendation_type: string;
  focus_area: string;
  created_by: string;
}): Promise<LlmRecommendation> {
  return postJson<LlmRecommendation>("/llm-recommendations/generate", payload);
}

export function generateDeliverableReview(payload: {
  deliverable_id: string;
  review_type: string;
  created_by: string;
}): Promise<DeliverableReview> {
  return postJson<DeliverableReview>("/deliverable-reviews/generate", payload);
}

export function createTimesheet(payload: {
  entry_date: string;
  person_name: string;
  workstream_id?: string | null;
  deliverable_id?: string | null;
  task_id?: string | null;
  subtask_id?: string | null;
  activity_type: string;
  accomplishments: string;
  blockers?: string | null;
  next_steps?: string | null;
  effort_hours: number;
  status: string;
}): Promise<TimesheetEntry> {
  return postJson<TimesheetEntry>("/timesheets", payload);
}

export function submitTimesheetWeek(payload: {
  start_date: string;
  end_date: string;
  person_name: string;
  submitted_by: string;
}): Promise<{
  submitted_count: number;
  start_date: string;
  end_date: string;
  person_name: string;
}> {
  return postJson("/timesheets/submit-week", payload);
}

export function generateTimesheetSummary(payload: {
  start_date: string;
  end_date: string;
  person_name: string;
  summary_type: string;
  created_by: string;
}): Promise<TimesheetSummary> {
  return postJson<TimesheetSummary>("/timesheets/generate-summary", payload);
}
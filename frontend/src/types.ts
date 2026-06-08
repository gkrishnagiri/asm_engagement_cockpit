export type DashboardSummary = {
  engagements: number;
  workstreams: number;
  deliverables: number;
  tasks: number;
  subtasks: number;
  active_reminders: number;
  overdue_reminders: number;
  due_today_reminders: number;
  due_soon_reminders: number;
};

export type Engagement = {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  status: string;
  progress_percent: number;
  start_date: string | null;
  target_end_date: string | null;
  revised_end_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Workstream = {
  id: string;
  engagement_id: string;
  external_id: string | null;
  name: string;
  objective: string | null;
  scope: string | null;
  status: string;
  progress_percent: number;
  start_date: string | null;
  target_completion_date: string | null;
  revised_completion_date: string | null;
  actual_completion_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Deliverable = {
  id: string;
  workstream_id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  deliverable_type: string | null;
  status: string;
  review_status: string | null;
  progress_percent: number;
  start_date: string | null;
  target_completion_date: string | null;
  revised_completion_date: string | null;
  actual_completion_date: string | null;
  submission_date: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  deliverable_id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  priority: string | null;
  status: string;
  progress_percent: number;
  start_date: string | null;
  target_completion_date: string | null;
  revised_completion_date: string | null;
  actual_completion_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: string;
  task_id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  completion_criteria: string | null;
  priority: string | null;
  status: string;
  start_date: string | null;
  target_completion_date: string | null;
  revised_completion_date: string | null;
  actual_completion_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  parent_type: string;
  parent_id: string;
  parent_external_id: string | null;
  parent_title: string;
  reminder_type: string;
  reminder_status: string;
  severity: string;
  reminder_date: string | null;
  effective_due_date: string | null;
  title: string;
  message: string;
  is_active: boolean;
  snoozed_until: string | null;
  dismissed_reason: string | null;
  created_at: string;
  updated_at: string;
};
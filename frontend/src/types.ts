export type DashboardSummary = {
    engagements: number;
    workstreams: number;
    deliverables: number;
    tasks: number;
    subtasks: number;
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
    target_completion_date: string | null;
    revised_completion_date: string | null;
    actual_completion_date: string | null;
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
    target_completion_date: string | null;
    revised_completion_date: string | null;
    actual_completion_date: string | null;
    created_at: string;
    updated_at: string;
  };
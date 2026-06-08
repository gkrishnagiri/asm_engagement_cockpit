import type {
    DashboardSummary,
    Deliverable,
    Engagement,
    Subtask,
    Task,
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
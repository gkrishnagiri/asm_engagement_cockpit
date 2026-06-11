import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import "./styles.css";
import "./mvp18Simplified.css";

import {
  clearStoredSession,
  createDeliverable,
  createEngagement,
  createSubtask,
  createTask,
  createWorkstream,
  deleteDeliverable,
  deleteEngagement,
  deleteSubtask,
  deleteTask,
  deleteWorkstream,
  getDashboardStatusSummary,
  getDeliverableWorkspace,
  getEngagements,
  getEngagementWorkspace,
  getReminderIndicator,
  getStoredSession,
  getSubtaskWorkspace,
  getTaskWorkspace,
  getWorkstreamWorkspace,
  isLoginRequired,
  login,
  storeSession,
  updateDeliverable,
  updateEngagement,
  updateSubtask,
  updateTask,
  updateWorkstream,
  type BreadcrumbItem,
  type DashboardStatusSummary,
  type DeliverableWorkspace,
  type EngagementWorkspace,
  type EntitySummary,
  type HierarchyFormPayload,
  type ReminderIndicator,
  type StatusBucket,
  type StoredSession,
  type SubtaskWorkspace,
  type TaskWorkspace,
  type WorkstreamWorkspace,
} from "./mvp18UiApi";
import { Mvp18WorkspacePanel } from "./Mvp18WorkspacePanel";

type RouteState = {
  path: string;
  parts: string[];
};

type EntityKind = "engagement" | "workstream" | "deliverable" | "task" | "subtask";

type FormMode = "create" | "edit";

type FormState = {
  mode: FormMode;
  entityKind: EntityKind;
  parentId?: string;
  item?: EntitySummary;
};

const STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "On Hold - Waiting for Information",
  "On Hold - Dependency",
  "Submitted for Review",
  "Rework Required",
  "Completed",
  "Cancelled",
];

function normalizePath(): RouteState {
  const hash = window.location.hash.replace(/^#/, "");
  const path = hash.startsWith("/") ? hash : "/";
  const parts = path.split("/").filter(Boolean);
  return { path, parts };
}

function navigateTo(path: string) {
  window.location.hash = path;
}

function entityLabel(item: EntitySummary): string {
  return item.name || item.title || item.external_id || item.id;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function formatDate(value: string | null | undefined): string {
  return value || "-";
}

function statusClassText(bucket: StatusBucket): string {
  return `Not Started: ${bucket.not_started} | In Progress: ${bucket.in_progress} | On Hold: ${bucket.on_hold} | Completed: ${bucket.completed}`;
}

function StatusBadge({ status }: { status?: string | null }) {
  return <span className="mvp18-status-badge">{status || "No Status"}</span>;
}

function LoadingPanel({ label = "Loading..." }: { label?: string }) {
  return <div className="mvp18-panel">{label}</div>;
}

function ErrorPanel({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return <div className="mvp18-error">{message}</div>;
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="mvp18-empty">{label}</div>;
}

function LoginPage({ onLogin }: { onLogin: (session: StoredSession) => void }) {
  const [username, setUsername] = useState("giridhar");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      const session = storeSession(response);
      setMessage("");
      onLogin(session);
      navigateTo("/");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    },
  });

  return (
    <div className="mvp18-login-page">
      <div className="mvp18-login-card">
        <h1>ASM Engagement Cockpit</h1>
        <p>Sign in to continue to the cockpit workspace.</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate({ username, password });
          }}
        >
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />
          </label>

          <label>
            Password
            <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
          </label>

          <button className="mvp18-button-primary" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Login"}
          </button>

          {message ? <div className="mvp18-error">{message}</div> : null}
        </form>
      </div>
    </div>
  );
}

function ReminderButton({ indicator }: { indicator?: ReminderIndicator }) {
  const color = indicator?.color || "gray";
  const count = indicator?.total_active ?? 0;
  const label = indicator?.label || "No active reminders";

  return (
    <button
      className={`mvp18-reminder-button mvp18-reminder-${color}`}
      title={label}
      onClick={() => {
        alert(
          `Reminders\n\nTotal active: ${count}\nOverdue: ${indicator?.overdue ?? 0}\nDue within 2 days: ${indicator?.due_within_2_days ?? 0}\nOther active: ${indicator?.other_active ?? 0}`,
        );
      }}
    >
      🔔 {count}
    </button>
  );
}

function AppShell({
  children,
  session,
  setSession,
  breadcrumb,
}: {
  children: React.ReactNode;
  session: StoredSession | null;
  setSession: (session: StoredSession | null) => void;
  breadcrumb: BreadcrumbItem[];
}) {
  const reminderQuery = useQuery({
    queryKey: ["mvp18-reminder-indicator"],
    queryFn: getReminderIndicator,
    refetchInterval: 60000,
    retry: 1,
  });

  const currentPath = normalizePath().path;
  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Engagements", path: "/engagements" },
    { label: "My Work", path: "/tasks" },
    { label: "Reminders", path: "/reminders" },
    { label: "Reports", path: "/reports" },
    { label: "Operations", path: "/operations" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="mvp18-shell">
      <aside className="mvp18-sidebar">
        <div className="mvp18-brand">ASM Cockpit</div>
        <nav className="mvp18-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={currentPath === item.path ? "active" : ""}
              onClick={() => navigateTo(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="mvp18-main">
        <header className="mvp18-topbar">
          <div className="mvp18-breadcrumb">
            <strong>ASM Engagement Cockpit</strong>
            {breadcrumb.length > 0 ? ` / ${breadcrumb.map((item) => item.label).join(" / ")}` : " / Dashboard"}
          </div>

          <div className="mvp18-top-actions">
            <ReminderButton indicator={reminderQuery.data} />
            <span>{session?.display_name || "Local User"}</span>
            <button
              className="mvp18-button-secondary"
              onClick={() => {
                clearStoredSession();
                setSession(null);
                navigateTo("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="mvp18-content">{children}</div>
      </main>
    </div>
  );
}

function SummaryCard({ title, bucket, path }: { title: string; bucket: StatusBucket; path: string }) {
  return (
    <button className="mvp18-summary-card" onClick={() => navigateTo(path)}>
      <span>{title}</span>
      <strong>{bucket.total}</strong>
      <div className="mvp18-status-row">
        <div>{statusClassText(bucket)}</div>
        {bucket.other > 0 ? <div>Other: {bucket.other}</div> : null}
      </div>
    </button>
  );
}

function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["mvp18-dashboard-status-summary"],
    queryFn: getDashboardStatusSummary,
    retry: 1,
  });

  if (summaryQuery.isLoading) {
    return <LoadingPanel label="Loading dashboard summary..." />;
  }

  if (summaryQuery.isError) {
    return <ErrorPanel error={summaryQuery.error} />;
  }

  const summary = summaryQuery.data as DashboardStatusSummary;

  return (
    <>
      <div className="mvp18-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Clean executive view of engagement hierarchy and status counts.</p>
        </div>
      </div>

      <div className="mvp18-card-grid">
        <SummaryCard title="Engagements" bucket={summary.engagements} path="/engagements" />
        <SummaryCard title="Workstreams" bucket={summary.workstreams} path="/engagements" />
        <SummaryCard title="Deliverables" bucket={summary.deliverables} path="/engagements" />
        <SummaryCard title="Tasks" bucket={summary.tasks} path="/tasks" />
        <SummaryCard title="Sub-tasks" bucket={summary.subtasks} path="/tasks" />
      </div>
    </>
  );
}

function EntityCard({
  item,
  viewLabel,
  onView,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  item: EntitySummary;
  viewLabel: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="mvp18-entity-card">
      <div>
        <h3>{entityLabel(item)}</h3>
        <div className="mvp18-entity-meta">
          {item.external_id ? <span>ID: {item.external_id}</span> : <span>Record: {shortId(item.id)}</span>}
          <StatusBadge status={item.status} />
          <span>Owner: {item.owner_name || "-"}</span>
          <span>Target: {formatDate(item.target_date)}</span>
          <span>Progress: {item.progress_percent ?? 0}%</span>
        </div>
        {item.description ? <p>{item.description}</p> : null}
      </div>

      <div className="mvp18-actions">
        <button className="mvp18-button-primary" onClick={onView}>{viewLabel}</button>
        <button className="mvp18-button-secondary" onClick={onEdit}>Change</button>
        <button className="mvp18-button-danger" onClick={onDelete}>{deleteLabel}</button>
      </div>
    </div>
  );
}

function HierarchyFormModal({
  state,
  onClose,
  onSubmit,
}: {
  state: FormState;
  onClose: () => void;
  onSubmit: (payload: HierarchyFormPayload) => void;
}) {
  const isTitleBased = state.entityKind === "task" || state.entityKind === "subtask";
  const item = state.item;

  const [externalId, setExternalId] = useState(item?.external_id || "");
  const [label, setLabel] = useState(isTitleBased ? item?.title || "" : item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [status, setStatus] = useState(item?.status || "Not Started");
  const [priority, setPriority] = useState(item?.priority || "");
  const [ownerName, setOwnerName] = useState(item?.owner_name || "");
  const [startDate, setStartDate] = useState(item?.start_date || "");
  const [targetDate, setTargetDate] = useState(item?.target_date || "");

  const title = `${state.mode === "create" ? "Add" : "Change"} ${state.entityKind}`;

  return (
    <div className="mvp18-modal-backdrop">
      <div className="mvp18-modal">
        <h2>{title}</h2>

        <form
          className="mvp18-form"
          onSubmit={(event) => {
            event.preventDefault();
            const payload: HierarchyFormPayload = {
              external_id: externalId || null,
              description: description || null,
              status,
              priority: priority || null,
              owner_name: ownerName || null,
              start_date: startDate || null,
            };

            if (isTitleBased) {
              payload.title = label;
              payload.target_completion_date = targetDate || null;
            } else if (state.entityKind === "engagement") {
              payload.name = label;
              payload.target_end_date = targetDate || null;
            } else {
              payload.name = label;
              payload.target_completion_date = targetDate || null;
            }

            onSubmit(payload);
          }}
        >
          <div className="mvp18-form-grid">
            {state.entityKind !== "engagement" ? (
              <label>
                External ID
                <input value={externalId} onChange={(event) => setExternalId(event.target.value)} />
              </label>
            ) : null}

            <label>
              {isTitleBased ? "Title" : "Name"}
              <input value={label} onChange={(event) => setLabel(event.target.value)} required />
            </label>

            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            {(state.entityKind === "task" || state.entityKind === "subtask") ? (
              <label>
                Priority
                <input value={priority} onChange={(event) => setPriority(event.target.value)} />
              </label>
            ) : null}

            <label>
              Owner
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
            </label>

            <label>
              Start Date
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>

            <label>
              Target Date
              <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            </label>
          </div>

          <label>
            Description
            <textarea value={description} rows={4} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <div className="mvp18-actions">
            <button className="mvp18-button-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="mvp18-button-primary" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EngagementsPage({ setFormState }: { setFormState: (state: FormState | null) => void }) {
  const queryClient = useQueryClient();
  const engagementsQuery = useQuery({ queryKey: ["mvp18-engagements"], queryFn: getEngagements, retry: 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteEngagement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvp18-engagements"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-dashboard-status-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-reminder-indicator"] });
    },
  });

  if (engagementsQuery.isLoading) return <LoadingPanel label="Loading engagements..." />;
  if (engagementsQuery.isError) return <ErrorPanel error={engagementsQuery.error} />;

  const items = engagementsQuery.data ?? [];

  return (
    <>
      <div className="mvp18-page-header">
        <div>
          <h1>Engagements</h1>
          <p>Select an engagement to see its related workstreams.</p>
        </div>
      </div>

      <div className="mvp18-list">
        {items.length === 0 ? <EmptyPanel label="No engagements yet." /> : null}
        {items.map((item) => (
          <EntityCard
            key={item.id}
            item={item}
            viewLabel="View"
            deleteLabel="Delete"
            onView={() => navigateTo(`/engagements/${item.id}`)}
            onEdit={() => setFormState({ mode: "edit", entityKind: "engagement", item })}
            onDelete={() => {
              const ok = window.confirm(
                "Are you sure you want to delete this engagement?\n\nThis will delete related workstreams, deliverables, tasks, sub-tasks, workspace records, files, reminders, and recommendations.\n\nThis action cannot be undone.",
              );
              if (ok) deleteMutation.mutate(item.id);
            }}
          />
        ))}
      </div>

      <div className="mvp18-panel">
        <button className="mvp18-button-primary" onClick={() => setFormState({ mode: "create", entityKind: "engagement" })}>
          Add Engagement
        </button>
      </div>
    </>
  );
}

function EngagementDetailPage({ id, setFormState }: { id: string; setFormState: (state: FormState | null) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["mvp18-engagement-workspace", id], queryFn: () => getEngagementWorkspace(id), retry: 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkstream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvp18-engagement-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-dashboard-status-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-reminder-indicator"] });
    },
  });

  if (query.isLoading) return <LoadingPanel label="Loading engagement workspace..." />;
  if (query.isError) return <ErrorPanel error={query.error} />;

  const workspace = query.data as EngagementWorkspace;

  return (
    <HierarchyChildrenPage
      title={entityLabel(workspace.engagement)}
      subtitle="Workstreams for this engagement."
      childrenLabel="Workstreams"
      items={workspace.workstreams}
      emptyLabel="No workstreams yet."
      addLabel="Add Workstream"
      viewLabel="View"
      onAdd={() => setFormState({ mode: "create", entityKind: "workstream", parentId: workspace.engagement.id })}
      onView={(item) => navigateTo(`/workstreams/${item.id}`)}
      onEdit={(item) => setFormState({ mode: "edit", entityKind: "workstream", item })}
      onDelete={(item) => {
        const ok = window.confirm(
          "Are you sure you want to delete this workstream?\n\nThis will delete related deliverables, tasks, sub-tasks, workspace records, files, reminders, and recommendations.\n\nThis action cannot be undone.",
        );
        if (ok) deleteMutation.mutate(item.id);
      }}
    />
  );
}

function WorkstreamDetailPage({ id, setFormState }: { id: string; setFormState: (state: FormState | null) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["mvp18-workstream-workspace", id], queryFn: () => getWorkstreamWorkspace(id), retry: 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteDeliverable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvp18-workstream-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-dashboard-status-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-reminder-indicator"] });
    },
  });

  if (query.isLoading) return <LoadingPanel label="Loading workstream workspace..." />;
  if (query.isError) return <ErrorPanel error={query.error} />;

  const workspace = query.data as WorkstreamWorkspace;

  return (
    <HierarchyChildrenPage
      title={entityLabel(workspace.workstream)}
      subtitle="Deliverables for this workstream."
      childrenLabel="Deliverables"
      items={workspace.deliverables}
      emptyLabel="No deliverables yet."
      addLabel="Add Deliverable"
      viewLabel="View"
      onAdd={() => setFormState({ mode: "create", entityKind: "deliverable", parentId: workspace.workstream.id })}
      onView={(item) => navigateTo(`/deliverables/${item.id}`)}
      onEdit={(item) => setFormState({ mode: "edit", entityKind: "deliverable", item })}
      onDelete={(item) => {
        const ok = window.confirm(
          "Are you sure you want to delete this deliverable?\n\nThis will delete related tasks, sub-tasks, workspace records, files, reminders, and recommendations.\n\nThis action cannot be undone.",
        );
        if (ok) deleteMutation.mutate(item.id);
      }}
    />
  );
}

function DeliverableDetailPage({ id, setFormState }: { id: string; setFormState: (state: FormState | null) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["mvp18-deliverable-workspace", id], queryFn: () => getDeliverableWorkspace(id), retry: 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvp18-deliverable-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-dashboard-status-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-reminder-indicator"] });
    },
  });

  if (query.isLoading) return <LoadingPanel label="Loading deliverable workspace..." />;
  if (query.isError) return <ErrorPanel error={query.error} />;

  const workspace = query.data as DeliverableWorkspace;

  return (
    <HierarchyChildrenPage
      title={entityLabel(workspace.deliverable)}
      subtitle="Tasks for this deliverable."
      childrenLabel="Tasks"
      items={workspace.tasks}
      emptyLabel="No tasks yet."
      addLabel="Add Task"
      viewLabel="Open Workspace"
      onAdd={() => setFormState({ mode: "create", entityKind: "task", parentId: workspace.deliverable.id })}
      onView={(item) => navigateTo(`/tasks/${item.id}`)}
      onEdit={(item) => setFormState({ mode: "edit", entityKind: "task", item })}
      onDelete={(item) => {
        const ok = window.confirm(
          "Are you sure you want to delete this task?\n\nThis will delete related sub-tasks, workspace records, files, reminders, and recommendations.\n\nThis action cannot be undone.",
        );
        if (ok) deleteMutation.mutate(item.id);
      }}
    />
  );
}

function HierarchyChildrenPage({
  title,
  subtitle,
  childrenLabel,
  items,
  emptyLabel,
  addLabel,
  viewLabel,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  childrenLabel: string;
  items: EntitySummary[];
  emptyLabel: string;
  addLabel: string;
  viewLabel: string;
  onAdd: () => void;
  onView: (item: EntitySummary) => void;
  onEdit: (item: EntitySummary) => void;
  onDelete: (item: EntitySummary) => void;
}) {
  return (
    <>
      <div className="mvp18-page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <section className="mvp18-panel">
        <h2>{childrenLabel}</h2>
        <div className="mvp18-list">
          {items.length === 0 ? <EmptyPanel label={emptyLabel} /> : null}
          {items.map((item) => (
            <EntityCard
              key={item.id}
              item={item}
              viewLabel={viewLabel}
              deleteLabel="Delete"
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      </section>

      <div className="mvp18-panel">
        <button className="mvp18-button-primary" onClick={onAdd}>{addLabel}</button>
      </div>
    </>
  );
}

function WorkspaceRecordCards({ counts }: { counts: Record<string, number> }) {
  const items = [
    ["Data Collections", counts.data_collections],
    ["Questions", counts.questions],
    ["Findings", counts.findings],
    ["Analysis", counts.analysis],
    ["Evidence", counts.evidence],
    ["Files", counts.files],
    ["Recommendations", counts.recommendations],
    ["Reminders", counts.reminders],
  ];

  return (
    <div className="mvp18-card-grid">
      {items.map(([label, value]) => (
        <div className="mvp18-summary-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function TaskWorkspacePage({ id, setFormState }: { id: string; setFormState: (state: FormState | null) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["mvp18-task-workspace", id], queryFn: () => getTaskWorkspace(id), retry: 1 });

  const deleteMutation = useMutation({
    mutationFn: deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mvp18-task-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-dashboard-status-summary"] });
      queryClient.invalidateQueries({ queryKey: ["mvp18-reminder-indicator"] });
    },
  });

  if (query.isLoading) return <LoadingPanel label="Loading task workspace..." />;
  if (query.isError) return <ErrorPanel error={query.error} />;

  const workspace = query.data as TaskWorkspace;

  return (
    <>
      <div className="mvp18-page-header">
        <div>
          <h1>{entityLabel(workspace.task)}</h1>
          <p>{workspace.task.description || "Task workspace"}</p>
          <div className="mvp18-entity-meta">
            <StatusBadge status={workspace.task.status} />
            <span>Owner: {workspace.task.owner_name || "-"}</span>
            <span>Target: {formatDate(workspace.task.target_date)}</span>
          </div>
        </div>
      </div>

      <WorkspaceRecordCards counts={workspace.record_counts} />

      <HierarchyChildrenPage
        title="Sub-tasks"
        subtitle="Sub-tasks for this task."
        childrenLabel="Sub-tasks"
        items={workspace.subtasks}
        emptyLabel="No sub-tasks yet."
        addLabel="Add Sub-task"
        viewLabel="Open Workspace"
        onAdd={() => setFormState({ mode: "create", entityKind: "subtask", parentId: workspace.task.id })}
        onView={(item) => navigateTo(`/subtasks/${item.id}`)}
        onEdit={(item) => setFormState({ mode: "edit", entityKind: "subtask", item })}
        onDelete={(item) => {
          const ok = window.confirm(
            "Are you sure you want to delete this sub-task?\n\nThis will delete related workspace records, files, reminders, and recommendations.\n\nThis action cannot be undone.",
          );
          if (ok) deleteMutation.mutate(item.id);
        }}
      />

      <Mvp18WorkspacePanel scopeType="task" scopeId={workspace.task.id} />
    </>
  );
}

function SubtaskWorkspacePage({ id }: { id: string }) {
  const query = useQuery({ queryKey: ["mvp18-subtask-workspace", id], queryFn: () => getSubtaskWorkspace(id), retry: 1 });

  if (query.isLoading) return <LoadingPanel label="Loading sub-task workspace..." />;
  if (query.isError) return <ErrorPanel error={query.error} />;

  const workspace = query.data as SubtaskWorkspace;

  return (
    <>
      <div className="mvp18-page-header">
        <div>
          <h1>{entityLabel(workspace.subtask)}</h1>
          <p>{workspace.subtask.description || "Sub-task workspace"}</p>
          <div className="mvp18-entity-meta">
            <StatusBadge status={workspace.subtask.status} />
            <span>Owner: {workspace.subtask.owner_name || "-"}</span>
            <span>Target: {formatDate(workspace.subtask.target_date)}</span>
          </div>
        </div>
      </div>

      <WorkspaceRecordCards counts={workspace.record_counts} />
      <Mvp18WorkspacePanel scopeType="subtask" scopeId={workspace.subtask.id} />
    </>
  );
}

function PlaceholderPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mvp18-panel">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
}

function usePageBreadcrumb(route: RouteState): BreadcrumbItem[] {
  return useMemo(() => {
    if (route.path === "/") return [];
    return route.parts.map((part, index) => ({
      entity_type: "route",
      entity_id: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
      label: part,
    }));
  }, [route.path, route.parts]);
}

function MainRouter({ setFormState }: { setFormState: (state: FormState | null) => void }) {
  const [route, setRoute] = useState<RouteState>(() => normalizePath());

  useEffect(() => {
    const handler = () => setRoute(normalizePath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const parts = route.parts;

  if (route.path === "/" || parts.length === 0) return <DashboardPage />;
  if (parts[0] === "engagements" && parts.length === 1) return <EngagementsPage setFormState={setFormState} />;
  if (parts[0] === "engagements" && parts[1]) return <EngagementDetailPage id={parts[1]} setFormState={setFormState} />;
  if (parts[0] === "workstreams" && parts[1]) return <WorkstreamDetailPage id={parts[1]} setFormState={setFormState} />;
  if (parts[0] === "deliverables" && parts[1]) return <DeliverableDetailPage id={parts[1]} setFormState={setFormState} />;
  if (parts[0] === "tasks" && parts[1]) return <TaskWorkspacePage id={parts[1]} setFormState={setFormState} />;
  if (parts[0] === "subtasks" && parts[1]) return <SubtaskWorkspacePage id={parts[1]} />;

  if (parts[0] === "tasks") {
    return <PlaceholderPage title="My Work" message="Select a task from a deliverable page. MVP 18C can add a dedicated My Work list." />;
  }

  if (parts[0] === "reminders") {
    return <PlaceholderPage title="Reminders" message="Use the reminder icon in the top right. A full reminders screen can be added after the simplified workspace is complete." />;
  }

  if (parts[0] === "reports") {
    return <PlaceholderPage title="Reports" message="Reports remain available in the previous MVP flow. MVP 18 focuses on simplifying the workspace flow first." />;
  }

  if (parts[0] === "operations") {
    return <PlaceholderPage title="Operations" message="Operations dashboard remains available in the previous MVP flow. It can be moved into this simplified shell after MVP 18C." />;
  }

  if (parts[0] === "settings") {
    return <PlaceholderPage title="Settings" message="Runtime configuration and diagnostics can be moved here after the hierarchy workspace is complete." />;
  }

  return <PlaceholderPage title="Page Not Found" message="The requested workspace route was not found." />;
}

function App() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredSession | null>(() => getStoredSession());
  const [formState, setFormState] = useState<FormState | null>(null);
  const [route, setRoute] = useState<RouteState>(() => normalizePath());

  useEffect(() => {
    const handler = () => setRoute(normalizePath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const loginRequired = isLoginRequired();

  const createMutation = useMutation({
    mutationFn: async (stateAndPayload: { state: FormState; payload: HierarchyFormPayload }) => {
      const { state, payload } = stateAndPayload;
      if (state.entityKind === "engagement") return createEngagement(payload);
      if (state.entityKind === "workstream" && state.parentId) return createWorkstream(state.parentId, payload);
      if (state.entityKind === "deliverable" && state.parentId) return createDeliverable(state.parentId, payload);
      if (state.entityKind === "task" && state.parentId) return createTask(state.parentId, payload);
      if (state.entityKind === "subtask" && state.parentId) return createSubtask(state.parentId, payload);
      throw new Error("Missing parent context for create action.");
    },
    onSuccess: () => {
      setFormState(null);
      queryClient.invalidateQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (stateAndPayload: { state: FormState; payload: HierarchyFormPayload }) => {
      const { state, payload } = stateAndPayload;
      if (!state.item) throw new Error("Missing item for update action.");
      if (state.entityKind === "engagement") return updateEngagement(state.item.id, payload);
      if (state.entityKind === "workstream") return updateWorkstream(state.item.id, payload);
      if (state.entityKind === "deliverable") return updateDeliverable(state.item.id, payload);
      if (state.entityKind === "task") return updateTask(state.item.id, payload);
      if (state.entityKind === "subtask") return updateSubtask(state.item.id, payload);
      throw new Error("Unsupported update action.");
    },
    onSuccess: () => {
      setFormState(null);
      queryClient.invalidateQueries();
    },
  });

  if ((loginRequired || route.path === "/login") && !session) {
    return <LoginPage onLogin={setSession} />;
  }

  const breadcrumb = usePageBreadcrumb(route);

  return (
    <AppShell session={session} setSession={setSession} breadcrumb={breadcrumb}>
      <MainRouter setFormState={setFormState} />

      {formState ? (
        <HierarchyFormModal
          state={formState}
          onClose={() => setFormState(null)}
          onSubmit={(payload) => {
            if (formState.mode === "create") {
              createMutation.mutate({ state: formState, payload });
            } else {
              updateMutation.mutate({ state: formState, payload });
            }
          }}
        />
      ) : null}

      {createMutation.isError ? <ErrorPanel error={createMutation.error} /> : null}
      {updateMutation.isError ? <ErrorPanel error={updateMutation.error} /> : null}
    </AppShell>
  );
}

export default App;

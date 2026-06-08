import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateReminders,
  getActiveReminders,
  getDashboardSummary,
  getDeliverables,
  getEngagements,
  getSubtasks,
  getTasks,
  getWorkstreams,
} from "./api";

function StatusBadge({ status }: { status: string }) {
  return <span className="status-badge">{status}</span>;
}

function ReminderBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`reminder-badge reminder-${normalized}`}>{status}</span>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return value;
}

function App() {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const remindersQuery = useQuery({
    queryKey: ["active-reminders"],
    queryFn: getActiveReminders,
  });

  const generateRemindersMutation = useMutation({
    mutationFn: generateReminders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["active-reminders"] });
    },
  });

  const engagementsQuery = useQuery({
    queryKey: ["engagements"],
    queryFn: getEngagements,
  });

  const workstreamsQuery = useQuery({
    queryKey: ["workstreams"],
    queryFn: getWorkstreams,
  });

  const deliverablesQuery = useQuery({
    queryKey: ["deliverables"],
    queryFn: getDeliverables,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const subtasksQuery = useQuery({
    queryKey: ["subtasks"],
    queryFn: getSubtasks,
  });

  const summary = summaryQuery.data;
  const reminders = remindersQuery.data ?? [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ASM</div>
          <div>
            <h1>ASM Engagement Cockpit</h1>
            <p>Consulting execution tracker</p>
          </div>
        </div>

        <nav className="nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#reminders">Reminders</a>
          <a href="#engagements">Engagements</a>
          <a href="#workstreams">Workstreams</a>
          <a href="#deliverables">Deliverables</a>
          <a href="#tasks">Tasks</a>
          <a href="#subtasks">Sub-tasks</a>
          <a href="#future">Future MVPs</a>
        </nav>
      </aside>

      <main className="main">
        <section id="dashboard" className="hero-card">
          <div>
            <p className="eyebrow">MVP 3 Reminders</p>
            <h2>Persistent reminders are now available.</h2>
            <p>
              The cockpit now tracks due soon, due today, and overdue reminders for
              deliverables, tasks, and sub-tasks using the effective due date.
            </p>
          </div>
          <div className="health-panel">
            <span>Backend</span>
            <strong>{summaryQuery.isError ? "Not connected" : "Connected"}</strong>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Engagements</span>
            <strong>{summary?.engagements ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Workstreams</span>
            <strong>{summary?.workstreams ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Deliverables</span>
            <strong>{summary?.deliverables ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Tasks</span>
            <strong>{summary?.tasks ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Sub-tasks</span>
            <strong>{summary?.subtasks ?? 0}</strong>
          </div>
        </section>

        <section className="summary-grid reminders-summary-grid">
          <div className="summary-card reminder-summary">
            <span>Active Reminders</span>
            <strong>{summary?.active_reminders ?? 0}</strong>
          </div>
          <div className="summary-card reminder-summary overdue-card">
            <span>Overdue</span>
            <strong>{summary?.overdue_reminders ?? 0}</strong>
          </div>
          <div className="summary-card reminder-summary today-card">
            <span>Due Today</span>
            <strong>{summary?.due_today_reminders ?? 0}</strong>
          </div>
          <div className="summary-card reminder-summary soon-card">
            <span>Due Soon</span>
            <strong>{summary?.due_soon_reminders ?? 0}</strong>
          </div>
        </section>

        <section id="reminders" className="content-section">
          <div className="section-header">
            <div>
              <h2>Active Reminders</h2>
              <p>
                Reminders remain visible until the item is completed, date is revised,
                or the reminder is snoozed.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => generateRemindersMutation.mutate()}
              disabled={generateRemindersMutation.isPending}
            >
              {generateRemindersMutation.isPending ? "Generating..." : "Refresh Reminders"}
            </button>
          </div>

          <div className="reminder-list">
            {reminders.length === 0 ? (
              <div className="empty-reminders">
                No active reminders. Items may not have due dates within the reminder window.
              </div>
            ) : (
              reminders.map((reminder) => (
                <article key={reminder.id} className={`reminder-card severity-${reminder.severity}`}>
                  <div className="reminder-card-header">
                    <ReminderBadge status={reminder.reminder_status} />
                    <span className="parent-type">{reminder.parent_type}</span>
                  </div>
                  <h3>{reminder.title}</h3>
                  <p>{reminder.message}</p>
                  <div className="reminder-meta">
                    <span>Due: {formatDate(reminder.effective_due_date)}</span>
                    <span>Severity: {reminder.severity}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="engagements" className="content-section">
          <h2>Engagements</h2>
          <div className="table-card">
            {(engagementsQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No engagements yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {(engagementsQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.client_name ?? "-"}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.progress_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="workstreams" className="content-section">
          <h2>Workstreams</h2>
          <div className="table-card">
            {(workstreamsQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No workstreams yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>External ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {(workstreamsQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.name}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.progress_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="deliverables" className="content-section">
          <h2>Deliverables</h2>
          <div className="table-card">
            {(deliverablesQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No deliverables yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>External ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Target Date</th>
                    <th>Revised Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliverablesQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.name}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{formatDate(item.target_completion_date)}</td>
                      <td>{formatDate(item.revised_completion_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="tasks" className="content-section">
          <h2>Tasks</h2>
          <div className="table-card">
            {(tasksQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No tasks yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>External ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Target Date</th>
                    <th>Revised Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasksQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.title}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.priority ?? "-"}</td>
                      <td>{formatDate(item.target_completion_date)}</td>
                      <td>{formatDate(item.revised_completion_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="subtasks" className="content-section">
          <h2>Sub-tasks</h2>
          <div className="table-card">
            {(subtasksQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No sub-tasks yet. You will create these through the UI in later MVPs.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>External ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Target Date</th>
                    <th>Revised Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(subtasksQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.title}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.priority ?? "-"}</td>
                      <td>{formatDate(item.target_completion_date)}</td>
                      <td>{formatDate(item.revised_completion_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="future" className="content-section">
          <h2>Future MVPs</h2>
          <div className="future-grid">
            <div>Data points and stakeholder responses</div>
            <div>Findings and analysis</div>
            <div>Dictation and LLM refinement</div>
            <div>Files, evidence, and deliverable review</div>
            <div>Reports and exports</div>
            <div>Daily and weekly timesheet summaries</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
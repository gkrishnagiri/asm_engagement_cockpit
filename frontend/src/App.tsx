import { useQuery } from "@tanstack/react-query";

import {
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

function App() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
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
            <p className="eyebrow">MVP 1 Foundation</p>
            <h2>Engagement hierarchy foundation is ready.</h2>
            <p>
              This first version establishes the backend, database connection, core tables,
              API endpoints, and frontend shell for engagements, workstreams, deliverables,
              tasks, and sub-tasks.
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

        <section id="engagements" className="content-section">
          <h2>Engagements</h2>
          <div className="table-card">
            {(engagementsQuery.data ?? []).length === 0 ? (
              <p className="empty-state">No engagements yet. The Excel seed loader will populate this in a later step.</p>
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
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliverablesQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.name}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.review_status ?? "-"}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {(tasksQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.title}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.priority ?? "-"}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {(subtasksQuery.data ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.title}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.priority ?? "-"}</td>
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
            <div>Dates, statuses, progress rollups</div>
            <div>Persistent reminders</div>
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
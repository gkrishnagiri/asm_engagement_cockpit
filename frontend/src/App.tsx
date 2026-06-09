import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateReminders,
  getActiveReminders,
  getAnalysisOutputs,
  getDashboardSummary,
  getDataPoints,
  getDeliverables,
  getEngagements,
  getEvidenceItems,
  getFindings,
  getStakeholderQuestions,
  getSubtasks,
  getTasks,
  getUploadedFiles,
  getWorkstreams,
} from "./api";
import { Mvp6CaptureWorkspace } from "./Mvp6CaptureWorkspace";
import { Mvp7FileUploadPanel } from "./Mvp7FileUploadPanel";

function StatusBadge({ status }: { status: string }) {
  return <span className="status-badge">{status}</span>;
}

function ReminderBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`reminder-badge reminder-${normalized}`}>{status}</span>;
}

function ParentTypeBadge({ parentType }: { parentType: string }) {
  const labelMap: Record<string, string> = {
    deliverable: "Deliverable",
    task: "Task",
    subtask: "Sub-task",
    data_point: "Data Point",
    stakeholder_question: "Stakeholder Question",
  };

  return <span className="parent-type">{labelMap[parentType] ?? parentType}</span>;
}

function formatDate(value: string | null) {
  return value || "-";
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
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

  const dataPointsQuery = useQuery({
    queryKey: ["data-points"],
    queryFn: getDataPoints,
  });

  const stakeholderQuestionsQuery = useQuery({
    queryKey: ["stakeholder-questions"],
    queryFn: getStakeholderQuestions,
  });

  const findingsQuery = useQuery({
    queryKey: ["findings"],
    queryFn: getFindings,
  });

  const analysisOutputsQuery = useQuery({
    queryKey: ["analysis-outputs"],
    queryFn: getAnalysisOutputs,
  });

  const evidenceItemsQuery = useQuery({
    queryKey: ["evidence-items"],
    queryFn: getEvidenceItems,
  });

  const uploadedFilesQuery = useQuery({
    queryKey: ["uploaded-files"],
    queryFn: getUploadedFiles,
  });

  const summary = summaryQuery.data;
  const reminders = remindersQuery.data ?? [];
  const findings = findingsQuery.data ?? [];
  const analysisOutputs = analysisOutputsQuery.data ?? [];
  const evidenceItems = evidenceItemsQuery.data ?? [];
  const subtasks = subtasksQuery.data ?? [];
  const dataPoints = dataPointsQuery.data ?? [];
  const stakeholderQuestions = stakeholderQuestionsQuery.data ?? [];
  const uploadedFiles = uploadedFilesQuery.data ?? [];

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
          <a href="#data-points">Data Points</a>
          <a href="#stakeholder-questions">Stakeholder Questions</a>
          <a href="#findings">Findings</a>
          <a href="#analysis-outputs">Analysis Outputs</a>
          <a href="#evidence-items">Evidence</a>
          <a href="#dictation-refinement">Dictation & Refinement</a>
          <a href="#file-upload">File Upload</a>
          <a href="#future">Future MVPs</a>
        </nav>
      </aside>

      <main className="main">
        <section id="dashboard" className="hero-card">
          <div>
            <p className="eyebrow">MVP 7 File Upload and Evidence Attachments</p>
            <h2>Files can now be uploaded and linked to consulting work items.</h2>
            <p>
              The cockpit now supports local file uploads, file metadata tracking,
              download links, and attachment linkage to sub-tasks, data points,
              stakeholder questions, findings, analysis outputs, and evidence items.
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

        <section className="summary-grid data-summary-grid">
          <div className="summary-card data-card">
            <span>Data Points</span>
            <strong>{summary?.data_points ?? 0}</strong>
          </div>
          <div className="summary-card data-card">
            <span>Stakeholder Questions</span>
            <strong>{summary?.stakeholder_questions ?? 0}</strong>
          </div>
          <div className="summary-card output-card">
            <span>Findings</span>
            <strong>{findings.length}</strong>
          </div>
          <div className="summary-card output-card">
            <span>Analysis Outputs</span>
            <strong>{analysisOutputs.length}</strong>
          </div>
          <div className="summary-card output-card">
            <span>Evidence Items</span>
            <strong>{evidenceItems.length}</strong>
          </div>
          <div className="summary-card file-card">
            <span>Uploaded Files</span>
            <strong>{uploadedFiles.length}</strong>
          </div>
        </section>

        <section id="reminders" className="content-section">
          <div className="section-header">
            <div>
              <h2>Active Reminders</h2>
              <p>
                Reminders remain visible until completed, received, responded, revised,
                or snoozed.
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
                    <ParentTypeBadge parentType={reminder.parent_type} />
                  </div>
                  <h3>{reminder.title}</h3>
                  <p>{reminder.message}</p>
                  <div className="reminder-meta">
                    <span>Due: {formatDate(reminder.effective_due_date)}</span>
                    <span>Severity: {reminder.severity}</span>
                    <span>Reminder Type: {reminder.reminder_type}</span>
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
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
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
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
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
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
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
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
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
            {subtasks.length === 0 ? (
              <p className="empty-state">No sub-tasks yet.</p>
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
                  {subtasks.map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.title}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
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

        <section id="data-points" className="content-section">
          <h2>Data Points</h2>
          <div className="table-card wide-table">
            {dataPoints.length === 0 ? (
              <p className="empty-state">No data points yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Expected</th>
                    <th>Received</th>
                    <th>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPoints.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.topic}</strong>
                        {item.details ? <div className="small-note">{item.details}</div> : null}
                      </td>
                      <td>{item.source ?? "-"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{formatDate(item.expected_received_date)}</td>
                      <td>{formatDate(item.actual_received_date)}</td>
                      <td>{item.data_quality ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="stakeholder-questions" className="content-section">
          <h2>Stakeholder Questions</h2>
          <div className="table-card wide-table">
            {stakeholderQuestions.length === 0 ? (
              <p className="empty-state">No stakeholder questions yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Stakeholder</th>
                    <th>Status</th>
                    <th>Expected</th>
                    <th>Responded</th>
                    <th>Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeholderQuestions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.question_text}</strong>
                        {item.response_details ? (
                          <div className="small-note">Response: {item.response_details}</div>
                        ) : null}
                      </td>
                      <td>{item.question_category ?? "-"}</td>
                      <td>
                        {item.stakeholder_name ?? "-"}
                        {item.stakeholder_role ? <div className="small-note">{item.stakeholder_role}</div> : null}
                      </td>
                      <td>
                        <StatusBadge status={item.response_status} />
                      </td>
                      <td>{formatDate(item.expected_response_date)}</td>
                      <td>{formatDate(item.actual_response_date)}</td>
                      <td>{yesNo(item.follow_up_required)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="findings" className="content-section">
          <h2>Findings</h2>
          <div className="table-card wide-table">
            {findings.length === 0 ? (
              <p className="empty-state">No findings yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Finding</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Validated</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="small-note">{item.finding_text}</div>
                        {item.business_impact ? (
                          <div className="small-note">Impact: {item.business_impact}</div>
                        ) : null}
                        {item.recommendation ? (
                          <div className="small-note">Recommendation: {item.recommendation}</div>
                        ) : null}
                      </td>
                      <td>{item.finding_type ?? "-"}</td>
                      <td>{item.severity ?? "-"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{item.confidence_level ?? "-"}</td>
                      <td>{yesNo(item.is_validated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="analysis-outputs" className="content-section">
          <h2>Analysis Outputs</h2>
          <div className="table-card wide-table">
            {analysisOutputs.length === 0 ? (
              <p className="empty-state">No analysis outputs yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Analysis</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Reviewed By</th>
                    <th>Reviewed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisOutputs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.analysis_title}</strong>
                        <div className="small-note">{item.analysis_text}</div>
                        {item.methodology ? (
                          <div className="small-note">Methodology: {item.methodology}</div>
                        ) : null}
                        {item.limitations ? (
                          <div className="small-note">Limitations: {item.limitations}</div>
                        ) : null}
                      </td>
                      <td>{item.analysis_type ?? "-"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{item.confidence_level ?? "-"}</td>
                      <td>{item.reviewed_by ?? "-"}</td>
                      <td>{formatDate(item.reviewed_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section id="evidence-items" className="content-section">
          <h2>Evidence Items</h2>
          <div className="table-card wide-table">
            {evidenceItems.length === 0 ? (
              <p className="empty-state">No evidence items yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Evidence</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Date</th>
                    <th>Confidence</th>
                    <th>Primary</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        {item.description ? <div className="small-note">{item.description}</div> : null}
                        {item.source_reference ? (
                          <div className="small-note">Reference: {item.source_reference}</div>
                        ) : null}
                      </td>
                      <td>{item.evidence_type}</td>
                      <td>{item.source_name ?? "-"}</td>
                      <td>{formatDate(item.evidence_date)}</td>
                      <td>{item.confidence_level ?? "-"}</td>
                      <td>{yesNo(item.is_primary_evidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <Mvp6CaptureWorkspace subtasks={subtasks} />

        <Mvp7FileUploadPanel
          subtasks={subtasks}
          dataPoints={dataPoints}
          stakeholderQuestions={stakeholderQuestions}
          findings={findings}
          analysisOutputs={analysisOutputs}
          evidenceItems={evidenceItems}
          uploadedFiles={uploadedFiles}
        />

        <section id="future" className="content-section">
          <h2>Future MVPs</h2>
          <div className="future-grid">
            <div>LLM recommendations</div>
            <div>Reports and exports</div>
            <div>Daily and weekly timesheet summaries</div>
            <div>Deliverable review workflow</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
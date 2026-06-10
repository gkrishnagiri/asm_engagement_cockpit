import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  generateReminders,
  getActiveReminders,
  getAnalysisOutputs,
  getDashboardSummary,
  getDataPoints,
  getDeliverableReviewActionItems,
  getDeliverableReviewWorkflows,
  getDeliverableReviews,
  getDeliverables,
  getEngagements,
  getEvidenceItems,
  getFindings,
  getLlmRecommendationActionItems,
  getLlmRecommendationDecisions,
  getLlmRecommendationRevisions,
  getLlmRecommendations,
  getStakeholderQuestions,
  getSubtasks,
  getTasks,
  getTimesheetSummaries,
  getTimesheets,
  getUploadedFiles,
  getWorkstreams,
} from "./api";
import { Mvp6CaptureWorkspace } from "./Mvp6CaptureWorkspace";
import { Mvp7FileUploadPanel } from "./Mvp7FileUploadPanel";
import { Mvp8LlmPanel } from "./Mvp8LlmPanel";
import { Mvp9ReportsPanel } from "./Mvp9ReportsPanel";
import { Mvp10TimesheetPanel } from "./Mvp10TimesheetPanel";
import { Mvp11ReviewWorkflowPanel } from "./Mvp11ReviewWorkflowPanel";
import { Mvp12RecommendationManagementPanel } from "./Mvp12RecommendationManagementPanel";
import { Mvp13RoleBasedViewsPanel } from "./Mvp13RoleBasedViewsPanel";

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

  const engagementsQuery = useQuery({ queryKey: ["engagements"], queryFn: getEngagements });
  const workstreamsQuery = useQuery({ queryKey: ["workstreams"], queryFn: getWorkstreams });
  const deliverablesQuery = useQuery({ queryKey: ["deliverables"], queryFn: getDeliverables });
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: getTasks });
  const subtasksQuery = useQuery({ queryKey: ["subtasks"], queryFn: getSubtasks });
  const dataPointsQuery = useQuery({ queryKey: ["data-points"], queryFn: getDataPoints });
  const stakeholderQuestionsQuery = useQuery({
    queryKey: ["stakeholder-questions"],
    queryFn: getStakeholderQuestions,
  });
  const findingsQuery = useQuery({ queryKey: ["findings"], queryFn: getFindings });
  const analysisOutputsQuery = useQuery({
    queryKey: ["analysis-outputs"],
    queryFn: getAnalysisOutputs,
  });
  const evidenceItemsQuery = useQuery({ queryKey: ["evidence-items"], queryFn: getEvidenceItems });
  const uploadedFilesQuery = useQuery({ queryKey: ["uploaded-files"], queryFn: getUploadedFiles });
  const llmRecommendationsQuery = useQuery({
    queryKey: ["llm-recommendations"],
    queryFn: getLlmRecommendations,
  });
  const llmRecommendationDecisionsQuery = useQuery({
    queryKey: ["llm-recommendation-decisions"],
    queryFn: getLlmRecommendationDecisions,
  });
  const llmRecommendationRevisionsQuery = useQuery({
    queryKey: ["llm-recommendation-revisions"],
    queryFn: getLlmRecommendationRevisions,
  });
  const llmRecommendationActionItemsQuery = useQuery({
    queryKey: ["llm-recommendation-action-items"],
    queryFn: getLlmRecommendationActionItems,
  });
  const deliverableReviewsQuery = useQuery({
    queryKey: ["deliverable-reviews"],
    queryFn: getDeliverableReviews,
  });
  const reviewWorkflowsQuery = useQuery({
    queryKey: ["deliverable-review-workflows"],
    queryFn: getDeliverableReviewWorkflows,
  });
  const reviewActionItemsQuery = useQuery({
    queryKey: ["deliverable-review-action-items"],
    queryFn: getDeliverableReviewActionItems,
  });
  const timesheetsQuery = useQuery({ queryKey: ["timesheets"], queryFn: getTimesheets });
  const timesheetSummariesQuery = useQuery({
    queryKey: ["timesheet-summaries"],
    queryFn: getTimesheetSummaries,
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
  const deliverables = deliverablesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const engagements = engagementsQuery.data ?? [];
  const workstreams = workstreamsQuery.data ?? [];
  const llmRecommendations = llmRecommendationsQuery.data ?? [];
  const llmRecommendationDecisions = llmRecommendationDecisionsQuery.data ?? [];
  const llmRecommendationRevisions = llmRecommendationRevisionsQuery.data ?? [];
  const llmRecommendationActionItems = llmRecommendationActionItemsQuery.data ?? [];
  const deliverableReviews = deliverableReviewsQuery.data ?? [];
  const reviewWorkflows = reviewWorkflowsQuery.data ?? [];
  const reviewActionItems = reviewActionItemsQuery.data ?? [];
  const timesheets = timesheetsQuery.data ?? [];
  const timesheetSummaries = timesheetSummariesQuery.data ?? [];

  const totalTimesheetHours = timesheets.reduce((sum, item) => sum + item.effort_hours, 0);
  const openReviewActions = reviewActionItems.filter((item) => item.status.toLowerCase() !== "completed");
  const openRecommendationActions = llmRecommendationActionItems.filter(
    (item) => item.status.toLowerCase() !== "completed",
  );

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
          <a href="#role-based-views">Role-Based Views</a>
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
          <a href="#llm-recommendations">LLM Recommendations</a>
          <a href="#recommendation-management">Recommendation Management</a>
          <a href="#reports-exports">Reports & Exports</a>
          <a href="#timesheets">Timesheets</a>
          <a href="#review-workflow">Review Workflow</a>
          <a href="#future">Future MVPs</a>
        </nav>
      </aside>

      <main className="main">
        <section id="dashboard" className="hero-card">
          <div>
            <p className="eyebrow">MVP 13 Role-Based Views and Filters</p>
            <h2>Role-focused cockpit views and health filters are now available.</h2>
            <p>
              The cockpit now supports frontend role-based views for engagement leadership,
              delivery ownership, review/approval, data gathering, and automation advisory.
            </p>
          </div>
          <div className="health-panel">
            <span>Backend</span>
            <strong>{summaryQuery.isError ? "Not connected" : "Connected"}</strong>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card"><span>Engagements</span><strong>{summary?.engagements ?? 0}</strong></div>
          <div className="summary-card"><span>Workstreams</span><strong>{summary?.workstreams ?? 0}</strong></div>
          <div className="summary-card"><span>Deliverables</span><strong>{summary?.deliverables ?? 0}</strong></div>
          <div className="summary-card"><span>Tasks</span><strong>{summary?.tasks ?? 0}</strong></div>
          <div className="summary-card"><span>Sub-tasks</span><strong>{summary?.subtasks ?? 0}</strong></div>
        </section>

        <section className="summary-grid data-summary-grid">
          <div className="summary-card data-card"><span>Data Points</span><strong>{summary?.data_points ?? 0}</strong></div>
          <div className="summary-card data-card"><span>Stakeholder Questions</span><strong>{summary?.stakeholder_questions ?? 0}</strong></div>
          <div className="summary-card output-card"><span>Findings</span><strong>{findings.length}</strong></div>
          <div className="summary-card output-card"><span>Analysis Outputs</span><strong>{analysisOutputs.length}</strong></div>
          <div className="summary-card file-card"><span>Uploaded Files</span><strong>{uploadedFiles.length}</strong></div>
          <div className="summary-card llm-card"><span>LLM Recommendations</span><strong>{llmRecommendations.length}</strong></div>
          <div className="summary-card recommendation-summary-card"><span>Recommendation Actions</span><strong>{openRecommendationActions.length}</strong></div>
          <div className="summary-card llm-card"><span>Deliverable Reviews</span><strong>{deliverableReviews.length}</strong></div>
          <div className="summary-card timesheet-summary-card"><span>Timesheet Entries</span><strong>{timesheets.length}</strong></div>
          <div className="summary-card timesheet-summary-card"><span>Timesheet Hours</span><strong>{totalTimesheetHours.toFixed(1)}</strong></div>
          <div className="summary-card review-summary-card"><span>Review Workflows</span><strong>{reviewWorkflows.length}</strong></div>
          <div className="summary-card review-summary-card"><span>Open Review Actions</span><strong>{openReviewActions.length}</strong></div>
        </section>

        <Mvp13RoleBasedViewsPanel
          workstreams={workstreams}
          deliverables={deliverables}
          tasks={tasks}
          subtasks={subtasks}
          dataPoints={dataPoints}
          stakeholderQuestions={stakeholderQuestions}
          findings={findings}
          analysisOutputs={analysisOutputs}
          llmRecommendations={llmRecommendations}
          reviewWorkflows={reviewWorkflows}
          reviewActionItems={reviewActionItems}
          recommendationActionItems={llmRecommendationActionItems}
        />

        <section id="reminders" className="content-section">
          <div className="section-header">
            <div>
              <h2>Active Reminders</h2>
              <p>Reminders remain visible until completed, received, responded, revised, or snoozed.</p>
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
              <div className="empty-reminders">No active reminders. Items may not have due dates within the reminder window.</div>
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
            {engagements.length === 0 ? (
              <p className="empty-state">No engagements yet.</p>
            ) : (
              <table>
                <thead><tr><th>Name</th><th>Client</th><th>Status</th><th>Progress</th></tr></thead>
                <tbody>
                  {engagements.map((item) => (
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
            {workstreams.length === 0 ? (
              <p className="empty-state">No workstreams yet.</p>
            ) : (
              <table>
                <thead><tr><th>External ID</th><th>Name</th><th>Status</th><th>Progress</th></tr></thead>
                <tbody>
                  {workstreams.map((item) => (
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
            {deliverables.length === 0 ? (
              <p className="empty-state">No deliverables yet.</p>
            ) : (
              <table>
                <thead><tr><th>External ID</th><th>Name</th><th>Status</th><th>Review Status</th><th>Target Date</th><th>Approval Date</th></tr></thead>
                <tbody>
                  {deliverables.map((item) => (
                    <tr key={item.id}>
                      <td>{item.external_id ?? "-"}</td>
                      <td>{item.name}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.review_status ?? "-"}</td>
                      <td>{formatDate(item.target_completion_date)}</td>
                      <td>{formatDate(item.approval_date)}</td>
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
            {tasks.length === 0 ? (
              <p className="empty-state">No tasks yet.</p>
            ) : (
              <table>
                <thead><tr><th>External ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Target Date</th><th>Revised Date</th></tr></thead>
                <tbody>
                  {tasks.map((item) => (
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
            {subtasks.length === 0 ? (
              <p className="empty-state">No sub-tasks yet.</p>
            ) : (
              <table>
                <thead><tr><th>External ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Target Date</th><th>Revised Date</th></tr></thead>
                <tbody>
                  {subtasks.map((item) => (
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

        <section id="data-points" className="content-section">
          <h2>Data Points</h2>
          <div className="table-card wide-table">
            {dataPoints.length === 0 ? (
              <p className="empty-state">No data points yet.</p>
            ) : (
              <table>
                <thead><tr><th>Topic</th><th>Source</th><th>Status</th><th>Expected</th><th>Received</th><th>Quality</th></tr></thead>
                <tbody>
                  {dataPoints.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.topic}</strong>{item.details ? <div className="small-note">{item.details}</div> : null}</td>
                      <td>{item.source ?? "-"}</td>
                      <td><StatusBadge status={item.status} /></td>
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
                <thead><tr><th>Question</th><th>Category</th><th>Stakeholder</th><th>Status</th><th>Expected</th><th>Responded</th><th>Follow-up</th></tr></thead>
                <tbody>
                  {stakeholderQuestions.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.question_text}</strong>{item.response_details ? <div className="small-note">Response: {item.response_details}</div> : null}</td>
                      <td>{item.question_category ?? "-"}</td>
                      <td>{item.stakeholder_name ?? "-"}{item.stakeholder_role ? <div className="small-note">{item.stakeholder_role}</div> : null}</td>
                      <td><StatusBadge status={item.response_status} /></td>
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
                <thead><tr><th>Finding</th><th>Type</th><th>Severity</th><th>Status</th><th>Confidence</th><th>Validated</th></tr></thead>
                <tbody>
                  {findings.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="small-note">{item.finding_text}</div>
                        {item.business_impact ? <div className="small-note">Impact: {item.business_impact}</div> : null}
                        {item.recommendation ? <div className="small-note">Recommendation: {item.recommendation}</div> : null}
                      </td>
                      <td>{item.finding_type ?? "-"}</td>
                      <td>{item.severity ?? "-"}</td>
                      <td><StatusBadge status={item.status} /></td>
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
                <thead><tr><th>Analysis</th><th>Type</th><th>Status</th><th>Confidence</th><th>Reviewed By</th><th>Reviewed Date</th></tr></thead>
                <tbody>
                  {analysisOutputs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.analysis_title}</strong>
                        <div className="small-note">{item.analysis_text}</div>
                        {item.methodology ? <div className="small-note">Methodology: {item.methodology}</div> : null}
                        {item.limitations ? <div className="small-note">Limitations: {item.limitations}</div> : null}
                      </td>
                      <td>{item.analysis_type ?? "-"}</td>
                      <td><StatusBadge status={item.status} /></td>
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
                <thead><tr><th>Evidence</th><th>Type</th><th>Source</th><th>Date</th><th>Confidence</th><th>Primary</th></tr></thead>
                <tbody>
                  {evidenceItems.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong>{item.description ? <div className="small-note">{item.description}</div> : null}{item.source_reference ? <div className="small-note">Reference: {item.source_reference}</div> : null}</td>
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

        <Mvp8LlmPanel
          deliverables={deliverables}
          tasks={tasks}
          subtasks={subtasks}
          findings={findings}
          analysisOutputs={analysisOutputs}
          recommendations={llmRecommendations}
          deliverableReviews={deliverableReviews}
        />

        <Mvp12RecommendationManagementPanel
          recommendations={llmRecommendations}
          decisions={llmRecommendationDecisions}
          revisions={llmRecommendationRevisions}
          actionItems={llmRecommendationActionItems}
        />

        <Mvp9ReportsPanel
          engagements={engagements}
          workstreams={workstreams}
          deliverables={deliverables}
          tasks={tasks}
          subtasks={subtasks}
          dataPoints={dataPoints}
          stakeholderQuestions={stakeholderQuestions}
          findings={findings}
          analysisOutputs={analysisOutputs}
          evidenceItems={evidenceItems}
          uploadedFiles={uploadedFiles}
          llmRecommendations={llmRecommendations}
          deliverableReviews={deliverableReviews}
        />

        <Mvp10TimesheetPanel
          workstreams={workstreams}
          deliverables={deliverables}
          tasks={tasks}
          subtasks={subtasks}
          timesheets={timesheets}
          timesheetSummaries={timesheetSummaries}
        />

        <Mvp11ReviewWorkflowPanel
          deliverables={deliverables}
          reviewWorkflows={reviewWorkflows}
          reviewActionItems={reviewActionItems}
        />

        <section id="future" className="content-section">
          <h2>Future MVPs</h2>
          <div className="future-grid">
            <div>Production hardening and authentication</div>
            <div>Audit, notifications, and collaboration workflow</div>
            <div>Deployment readiness and packaging</div>
            <div>Advanced reporting and charts</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
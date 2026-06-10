import { useQuery } from "@tanstack/react-query";

import {
  getFrontendRuntimeConfig,
  getRuntimeDiagnostics,
  type FrontendRuntimeConfig,
  type RuntimeDiagnostics,
} from "./api";

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function StatusBadge({ status }: { status: string }) {
  return <span className="status-badge">{status}</span>;
}

function ConfigRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | string[] | null | undefined;
}) {
  let displayValue = "-";

  if (Array.isArray(value)) {
    displayValue = value.join(", ");
  } else if (typeof value === "boolean") {
    displayValue = yesNo(value);
  } else if (value !== null && value !== undefined) {
    displayValue = String(value);
  }

  return (
    <tr>
      <td>
        <strong>{label}</strong>
      </td>
      <td>{displayValue}</td>
    </tr>
  );
}

function FrontendConfigTable({ config }: { config: FrontendRuntimeConfig }) {
  return (
    <div className="table-card wide-table">
      <table>
        <thead>
          <tr>
            <th>Frontend Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <ConfigRow label="API Base URL" value={config.api_base_url} />
          <ConfigRow label="Frontend API Auth Enabled" value={config.api_auth_enabled} />
          <ConfigRow label="Frontend API Key Configured" value={config.api_auth_key_configured} />
        </tbody>
      </table>
    </div>
  );
}

function BackendDiagnosticsTable({ diagnostics }: { diagnostics: RuntimeDiagnostics }) {
  return (
    <div className="table-card wide-table">
      <table>
        <thead>
          <tr>
            <th>Backend Diagnostic</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <ConfigRow label="App Name" value={diagnostics.app_name} />
          <ConfigRow label="App Environment" value={diagnostics.app_env} />
          <ConfigRow label="Database Status" value={diagnostics.database_status} />
          <ConfigRow label="CORS Origins" value={diagnostics.cors_origins} />
          <ConfigRow label="OpenAI Model" value={diagnostics.openai_model} />
          <ConfigRow label="OpenAI Tracing" value={diagnostics.openai_tracing} />
          <ConfigRow label="OpenAI API Key Configured" value={diagnostics.openai_api_key_configured} />
          <ConfigRow label="Backend API Auth Enabled" value={diagnostics.api_auth_enabled} />
          <ConfigRow label="Backend API Key Configured" value={diagnostics.api_auth_key_configured} />
          <ConfigRow label="Request Logging" value={diagnostics.log_requests} />
        </tbody>
      </table>
    </div>
  );
}

export function Mvp14RuntimeConfigPanel() {
  const frontendConfig = getFrontendRuntimeConfig();

  const diagnosticsQuery = useQuery({
    queryKey: ["runtime-diagnostics"],
    queryFn: getRuntimeDiagnostics,
    retry: 1,
  });

  const backendStatus = diagnosticsQuery.isError
    ? "Diagnostics Error"
    : diagnosticsQuery.isLoading
      ? "Checking"
      : "Diagnostics OK";

  return (
    <section id="runtime-config" className="content-section">
      <div className="section-header">
        <div>
          <h2>Runtime Configuration and Diagnostics</h2>
          <p>
            Validate frontend environment settings, backend diagnostics, OpenAI configuration,
            request logging, CORS, and API key readiness.
          </p>
        </div>
        <StatusBadge status={backendStatus} />
      </div>

      <div className="report-summary-grid">
        <div className="report-card">
          <span>Frontend API Auth</span>
          <strong>{frontendConfig.api_auth_enabled ? "On" : "Off"}</strong>
          <p>Controlled by VITE_API_AUTH_ENABLED</p>
        </div>

        <div className="report-card">
          <span>Frontend API Key</span>
          <strong>{frontendConfig.api_auth_key_configured ? "Set" : "Not Set"}</strong>
          <p>Controlled by VITE_API_AUTH_KEY</p>
        </div>

        <div className="report-card">
          <span>Backend Diagnostics</span>
          <strong>{diagnosticsQuery.data ? "OK" : diagnosticsQuery.isError ? "Error" : "Loading"}</strong>
          <p>Reads /api/diagnostics/runtime</p>
        </div>

        <div className="report-card">
          <span>Backend API Auth</span>
          <strong>{diagnosticsQuery.data?.api_auth_enabled ? "On" : "Off"}</strong>
          <p>Controlled by API_AUTH_ENABLED</p>
        </div>

        <div className="report-card">
          <span>Database</span>
          <strong>{diagnosticsQuery.data?.database_status ?? "-"}</strong>
          <p>Runtime connection check</p>
        </div>

        <div className="report-card">
          <span>OpenAI Tracing</span>
          <strong>{diagnosticsQuery.data?.openai_tracing ? "On" : "Off"}</strong>
          <p>Backend OpenAI trace setting</p>
        </div>
      </div>

      <div className="timesheet-grid">
        <div className="timesheet-card">
          <h3>Frontend Runtime Settings</h3>
          <p>These values come from Vite environment variables.</p>
          <FrontendConfigTable config={frontendConfig} />
        </div>

        <div className="timesheet-card">
          <h3>Backend Runtime Diagnostics</h3>
          <p>These values come from the protected diagnostics endpoint.</p>

          {diagnosticsQuery.isLoading ? (
            <div className="selected-context">Loading backend diagnostics...</div>
          ) : diagnosticsQuery.isError ? (
            <div className="dictation-message">
              Could not load backend diagnostics. Check that the backend is running and that API key settings match.
            </div>
          ) : diagnosticsQuery.data ? (
            <BackendDiagnosticsTable diagnostics={diagnosticsQuery.data} />
          ) : (
            <div className="selected-context">No diagnostics returned.</div>
          )}
        </div>
      </div>

      <div className="selected-context content-section">
        Keep frontend and backend auth disabled until both sides are configured. Later, set
        backend API_AUTH_ENABLED=true and frontend VITE_API_AUTH_ENABLED=true with matching keys.
      </div>
    </section>
  );
}
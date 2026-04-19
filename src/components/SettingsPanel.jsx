import { C } from "../lib/founderReachCore";
import { Icon } from "./Icon";

const serviceLabels = {
  anthropic: "Anthropic",
  tinyfish: "TinyFish",
  openai: "OpenAI Images",
  heygen: "HeyGen",
  sendgrid: "SendGrid",
  runway: "Runway",
  stability: "Stability AI",
};

const requiredAccounts = [
  "TinyFish API key for live search, fetch, and browser automation",
  "Anthropic API key for orchestration and agent simulation",
  "OpenAI API key for image generation",
  "HeyGen API key for avatar video generation",
  "SendGrid API key plus a verified sender email for live email delivery",
  "Optional Runway and Stability keys if you want alternate media pipelines",
  "Platform logins you want automation to touch, such as X, LinkedIn, Beehiiv/Substack, and Calendly",
];

const signalLegend = [
  { label: "Green glow", meaning: "This agent is the best fit for the mode you are currently in.", color: "#22c55e" },
  { label: "Red glow", meaning: "This agent is actively running right now.", color: "#ef4444" },
  { label: "Yellow glow", meaning: "This agent is pending, blocked, or needs attention.", color: "#eab308" },
];

export function SettingsPanel({ onClose, onRefresh, status }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(9,31,23,0.38)",
        zIndex: 40,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: 430,
          background: C.surface,
          boxShadow: "-24px 0 60px rgba(9,31,23,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 20px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Settings</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              Local review mode is active. Demo and live integrations stay on the backend, and raw provider keys are not exposed in the browser.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", padding: 4 }}>
            <Icon name="close" size={18} color={C.muted} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", display: "grid", gap: 18 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: C.base,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
              Workspace mode
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {status.workspaceMode === "local" ? "Local desktop review" : status.workspaceMode}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
              State is currently persisted in your browser so you can click through CRM, Vault, Calendar, and Chat without external setup.
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
              In a deployed environment, demo credentials should be stored only in backend environment variables and not in the client app.
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: C.base,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>How it works</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                The orchestrator reads your request, routes it to the best specialists, and each specialist pushes work back into the shared Chat, CRM, Calendar, and Vault workspace.
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                Hover any agent in the rail to inspect the process it uses, the kind of prompt it receives, and a plain-language explanation of how that agent works.
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                Signal colors:
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {signalLegend.map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                      <strong>{item.label}:</strong> {item.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Integration status</div>
              <button
                onClick={onRefresh}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(serviceLabels).map(([key, label]) => {
                const connected = Boolean(status.services?.[key]?.configured);
                return (
                  <div
                    key={key}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${connected ? C.accentM : C.border}`,
                      background: connected ? C.accentL : C.surface,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                        {connected ? "Configured and ready for live testing" : "Not configured yet"}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: connected ? "#258530" : C.base,
                        color: connected ? "#fff" : C.muted,
                      }}
                    >
                      {connected ? "Connected" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#fef6e8",
              border: "1px solid #f5d69c",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: C.warn, marginBottom: 8 }}>
              Demo-to-live checklist
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {requiredAccounts.map((item) => (
                <div key={item} style={{ fontSize: 12, color: C.text, lineHeight: 1.55 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { AGENTS, C, getAgentGuide } from "../lib/founderReachCore";
import { API_KEY_FIELDS, normalizeApiKeys } from "../lib/session";
import { startIntegrationConnect } from "../services/api";
import { ExecutionBadge } from "./ExecutionBadge";
import { Icon } from "./Icon";

const serviceLabels = {
  anthropic: "Anthropic",
  tinyfish: "TinyFish",
  composio: "Composio",
  axiom: "Axiom",
  mixedbread: "Mixedbread",
  openai: "OpenAI Images",
  gemini: "Gemini",
  heygen: "HeyGen",
  sendgrid: "SendGrid",
  agentmail: "AgentMail",
  runway: "Runway",
  stability: "Stability AI",
};

const signalLegend = [
  { label: "Green glow", meaning: "This agent is the best fit for the mode you are currently in.", color: "#22c55e" },
  { label: "Red glow", meaning: "This agent is actively running right now.", color: "#ef4444" },
  { label: "Yellow glow", meaning: "This agent is pending, blocked, or needs attention.", color: "#eab308" },
];

export function SettingsPanel({
  onClearApiKeys,
  onClose,
  onRefresh,
  onReplayDemo,
  onResetDemo,
  onSaveApiKeys,
  onSignOut,
  status,
  userApiKeys,
}) {
  const [draftKeys, setDraftKeys] = useState(normalizeApiKeys(userApiKeys));
  const [selectedAgentId, setSelectedAgentId] = useState("orchestrator");
  const [connectingToolkit, setConnectingToolkit] = useState("");

  const selectedGuide = useMemo(() => getAgentGuide(selectedAgentId), [selectedAgentId]);
  const handleSaveKeys = () => onSaveApiKeys(draftKeys);

  async function handleConnect(toolkit) {
    setConnectingToolkit(toolkit);
    try {
      const result = await startIntegrationConnect(toolkit);
      track("Connect Account Clicked", { toolkit });
      window.location.assign(result.redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start connection.";
      window.alert(message);
    } finally {
      setConnectingToolkit("");
    }
  }

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
        data-tour="settings-panel"
        style={{
          width: 460,
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
              Manage personal API keys, replay the product walkthrough, and inspect how every agent works.
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
              Demo Mode uses fabricated runs so new users can understand the product without risking real automation. Other modes can use backend keys, browser-supplied keys, and connected Google accounts when available.
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>How it works</div>
              <button
                onClick={onReplayDemo}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="play" size={12} color={C.muted} />
                Replay demo
              </button>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                The orchestrator reads a request, routes it to specialists, and those specialists write back into Chat, CRM, Calendar, and Vault as one shared system.
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                Use the runs list, chat, and run-context sidebar to understand what the system is doing, then browse the agents below for their prompt previews and operating logic.
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>Signal colors:</div>
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

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: C.base,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Personal API keys</div>
              <div style={{ fontSize: 11, color: C.muted }}>Stored in this browser only</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Add your own keys to test the app with your accounts. They are sent only with requests from this browser session and can be cleared at any time.
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveKeys();
              }}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {API_KEY_FIELDS.map((field) => (
                  <label key={field.id} style={{ display: "grid", gap: 5 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{field.label}</span>
                    <input
                      type="password"
                      value={draftKeys[field.id] || ""}
                      onChange={(event) =>
                        setDraftKeys((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      placeholder={`Enter ${field.envKey}`}
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: C.text,
                        padding: "10px 12px",
                        fontSize: 12,
                      }}
                    />
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    border: "none",
                    background: C.text,
                    color: "#fff",
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Save keys
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftKeys(normalizeApiKeys({}));
                    onClearApiKeys();
                  }}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: C.base,
              border: `1px solid ${C.border}`,
            }}
          >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Connected accounts</div>
              <ExecutionBadge
                mode={status.integrations?.providerAvailable ? "live" : "needs-keys"}
                label={status.integrations?.providerAvailable ? "Composio ready" : "Backend setup needed"}
                compact
              />
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Composio runs on the server side and enables connected Google accounts. Gmail draft creation and Google Calendar event creation become truly live once the account connection is complete. Without them, FounderReach still writes safe workspace envelopes.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                {
                  id: "gmail",
                  label: "Gmail",
                  detail: status.integrations?.gmail?.connected ? "Connected for live draft creation" : "Required for live email draft creation",
                  badge: status.integrations?.gmail?.connected ? "live" : status.integrations?.providerAvailable ? "needs-account" : "needs-keys",
                },
                {
                  id: "googlecalendar",
                  label: "Google Calendar",
                  detail: status.integrations?.googleCalendar?.connected ? "Connected for live event creation" : "Required for live calendar event creation",
                  badge: status.integrations?.googleCalendar?.connected ? "live" : status.integrations?.providerAvailable ? "needs-account" : "needs-keys",
                },
              ].map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{integration.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{integration.detail}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ExecutionBadge mode={integration.badge} compact />
                    {!status.integrations?.[integration.id === "gmail" ? "gmail" : "googleCalendar"]?.connected && (
                      <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={!status.integrations?.providerAvailable || connectingToolkit === integration.id}
                        style={{
                          borderRadius: 8,
                          border: "none",
                          background: status.integrations?.providerAvailable ? C.text : C.base,
                          color: status.integrations?.providerAvailable ? "#FFFFFF" : C.hint,
                          padding: "8px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {connectingToolkit === integration.id ? "Opening..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                const entry = status.services?.[key] || { configured: false, source: "missing" };
                const connected = Boolean(entry.configured);
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
                        {connected
                          ? entry.source === "browser"
                            ? "Configured from this browser session"
                            : "Configured from the backend project"
                          : "Not configured yet"}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: connected ? "#E6F4EE" : C.base,
                        color: connected ? C.success : C.muted,
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
              background: C.base,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>Agent instructions</div>
            <div style={{ display: "grid", gridTemplateColumns: "132px 1fr", gap: 12 }}>
              <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: 12,
                      border: `1px solid ${selectedAgentId === agent.id ? C.accentM : C.border}`,
                      background: selectedAgentId === agent.id ? C.accentL : C.surface,
                      color: selectedAgentId === agent.id ? C.accent : C.text,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
              <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                  {AGENTS.find((agent) => agent.id === selectedAgentId)?.name}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
                  {AGENTS.find((agent) => agent.id === selectedAgentId)?.role}
                </div>

                <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
                  Process
                </div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65, marginBottom: 10 }}>{selectedGuide.process}</div>

                <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
                  Prompt preview
                </div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65, marginBottom: 10 }}>{selectedGuide.prompt}</div>

                <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
                  How it works
                </div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>{selectedGuide.howItWorks}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#fff3f3",
              border: "1px solid #f6d0d0",
            }}
          >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 8 }}>
              Reset or sign out
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>
              Reset demo restores the seeded FounderReach workspace. Signing out clears this browser session, including local workspace state, onboarding flags, and any personal API keys stored here.
              </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onResetDemo}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Reset demo workspace
              </button>
              <button
                onClick={onSignOut}
                style={{
                  borderRadius: 12,
                  border: "none",
                  background: C.danger,
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Sign out and clear browser session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

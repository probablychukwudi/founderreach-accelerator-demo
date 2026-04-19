import { useEffect, useMemo, useRef, useState } from "react";
import { FounderReachLogo } from "./FounderReachLogo";
import { Icon } from "./Icon";
import { AGENTS, AGENT_BY_ID, C, getAgentGuide, getModeAgents, GROUPS_ORDER, OPERATING_MODES } from "../lib/founderReachCore";

const SIGNAL_STYLES = {
  idle: {
    background: "#1e3a2a",
    boxShadow: "none",
    borderLeft: "2px solid transparent",
  },
  mode: {
    background: "#22c55e",
    boxShadow: "0 0 10px rgba(34,197,94,0.85), 0 0 18px rgba(34,197,94,0.35)",
    borderLeft: "2px solid #22c55e",
  },
  running: {
    background: "#ef4444",
    boxShadow: "0 0 10px rgba(239,68,68,0.85), 0 0 18px rgba(239,68,68,0.35)",
    borderLeft: "2px solid #ef4444",
  },
  pending: {
    background: "#eab308",
    boxShadow: "0 0 10px rgba(234,179,8,0.85), 0 0 18px rgba(234,179,8,0.35)",
    borderLeft: "2px solid #eab308",
  },
  issue: {
    background: "#eab308",
    boxShadow: "0 0 10px rgba(234,179,8,0.85), 0 0 18px rgba(234,179,8,0.35)",
    borderLeft: "2px solid #eab308",
  },
};

const SIGNAL_LABELS = {
  idle: "Idle",
  mode: "Mode active",
  running: "Running now",
  pending: "Pending",
  issue: "Needs attention",
};

const getSignalDotStyle = (signal) => ({
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: SIGNAL_STYLES[signal].background,
  boxShadow: SIGNAL_STYLES[signal].boxShadow,
  flexShrink: 0,
});

export function Shell({
  agentSignals = {},
  demoPlaying,
  mode,
  onOpenSettings,
  onSignOut,
  onStartDemo,
  runningAgents,
  setMode,
  setTab,
  status,
  tab,
  userLabel,
  children,
}) {
  const [inspectedAgentId, setInspectedAgentId] = useState("orchestrator");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const tabs = [
    { id: "chat", label: "Chat" },
    { id: "crm", label: "CRM" },
    { id: "calendar", label: "Calendar" },
    { id: "vault", label: "Vault" },
  ];

  const modeAgents = useMemo(() => new Set(getModeAgents(mode)), [mode]);
  const inspectedAgent = AGENT_BY_ID[inspectedAgentId] || AGENT_BY_ID[getModeAgents(mode)[0]] || AGENT_BY_ID.orchestrator;
  const inspectedGuide = getAgentGuide(inspectedAgent.id);
  const isDemoMode = mode === "Demo Mode";

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const closeIfOutside = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", closeIfOutside);
    return () => document.removeEventListener("mousedown", closeIfOutside);
  }, [userMenuOpen]);

  const getSignalState = (agentId) => {
    if (runningAgents.has(agentId)) return "running";
    if (agentSignals[agentId] === "issue") return "issue";
    if (agentSignals[agentId] === "pending") return "pending";
    if (modeAgents.has(agentId)) return "mode";
    return "idle";
  };

  const inspectedSignal = getSignalState(inspectedAgent.id);
  const avatarLabel = userLabel.startsWith("Personal") ? "PB" : "GS";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.base, overflow: "hidden" }}>
      <div
        style={{
          height: 52,
          width: "100%",
          background: "#ffffff",
          borderBottom: `1px solid ${C.border}`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 18,
          padding: "0 18px",
          flexShrink: 0,
        }}
      >
        <div style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <FounderReachLogo size={26} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>FounderReach</span>
        </div>

        <div style={{ justifySelf: "center", display: "flex", alignItems: "stretch", height: "100%" }}>
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                onClick={() => setTab(item.id)}
                style={{
                  height: "100%",
                  padding: "0 16px",
                  border: "none",
                  borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                  background: "transparent",
                  color: active ? C.text : C.muted,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 10 }}>
          {runningAgents.size > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: C.accentL,
                borderRadius: 999,
                padding: "5px 10px",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.accent,
                  animation: "founderreach-pulse 1.1s infinite",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>
                {runningAgents.size} agent{runningAgents.size > 1 ? "s" : ""} running
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: status.workspaceMode === "local" ? C.base : C.accentL,
              border: `1px solid ${status.workspaceMode === "local" ? C.border : C.accentM}`,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: status.workspaceMode === "local" ? C.muted : C.accent,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: status.workspaceMode === "local" ? C.muted : C.accent }}>
              {status.workspaceMode === "local" ? "Demo-safe" : "Live-ready"}
            </span>
          </div>

          {isDemoMode && (
            <button
              data-tour="demo-play"
              onClick={onStartDemo}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                borderRadius: 999,
                border: demoPlaying ? `1px solid ${C.accentM}` : `1px solid ${C.border}`,
                background: demoPlaying ? C.accentL : C.surface,
                color: demoPlaying ? C.accent : C.text,
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Icon name={demoPlaying ? "pause" : "play"} size={12} color={demoPlaying ? C.accent : C.muted} />
              {demoPlaying ? "Playing demo" : "Play demo"}
            </button>
          )}

          <div
            data-tour="mode-select"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "6px 10px",
              background: C.base,
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDemoMode ? "#f59e0b" : C.accent }} />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 11,
                fontWeight: 700,
                color: C.text,
                outline: "none",
              }}
            >
              {OPERATING_MODES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <Icon name="search" size={16} color={C.muted} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <Icon name="bell" size={16} color={C.muted} />
          </button>
          <button
            data-tour="settings-button"
            onClick={onOpenSettings}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <Icon name="settings" size={16} color={C.muted} />
          </button>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              data-tour="user-menu"
              onClick={() => setUserMenuOpen((current) => !current)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: C.base,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {avatarLabel}
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  right: 0,
                  width: 230,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  boxShadow: "0 18px 50px rgba(9,31,23,0.14)",
                  padding: 10,
                  zIndex: 20,
                }}
              >
                <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{userLabel}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    Sign out clears local data and browser-saved keys for this session.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onStartDemo();
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 12,
                    background: C.base,
                    color: C.text,
                    padding: "9px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Icon name="play" size={12} color={C.muted} />
                  Replay demo walkthrough
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut();
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 12,
                    background: "#fff3f3",
                    color: C.danger,
                    padding: "9px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="close" size={12} color={C.danger} />
                  Sign out and clear session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div
          data-tour="agent-rail"
          style={{
            width: 198,
            background: C.sidebar,
            borderRight: `1px solid ${C.sidebarB}`,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "14px 12px 10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.sidebarL,
                border: `1px solid ${C.sidebarB}`,
                borderRadius: 9,
                padding: "8px 10px",
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
              }}
            >
              <Icon name="search" size={13} color="rgba(255,255,255,0.28)" />
              Search agents
            </div>
          </div>

          <div
            data-tour="agent-inspector"
            style={{
              margin: "0 12px 12px",
              padding: "12px 12px 13px",
              borderRadius: 12,
              border: `1px solid ${C.sidebarB}`,
              background: C.sidebarL,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {inspectedAgent.name}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {inspectedAgent.role}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ ...getSignalDotStyle(inspectedSignal), width: 8, height: 8 }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.72)" }}>{SIGNAL_LABELS[inspectedSignal]}</span>
              </div>
            </div>

            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>
              Process
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.88)", lineHeight: 1.5, marginBottom: 8 }}>
              {inspectedGuide.process}
            </div>

            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>
              Prompt Preview
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)", lineHeight: 1.5, marginBottom: 8 }}>
              {inspectedGuide.prompt}
            </div>

            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>
              How It Works
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
              {inspectedGuide.howItWorks}
            </div>
          </div>

          {GROUPS_ORDER.map((group) => {
            const entries = AGENTS.filter((agent) => agent.group === group);
            if (!entries.length) return null;
            return (
              <div key={group} style={{ marginBottom: 6 }}>
                <div
                  style={{
                    padding: "6px 14px 4px",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.24)",
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                    fontWeight: 700,
                  }}
                >
                  {group}
                </div>
                {entries.map((agent) => {
                  const signal = getSignalState(agent.id);
                  const signalStyle = SIGNAL_STYLES[signal];
                  const highlighted = signal !== "idle";
                  return (
                    <div
                      key={agent.id}
                      onMouseEnter={() => setInspectedAgentId(agent.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        margin: "0 6px 2px",
                        padding: "7px 10px",
                        borderRadius: 8,
                        borderLeft: signalStyle.borderLeft,
                        background: inspectedAgent.id === agent.id ? "rgba(255,255,255,0.06)" : highlighted ? "rgba(255,255,255,0.04)" : "transparent",
                        cursor: "help",
                      }}
                    >
                      <Icon name={agent.icon} size={13} color={highlighted ? agent.color : "rgba(255,255,255,0.45)"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: highlighted ? 700 : 500, color: highlighted ? "#ffffff" : "rgba(255,255,255,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {agent.api.toUpperCase()}
                        </div>
                      </div>
                      <div style={getSignalDotStyle(signal)} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

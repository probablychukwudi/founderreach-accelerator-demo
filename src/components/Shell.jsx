import { useEffect, useRef, useState } from "react";
import { FounderReachLogo } from "./FounderReachLogo";
import { Icon } from "./Icon";
import { C, OPERATING_MODES } from "../lib/founderReachCore";

const NAV_ITEMS = [
  { id: "chat", label: "Inbox", icon: "chat" },
  { id: "crm", label: "Contacts", icon: "users" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "vault", label: "Vault", icon: "folder" },
];

export function Shell({
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isDemoMode = mode === "Demo Mode";
  const avatarLabel = userLabel.startsWith("Personal") ? "PB" : "GS";

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const closeIfOutside = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", closeIfOutside);
    return () => document.removeEventListener("mousedown", closeIfOutside);
  }, [userMenuOpen]);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.base, overflow: "hidden" }}>
      {/* sidebar_left (220) — global navigation */}
      <aside
        data-tour="sidebar-left"
        style={{
          width: 220,
          flexShrink: 0,
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: 56, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
          <FounderReachLogo size={22} />
          <span style={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>FounderReach</span>
        </div>

        <nav style={{ padding: 8, flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                onClick={() => setTab(item.id)}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px",
                  margin: "2px 0",
                  border: "none",
                  borderRadius: 8,
                  background: active ? C.accentL : "transparent",
                  color: active ? C.text : C.muted,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "left",
                }}
              >
                <Icon name={item.icon} size={16} color={active ? C.accent : C.muted} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${C.border}`, padding: 12 }}>
          <div
            data-tour="mode-select"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "0 10px",
              height: 36,
              background: C.surface,
              marginBottom: 8,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: isDemoMode ? C.warn : C.success }} />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                outline: "none",
                flex: 1,
              }}
            >
              {OPERATING_MODES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {isDemoMode && (
            <button
              data-tour="demo-play"
              onClick={onStartDemo}
              style={{
                width: "100%",
                height: 36,
                borderRadius: 8,
                border: demoPlaying ? `1px solid ${C.accentM}` : `1px solid ${C.border}`,
                background: demoPlaying ? C.accentL : C.surface,
                color: demoPlaying ? C.accent : C.text,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Icon name={demoPlaying ? "pause" : "play"} size={12} color={demoPlaying ? C.accent : C.muted} />
              {demoPlaying ? "Playing demo" : "Play demo"}
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 10px",
              height: 32,
              borderRadius: 8,
              background: C.base,
              marginBottom: 8,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.workspaceMode === "local" ? C.muted : C.success }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>
              {status.workspaceMode === "local" ? "Demo-safe" : "Live-ready"}
            </span>
            {runningAgents.size > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: C.accent }}>
                {runningAgents.size} running
              </span>
            )}
          </div>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              data-tour="user-menu"
              onClick={() => setUserMenuOpen((current) => !current)}
              style={{
                width: "100%",
                height: 40,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: C.accentL,
                  color: C.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {avatarLabel}
              </div>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.text, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userLabel.startsWith("Personal") ? "Personal" : "Guest"}
              </span>
              <Icon name="settings" size={14} color={C.muted} />
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: 44,
                  left: 0,
                  right: 0,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  padding: 8,
                  zIndex: 20,
                }}
              >
                <div style={{ padding: "8px 10px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                  {userLabel}
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); onOpenSettings(); }}
                  style={{ width: "100%", border: "none", borderRadius: 8, background: "transparent", color: C.text, padding: "8px 10px", fontSize: 12, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Icon name="settings" size={13} color={C.muted} />
                  Settings & keys
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); onStartDemo(); }}
                  style={{ width: "100%", border: "none", borderRadius: 8, background: "transparent", color: C.text, padding: "8px 10px", fontSize: 12, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Icon name="play" size={13} color={C.muted} />
                  Replay walkthrough
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); onSignOut(); }}
                  style={{ width: "100%", border: "none", borderRadius: 8, background: "transparent", color: C.danger, padding: "8px 10px", fontSize: 12, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Icon name="close" size={13} color={C.danger} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

import { C } from "../lib/founderReachCore";
import { Icon } from "./Icon";

export function WelcomeOverlay({ onDismiss, onStartDemo }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
        background: "rgba(9,31,23,0.52)",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "100%",
          background: C.surface,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          boxShadow: "0 30px 90px rgba(9,31,23,0.22)",
          padding: 28,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: C.accentL,
            border: `1px solid ${C.accentM}`,
            display: "grid",
            placeItems: "center",
            marginBottom: 18,
          }}
        >
          <Icon name="flash" size={18} color={C.accent} />
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.15, marginBottom: 10 }}>
          Welcome to FounderReach
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 18 }}>
          New visitors can step through a guided demo that shows how Creator Mode, the agent rail, CRM, Calendar, Vault, and settings fit together. You can also skip straight into the workspace and explore on your own.
        </div>

        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {[
            "Watch a guided demo with a play-by-play walkthrough",
            "Open settings to add your own API keys in this browser",
            "Hover or inspect agents to understand how each one works",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: C.accent,
                  boxShadow: "0 0 12px rgba(37,133,48,0.35)",
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 13, color: C.text }}>{item}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button
            onClick={onDismiss}
            style={{
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Explore manually
          </button>
          <button
            onClick={onStartDemo}
            style={{
              borderRadius: 14,
              border: "none",
              background: C.text,
              color: "#fff",
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="play" size={13} color="#fff" />
            Start demo walkthrough
          </button>
        </div>
      </div>
    </div>
  );
}

import { C } from "../lib/founderReachCore";

const MODE_STYLES = {
  live: { background: "#E6F4EE", color: C.success, borderColor: "#CBECD8" },
  demo: { background: C.accentL, color: C.accent, borderColor: C.accentM },
  "needs-account": { background: "#FFF7E6", color: C.warn, borderColor: "#FDE4B5" },
  "needs-keys": { background: "#FDECEC", color: C.danger, borderColor: "#F7D2D2" },
};

export function ExecutionBadge({ mode = "demo", label, compact = false }) {
  const style = MODE_STYLES[mode] || MODE_STYLES.demo;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? 20 : 24,
        padding: compact ? "2px 8px" : "4px 10px",
        borderRadius: 999,
        border: `1px solid ${style.borderColor}`,
        background: style.background,
        color: style.color,
        fontSize: compact ? 10 : 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label || mode}
    </span>
  );
}

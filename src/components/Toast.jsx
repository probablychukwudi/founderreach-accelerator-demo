import { C } from "../lib/founderReachCore";

const tones = {
  info: { background: C.text, color: "#fff" },
  success: { background: C.accent, color: "#fff" },
  error: { background: C.danger, color: "#fff" },
};

export function Toast({ message, tone = "info" }) {
  const style = tones[tone] || tones.info;

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 50,
        padding: "12px 14px",
        borderRadius: 12,
        boxShadow: "0 18px 40px rgba(9,31,23,0.18)",
        animation: "founderreach-fade .18s ease",
        ...style,
      }}
    >
      {message}
    </div>
  );
}

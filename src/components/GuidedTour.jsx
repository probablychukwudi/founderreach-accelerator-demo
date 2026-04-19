import { useEffect, useMemo, useState } from "react";
import { C } from "../lib/founderReachCore";
import { Icon } from "./Icon";

function getCardPosition(rect, placement = "bottom") {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 360,
    };
  }

  const gap = 18;
  const width = 340;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (placement === "right") {
    const left = Math.min(rect.right + gap, viewportWidth - width - 24);
    const top = Math.max(24, Math.min(rect.top, viewportHeight - 220));
    return { top, left, width };
  }

  if (placement === "left") {
    const left = Math.max(24, rect.left - width - gap);
    const top = Math.max(24, Math.min(rect.top, viewportHeight - 220));
    return { top, left, width };
  }

  if (placement === "top") {
    const left = Math.max(24, Math.min(rect.left, viewportWidth - width - 24));
    const top = Math.max(24, rect.top - 190);
    return { top, left, width };
  }

  const left = Math.max(24, Math.min(rect.left, viewportWidth - width - 24));
  const top = Math.min(rect.bottom + gap, viewportHeight - 220);
  return { top, left, width };
}

export function GuidedTour({ open, step, stepIndex, total, playing, onBack, onClose, onNext, onTogglePlaying }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open || !step?.selector) {
      setRect(null);
      return undefined;
    }

    const updateRect = () => {
      const node = document.querySelector(step.selector);
      if (!node) {
        setRect(null);
        return;
      }
      const next = node.getBoundingClientRect();
      setRect({
        top: next.top - 8,
        left: next.left - 8,
        right: next.right + 8,
        bottom: next.bottom + 8,
        width: next.width + 16,
        height: next.height + 16,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, step]);

  const cardPosition = useMemo(() => getCardPosition(rect, step?.placement), [rect, step]);

  if (!open || !step) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(9,31,23,0.52)",
        }}
      />

      {rect && (
        <div
          style={{
            position: "absolute",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 18,
            border: `2px solid ${C.accent}`,
            boxShadow: "0 0 0 9999px rgba(9,31,23,0.38), 0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(37,133,48,0.45)",
            transition: "all .28s ease",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          ...cardPosition,
          pointerEvents: "auto",
          background: C.surface,
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          boxShadow: "0 22px 70px rgba(9,31,23,0.24)",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
              Demo walkthrough
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{step.title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: `1px solid ${C.border}`,
              background: C.surface,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon name="close" size={14} color={C.muted} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 10 }}>{step.description}</div>
        {step.hint && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>{step.hint}</div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: total }).map((_, index) => (
              <div
                key={`tour-dot-${index}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: index === stepIndex ? C.accent : C.border,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onTogglePlaying}
              style={{
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                padding: "7px 10px",
                fontSize: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name={playing ? "pause" : "play"} size={12} color={C.muted} />
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={onBack}
              disabled={stepIndex === 0}
              style={{
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: stepIndex === 0 ? C.hint : C.text,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Back
            </button>
            <button
              onClick={onNext}
              style={{
                borderRadius: 12,
                border: "none",
                background: C.text,
                color: "#fff",
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {stepIndex === total - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

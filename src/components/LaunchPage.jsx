import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { C } from "../lib/founderReachCore";
import { submitLead } from "../services/api";
import { ExecutionBadge } from "./ExecutionBadge";
import { FounderReachLogo } from "./FounderReachLogo";
import { Icon } from "./Icon";

const LIVE_NOW = [
  "TinyFish-backed research and browser task execution when keys are configured",
  "Founder workspace with runs, CRM, calendar, vault, and GTM-ready desktop shell",
  "Google Gmail draft creation and Google Calendar event creation once accounts are connected",
];

const DEMO_SAFE = [
  "Cross-platform publishing remains staged inside FounderReach",
  "Email, meeting, and publish flows always return a workspace envelope even when live execution is unavailable",
  "Demo Mode resets the entire workspace into a pristine judge-safe walkthrough",
];

const SPRINT_NEXT = [
  "Real publish automations for X, LinkedIn, and newsletter tooling",
  "Persistent cloud workspaces, auth, and multi-user runs",
  "Deeper observability, lead routing, and outbound reporting",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  company: "",
  role: "",
  useCase: "",
  preferredTime: "",
  website: "",
};

const INPUT_STYLE = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: C.text,
  fontSize: 13,
  lineHeight: 1.5,
  padding: "12px 0",
  fontFamily: "inherit",
};

export function LaunchPage({ onOpenApp, notify }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [responseState, setResponseState] = useState(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    track("Landing Page Viewed", { page: "launch" });
  }, []);

  useEffect(() => {
    if (!requestFormOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setRequestFormOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => {
      modalRef.current?.querySelector("input, textarea")?.focus();
    }, 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [requestFormOpen]);

  const proofCards = useMemo(
    () => [
      {
        title: "One prompt, four systems",
        body: "FounderReach routes one founder request into runs, CRM updates, calendar holds, and reusable vault artifacts instead of leaving momentum trapped in chat.",
        icon: "flash",
      },
      {
        title: "TinyFish at the core",
        body: "Research and browser task execution stay anchored in TinyFish so the live story is real work against messy websites, not UI theater.",
        icon: "browser",
      },
      {
        title: "Mixed live + demo on purpose",
        body: "Every action is labeled Live, Demo-safe, Needs keys, or Needs account connection so judges and early customers can trust what they are seeing.",
        icon: "shield",
      },
    ],
    []
  );

  function openForm() {
    track("Book Demo Clicked", { page: "launch" });
    setRequestFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await submitLead({
        ...form,
        source: "launch-page",
        intent: "book-demo",
      });

      setResponseState(result);
      setForm(INITIAL_FORM);
      notify?.(result.message, result.mode === "live" ? "success" : "info");
      track("Lead Submitted", {
        mode: result.mode || "demo",
        source: "launch-page",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send demo request.";
      notify?.(message, "error");
      setResponseState({ ok: false, message, mode: "demo" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.base, color: C.text }}>
      <div
        style={{
          background:
            "radial-gradient(circle at top left, rgba(37,99,255,0.16), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #F8F9FB 48%, #F3F4F6 100%)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FounderReachLogo size={28} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>FounderReach</div>
                <div style={{ fontSize: 12, color: C.muted }}>Founder GTM OS</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={openForm}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  padding: "0 16px",
                  background: C.text,
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Book Demo
              </button>
              <button
                onClick={() => {
                  track("Open App Clicked", { page: "launch" });
                  onOpenApp();
                }}
                style={{
                  height: 40,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  padding: "0 16px",
                  background: C.surface,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Open App
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 0.85fr)", gap: 28, alignItems: "stretch" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <ExecutionBadge mode="live" label="Founder GTM OS" />
                <ExecutionBadge mode="demo" label="Mixed live + demo" />
              </div>
              <h1 style={{ fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1.02, margin: 0, letterSpacing: "-0.04em" }}>
                Founders turn one prompt into outreach, CRM, calendar, and content momentum.
              </h1>
              <p style={{ margin: "20px 0 0", maxWidth: 760, fontSize: 18, lineHeight: 1.7, color: C.muted }}>
                FounderReach is the execution layer for founder-led GTM. TinyFish handles the live research and browser workflows, while FounderReach routes the work across runs, contacts, calendar, and reusable assets in one operating system.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <button
                  onClick={openForm}
                  style={{
                    height: 48,
                    borderRadius: 8,
                    border: "none",
                    padding: "0 18px",
                    background: C.accent,
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="calendar" size={15} color="#FFFFFF" />
                  Book Demo
                </button>
                <button
                  onClick={() => {
                    track("Open App Clicked", { page: "hero" });
                    onOpenApp();
                  }}
                  style={{
                    height: 48,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    padding: "0 18px",
                    background: C.surface,
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="arrowR" size={15} color={C.muted} />
                  Open App
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 36 }}>
                {[
                  { label: "Execution surfaces", value: "4", note: "Runs, CRM, Calendar, Vault" },
                  { label: "Primary live wedge", value: "TinyFish", note: "Research + browser tasks" },
                  { label: "Judge-safe mode", value: "Yes", note: "Deterministic demo reset" },
                ].map((item) => (
                  <div key={item.label} style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, padding: 16 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>{item.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, marginTop: 4 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: 18, border: `1px solid ${C.border}`, background: C.surface, padding: 22, boxShadow: "0 22px 70px rgba(24,28,35,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Why this needs to exist now</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Founders are already running a startup and a media company at once.</div>
                </div>
                <ExecutionBadge mode="live" label="Judge narrative" compact />
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {proofCards.map((card) => (
                  <div key={card.title} style={{ borderRadius: 12, background: "#F8F9FB", border: `1px solid ${C.border}`, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentL, display: "grid", placeItems: "center" }}>
                        <Icon name={card.icon} size={14} color={C.accent} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{card.title}</div>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>{card.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18, marginBottom: 28 }}>
          {[
            { title: "Live now", mode: "live", items: LIVE_NOW },
            { title: "Demo-safe today", mode: "demo", items: DEMO_SAFE },
            { title: "Coming in sprint", mode: "needs-account", items: SPRINT_NEXT },
          ].map((section) => (
            <div key={section.title} style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{section.title}</div>
                <ExecutionBadge mode={section.mode} compact />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {section.items.map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: C.muted }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(360px, 1.1fr)", gap: 24, alignItems: "start" }}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: C.accent, marginBottom: 10 }}>
              Book Demo
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 12 }}>
              Tell FounderReach what you need to ship today.
            </div>
            <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 18 }}>
              This is a request form, not an auto-scheduler. FounderReach captures your GTM context first so the next step can be tailored instead of generic.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Founder GTM operating system walkthrough",
                "Judge-safe product demo with live vs demo-safe truth states",
                "TinyFish-first architecture story for accelerator review",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Icon name="check" size={14} color={C.success} />
                  <div style={{ fontSize: 13, color: C.text }}>{item}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ borderRadius: 18, border: `1px solid ${C.border}`, background: C.surface, padding: 22, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Name">
                <input style={INPUT_STYLE} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Email">
                <input style={INPUT_STYLE} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Company">
                <input style={INPUT_STYLE} value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
              </Field>
              <Field label="Role">
                <input style={INPUT_STYLE} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
              </Field>
            </div>
            <Field label="Use case">
              <textarea
                style={{ ...INPUT_STYLE, resize: "vertical", minHeight: 96 }}
                rows={4}
                value={form.useCase}
                onChange={(event) => setForm((current) => ({ ...current, useCase: event.target.value }))}
                required
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Preferred time">
                <input style={INPUT_STYLE} value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))} placeholder="Today after 3 PM CT" />
              </Field>
              <Field label="Website">
                <input style={INPUT_STYLE} value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="https://..." />
              </Field>
            </div>

            {responseState?.message && (
              <div
                style={{
                  borderRadius: 10,
                  border: `1px solid ${responseState.ok ? C.accentM : "#F7D2D2"}`,
                  background: responseState.ok ? C.accentL : "#FDECEC",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <ExecutionBadge mode={responseState.mode || "demo"} compact />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                    {responseState.ok ? "Request captured" : "Submission issue"}
                  </span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{responseState.message}</div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, maxWidth: 360 }}>
                FounderReach stores your request as a demo-intake lead and keeps execution mode honest.
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: "none",
                  padding: "0 16px",
                  background: submitting ? C.base : C.text,
                  color: submitting ? C.hint : "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {submitting ? "Submitting..." : "Request Demo"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {requestFormOpen && (
        <div
          onClick={() => setRequestFormOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(24,28,35,0.44)",
            padding: 24,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            ref={modalRef}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(960px, 100%)",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              borderRadius: 22,
              border: `1px solid ${C.border}`,
              background: C.surface,
              boxShadow: "0 30px 90px rgba(24,28,35,0.18)",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: C.accent, marginBottom: 8 }}>
                  Book Demo
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 8 }}>
                  Request a FounderReach walkthrough
                </div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 560 }}>
                  This opens the request flow directly, so the page no longer jumps down the landing screen. FounderReach captures your context first, then routes the intake honestly.
                </div>
              </div>
              <button
                onClick={() => setRequestFormOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="close" size={16} color={C.muted} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(360px, 1.1fr)", gap: 24, alignItems: "start" }}>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.8, marginBottom: 18 }}>
                  FounderReach captures your GTM context before the next step, so the follow-up can be tailored instead of generic.
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    "Founder GTM operating system walkthrough",
                    "Judge-safe product demo with live vs demo-safe truth states",
                    "TinyFish-first architecture story for accelerator review",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Icon name="check" size={14} color={C.success} />
                      <div style={{ fontSize: 13, color: C.text }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ borderRadius: 18, border: `1px solid ${C.border}`, background: C.surface, padding: 22, display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Name">
                    <input style={INPUT_STYLE} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                  </Field>
                  <Field label="Email">
                    <input style={INPUT_STYLE} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Company">
                    <input style={INPUT_STYLE} value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
                  </Field>
                  <Field label="Role">
                    <input style={INPUT_STYLE} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Use case">
                  <textarea
                    style={{ ...INPUT_STYLE, resize: "vertical", minHeight: 96 }}
                    rows={4}
                    value={form.useCase}
                    onChange={(event) => setForm((current) => ({ ...current, useCase: event.target.value }))}
                    required
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Preferred time">
                    <input style={INPUT_STYLE} value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))} placeholder="Today after 3 PM CT" />
                  </Field>
                  <Field label="Website">
                    <input style={INPUT_STYLE} value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="https://..." />
                  </Field>
                </div>

                {responseState?.message && (
                  <div
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${responseState.ok ? C.accentM : "#F7D2D2"}`,
                      background: responseState.ok ? C.accentL : "#FDECEC",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <ExecutionBadge mode={responseState.mode || "demo"} compact />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                        {responseState.ok ? "Request captured" : "Submission issue"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{responseState.message}</div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55, maxWidth: 360 }}>
                    FounderReach stores your request as a demo-intake lead and keeps execution mode honest.
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: "none",
                      padding: "0 16px",
                      background: submitting ? C.base : C.text,
                      color: submitting ? C.hint : "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {submitting ? "Submitting..." : "Request Demo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{label}</span>
      <div
        style={{
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          background: C.surface,
          padding: "0 12px",
        }}
      >
        {children}
      </div>
    </label>
  );
}

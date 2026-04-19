import { useEffect, useMemo, useState } from "react";
import { C } from "../lib/founderReachCore";
import { Icon } from "../components/Icon";

const stageStyle = {
  "Meeting Booked": { background: C.accentL, color: C.accent },
  Active: { background: "#E6F4EE", color: "#0F6E56" },
  Replied: { background: C.accentL, color: C.accent },
  Contacted: { background: C.base, color: C.muted },
  "Intro Sent": { background: C.base, color: C.muted },
  Researching: { background: C.base, color: C.hint },
  "Follow-up Due": { background: "#FDECEC", color: C.danger },
};

function StageTag({ stage }) {
  const style = stageStyle[stage] || { background: C.base, color: C.hint };
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 600, ...style }}>{stage}</span>;
}

export function CRMTab({ contacts, onSendEmail, onBookMeeting }) {
  const [selectedId, setSelectedId] = useState(contacts[0]?.id || null);
  const [filter, setFilter] = useState("All");
  const selected = contacts.find((contact) => contact.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId && contacts.length) setSelectedId(contacts[0].id);
  }, [contacts, selectedId]);

  const filterOptions = useMemo(() => ["All", ...new Set(contacts.map((contact) => contact.type))], [contacts]);
  const filtered = filter === "All" ? contacts : contacts.filter((contact) => contact.type === filter);

  return (
    <div data-tour="crm-root" style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
      <div style={{ width: 300, borderRight: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[{ label: "Total", value: contacts.length }, { label: "Investors", value: contacts.filter((item) => item.type === "Investor").length }, { label: "Research", value: contacts.filter((item) => item.type === "Research").length }, { label: "Prospects", value: contacts.filter((item) => item.type === "Prospect").length }].map((item) => (
              <div key={item.label} style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 11px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{item.value}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filterOptions.map((option) => {
              const active = option === filter;
              return (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${active ? C.accent : C.border}`,
                    background: active ? C.accentL : C.surface,
                    color: active ? C.accent : C.muted,
                    padding: "6px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((contact) => {
            const active = selectedId === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: active ? C.accentL : C.surface,
                  borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                  borderBottom: `1px solid ${C.border}`,
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{contact.name}</span>
                  <span style={{ fontSize: 10, color: C.hint }}>{contact.lastContact}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 7 }}>{contact.role} · {contact.company}</div>
                <StageTag stage={contact.stage} />
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <>
          <div style={{ flex: 1, minWidth: 0, background: C.surface, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "22px 24px 12px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{selected.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{selected.role} · {selected.company}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onSendEmail(selected)}
                    style={{ borderRadius: 8, border: "none", background: C.text, color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="mail" size={13} color="#fff" />
                    Email
                  </button>
                  <button
                    onClick={() => onBookMeeting(selected)}
                    style={{ borderRadius: 8, border: `1px solid ${C.accentM}`, background: C.accentL, color: C.accent, padding: "10px 14px", fontSize: 12, fontWeight: 700 }}
                  >
                    Book call
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: 24, overflowY: "auto", display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                {[{ label: "Type", value: selected.type }, { label: "Stage", value: <StageTag stage={selected.stage} />, element: true }, { label: "Track", value: selected.track }, { label: "Assigned", value: selected.agent }].map((item) => (
                  <div key={item.label} style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{item.label}</div>
                    {item.element ? item.value : <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value}</div>}
                  </div>
                ))}
              </div>
              <div style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Notes</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{selected.notes}</div>
              </div>
            </div>
          </div>

          <div style={{ width: 270, borderLeft: `1px solid ${C.border}`, background: C.surface, padding: 20, flexShrink: 0 }}>
            <div style={{ background: C.accentL, border: `1px solid ${C.accentM}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>Next action</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.6, marginBottom: 6 }}>
                {selected.stage === "Meeting Booked" ? `Prepare briefing and confirm the meeting with ${selected.name}.` : `Send a high-context intro email to ${selected.name}.`}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>Recommended by the {selected.agent} agent.</div>
            </div>
            {selected.lastEmail && (
              <div style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 4 }}>Last email sent</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.5, marginBottom: 2 }}>{selected.lastEmail.subject}</div>
                <div style={{ fontSize: 10, color: C.muted }}>Stored in Vault · Promo section</div>
              </div>
            )}
            {selected.nextMeeting && (
              <div style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.hint, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 4 }}>Next meeting</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.5, marginBottom: 2 }}>{selected.nextMeeting.title}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{new Date(selected.nextMeeting.startsAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
              </div>
            )}
            <button
              onClick={() => onSendEmail(selected)}
              style={{ width: "100%", borderRadius: 8, border: "none", background: C.text, color: "#fff", padding: "11px 14px", fontSize: 12, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="mail" size={13} color="#fff" />
              Send email
            </button>
            <button
              onClick={() => onBookMeeting(selected)}
              style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: "11px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="calendar" size={13} color={C.muted} />
              Book meeting
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "grid", placeItems: "center", background: C.surface }}>
          <div style={{ textAlign: "center", color: C.hint }}>
            <Icon name="users" size={28} color={C.border} />
            <div style={{ marginTop: 12, fontSize: 13 }}>Run agents in Chat to populate your CRM.</div>
          </div>
        </div>
      )}
    </div>
  );
}

import { C } from "../lib/founderReachCore";
import { Icon } from "../components/Icon";

export function CalendarTab({ events }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dates = [14, 15, 16, 17, 18];
  const times = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
  const staticEvents = [
    { day: 0, slot: 1, title: "Investor intro call", bg: "#091F17", color: "#fff" },
    { day: 1, slot: 3, title: "Research partner sync", bg: C.accentL, color: C.accent },
    { day: 2, slot: 5, title: "YouTube script polish", bg: "#dc2626", color: "#fff" },
    { day: 3, slot: 6, title: "Newsletter send", bg: "#6d28d9", color: "#fff" },
    { day: 4, slot: 2, title: "Thread batch", bg: C.accent, color: "#fff" },
  ];
  const allEvents = [...staticEvents, ...events];

  return (
    <div data-tour="calendar-root" style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
      <div style={{ width: 230, borderRight: `1px solid ${C.border}`, background: C.surface, padding: 16, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <button style={{ border: "none", background: "none", color: C.muted, padding: 0 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>April 2026</span>
            <button style={{ border: "none", background: "none", color: C.muted, padding: 0 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div key={`mini-day-${index}`} style={{ fontSize: 9, color: C.hint, fontWeight: 700, padding: "2px 0" }}>{day}</div>)}
            {[30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3].map((date, index) => {
              const active = date === 18 && index >= 14 && index <= 20;
              return (
                <div
                  key={`${date}-${index}`}
                  style={{
                    fontSize: 10,
                    padding: "5px 0",
                    borderRadius: "50%",
                    color: active ? "#fff" : index < 2 || index > 34 ? C.hint : C.text,
                    background: active ? C.accent : "transparent",
                  }}
                >
                  {date}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>Content types</div>
        {[{ label: "Investor / VC", color: "#091F17" }, { label: "YouTube", color: "#dc2626" }, { label: "Newsletter", color: "#6d28d9" }, { label: "Tweet thread", color: C.accent }, { label: "Podcast", color: "#7c3aed" }, { label: "Agent actions", color: C.accentM }].map((entry) => (
          <div key={entry.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: entry.color }} />
            <span style={{ fontSize: 12, color: C.text }}>{entry.label}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, border: `1px solid ${C.accentM}`, background: C.accentL }}>
          <div style={{ fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 4 }}>This week</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{allEvents.length}</div>
          <div style={{ fontSize: 12, color: C.muted }}>scheduled items</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: C.surface }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }}><Icon name="chevL" size={12} color={C.muted} /></button>
          <button style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface }}><Icon name="chevR" size={12} color={C.muted} /></button>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.text, flex: 1 }}>Apr 14 - Apr 18, 2026</span>
          <button style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: C.muted }}>Today</button>
          <button style={{ borderRadius: 10, border: `1px solid ${C.text}`, background: C.text, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Week</button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(5, minmax(160px, 1fr))", borderBottom: `1px solid ${C.border}` }}>
            <div />
            {days.map((day, index) => (
              <div key={`header-${day}-${index}`} style={{ padding: "10px 6px", textAlign: "center", borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted }}>{day}</div>
                <div style={{ width: 30, height: 30, borderRadius: "50%", margin: "6px auto 0", display: "grid", placeItems: "center", fontSize: 16, fontWeight: 800, color: index === 4 ? C.accent : C.text, background: index === 4 ? C.accentL : "transparent" }}>{dates[index]}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(5, minmax(160px, 1fr))" }}>
            <div>
              {times.map((time) => <div key={time} style={{ height: 58, borderBottom: `1px solid ${C.border}`, paddingRight: 8, paddingTop: 4, textAlign: "right" }}><span style={{ fontSize: 10, color: C.hint }}>{time}</span></div>)}
            </div>
            {days.map((day, dayIndex) => (
              <div key={`column-${day}-${dayIndex}`} style={{ borderLeft: `1px solid ${C.border}`, position: "relative" }}>
                {times.map((time) => <div key={`${day}-${time}`} style={{ height: 58, borderBottom: `1px solid ${C.border}` }} />)}
                {allEvents.filter((event) => event.day === dayIndex).map((event) => (
                  <div key={event.id || `${event.title}-${event.slot}`} style={{ position: "absolute", left: 6, right: 6, top: event.slot * 58 + 5, minHeight: 48, borderRadius: 12, padding: "6px 9px", background: event.bg, border: `1px solid ${event.bg}`, color: event.color, boxShadow: "0 8px 18px rgba(9,31,23,0.08)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.4 }}>{event.title}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

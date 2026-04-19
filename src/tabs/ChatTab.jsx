import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { AGENT_BY_ID, AGENTS, C, getModeAgents, SUGGESTIONS } from "../lib/founderReachCore";
import { deriveWorkspaceUpdates, makeId } from "../lib/workspace";
import { orchestrate, streamAgentExecution } from "../services/api";
import { Icon } from "../components/Icon";

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: C.accentM,
            animation: `founderreach-bounce 1.2s ease ${index * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SystemMessage({ text }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 12 }}>
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 11,
          border: `1px solid ${C.accentM}`,
          background: C.accentL,
          color: C.accent,
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function FounderMessage({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
      <div style={{ maxWidth: 560 }}>
        <div style={{ fontSize: 12, color: C.hint, textAlign: "right", marginBottom: 4 }}>You</div>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: C.accent,
            color: "#FFFFFF",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ message }) {
  const agent = AGENT_BY_ID[message.agentId] || {
    name: message.agentId,
    role: "Specialist",
    color: C.accent,
    icon: "flash",
  };
  const [showBrowser, setShowBrowser] = useState(false);
  const [showJson, setShowJson] = useState(false);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, animation: "founderreach-fade .2s ease" }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: `${agent.color}16`,
          border: `1px solid ${agent.color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 3,
        }}
      >
        <Icon name={agent.icon} size={15} color={agent.color} strokeWidth={1.8} />
      </div>
      <div style={{ maxWidth: 700, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: agent.color }}>{agent.name}</span>
          <span style={{ fontSize: 11, color: C.hint }}>{agent.role}</span>
          {message.api && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                padding: "2px 6px",
                borderRadius: 4,
                background: C.base,
                color: C.muted,
                border: `1px solid ${C.border}`,
              }}
            >
              {message.api.toUpperCase()}
            </span>
          )}
        </div>
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.incomingBubble || "#F3F4F6",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.55,
            color: C.text,
          }}
        >
          {message.isTyping && !message.lines?.length ? (
            <TypingDots />
          ) : (
            <>
              {(message.lines || []).map((line, index) => (
                <p key={`${message.id}-line-${index}`} style={{ margin: "0 0 6px" }}>
                  {line}
                </p>
              ))}
              {message.progress && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: C.accent,
                    background: C.accentL,
                    border: `1px solid ${C.accentM}`,
                    borderRadius: 999,
                    padding: "6px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.accent,
                      animation: "founderreach-pulse 1s infinite",
                    }}
                  />
                  {message.progress}
                </div>
              )}
              {message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Generated asset"
                  style={{ marginTop: 12, borderRadius: 12, border: `1px solid ${C.border}` }}
                />
              )}
              {message.videoUrl && (
                <video controls style={{ width: "100%", marginTop: 12, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <source src={message.videoUrl} />
                </video>
              )}
              {message.streamUrl && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => setShowBrowser((current) => !current)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      border: `1px solid ${C.accentM}`,
                      background: C.accentL,
                      color: C.accent,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="browser" size={12} color={C.accent} />
                    {showBrowser ? "Hide live browser" : "View live browser"}
                  </button>
                  {showBrowser && (
                    <iframe
                      title={`${agent.name} live browser`}
                      src={message.streamUrl}
                      style={{ width: "100%", height: 300, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 10 }}
                    />
                  )}
                </div>
              )}
              {message.result && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => setShowJson((current) => !current)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      border: `1px solid ${C.border}`,
                      background: C.base,
                      color: C.muted,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="chevD" size={12} color={C.muted} />
                    {showJson ? "Hide output JSON" : "View output JSON"}
                  </button>
                  {showJson && (
                    <pre
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 12,
                        background: "#F8F9FB",
                        border: `1px solid ${C.border}`,
                        fontSize: 11,
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: 240,
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(message.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const CHAT_DESKTOP_COLUMNS = "minmax(280px, 320px) minmax(440px, 1fr) minmax(240px, 280px)";

export function ChatTab({
  agentSignals = {},
  demoPrompt,
  demoRunId,
  mode,
  onOpenVault,
  onWorkspaceUpdates,
  notify,
  runningAgents,
  setAgentSignals,
  setRunningAgents,
  status,
}) {
  const [messages, setMessages] = useState([
    {
      id: "system-online",
      type: "system",
      text: "FounderReach is live in desktop review mode. All 24 agents, CRM, Vault, Calendar, and demo-safe automations are ready.",
    },
    {
      id: "intro-agent",
      type: "agent",
      agentId: "orchestrator",
      api: "search",
      isTyping: false,
      lines: [
        "Welcome to FounderReach. This is your founder-and-creator operating system with strategy, research, outreach, publishing, and media agents working from one workspace.",
        "Use the suggestions below, switch into Demo Mode, or describe what you want to build, raise, publish, or automate.",
      ],
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [listFilter, setListFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllAgents, setShowAllAgents] = useState(false);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const handledDemoRunIdRef = useRef(0);

  const isDemoMode = mode === "Demo Mode";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const missingCapabilities = useMemo(() => {
    const missing = [];
    if (!status.services?.anthropic?.configured) missing.push("Anthropic");
    if (!status.services?.tinyfish?.configured) missing.push("TinyFish");
    if (!status.services?.composio?.configured) missing.push("Composio");
    return missing;
  }, [status.services]);

  const pushMessage = useCallback((next) => {
    setMessages((current) => [...current, next]);
  }, []);

  const updateMessage = useCallback((id, patch) => {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...patch } : message)));
  }, []);

  const executePlan = useCallback(
    async (plan, { demoMode = false } = {}) => {
      pushMessage({
        id: makeId("system"),
        type: "system",
        text: `Routing to ${plan.agents.length} agents across ${[...new Set(plan.agents.map((entry) => entry.api.toUpperCase()))].join(", ")}.`,
      });

      setRunningAgents([]);
      setAgentSignals(Object.fromEntries(plan.agents.map((entry) => [entry.agent, "pending"])));

      const placeholders = {};
      plan.agents.forEach((entry) => {
        const id = makeId(entry.agent);
        placeholders[entry.agent] = id;
        pushMessage({
          id,
          type: "agent",
          agentId: entry.agent,
          api: entry.api,
          isTyping: true,
          lines: [entry.message],
          progress: demoMode ? "Queued for guided demo" : "Queued",
        });
      });

      const runEntry = async (entry) => {
        const placeholderId = placeholders[entry.agent];
        const resultEnvelope = {};

        await streamAgentExecution({
          agentId: entry.agent,
          planMessage: entry.message,
          context: plan.context,
          demoMode,
          onEvent: ({ event, data }) => {
            if (event === "started") {
              setRunningAgents((current) => (current.includes(entry.agent) ? current : [...current, entry.agent]));
              setAgentSignals((current) => {
                const next = { ...current };
                delete next[entry.agent];
                return next;
              });
              updateMessage(placeholderId, { progress: data.text || "Started" });
            }
            if (event === "progress") {
              setRunningAgents((current) => (current.includes(entry.agent) ? current : [...current, entry.agent]));
              setAgentSignals((current) => {
                const next = { ...current };
                delete next[entry.agent];
                return next;
              });
              updateMessage(placeholderId, { progress: data.text });
            }
            if (event === "final") {
              resultEnvelope.result = data.result;
              resultEnvelope.streamUrl = data.streamUrl;
              resultEnvelope.imageUrl = data.imageUrl;
              resultEnvelope.videoUrl = data.videoUrl;
              setRunningAgents((current) => current.filter((agentId) => agentId !== entry.agent));
              setAgentSignals((current) => {
                const next = { ...current };
                if (data.result?.error) next[entry.agent] = "issue";
                else delete next[entry.agent];
                return next;
              });
              updateMessage(placeholderId, {
                isTyping: false,
                progress: data.summary || "Complete",
                result: data.result,
                streamUrl: data.streamUrl,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
              });
            }
          },
        });

        onWorkspaceUpdates(deriveWorkspaceUpdates(entry.agent, resultEnvelope.result));
      };

      if (demoMode) {
        for (const entry of plan.agents) {
          await runEntry(entry);
          await sleep(520);
        }
      } else {
        await Promise.all(plan.agents.map((entry) => runEntry(entry)));
      }

      pushMessage({
        id: makeId("system-complete"),
        type: "system",
        text: demoMode
          ? "Demo run complete. FounderReach updated CRM, Calendar, and Vault with fabricated but realistic outputs."
          : "All requested agents finished. New outputs have been added to CRM, Vault, and Calendar.",
      });
      setHistory((current) => [...current, ...plan.agents.map((entry) => ({ role: "assistant", agentId: entry.agent, content: entry.message }))]);
    },
    [onWorkspaceUpdates, pushMessage, setAgentSignals, setRunningAgents, updateMessage]
  );

  const runPromptWithText = useCallback(
    async (rawPrompt) => {
      const prompt = rawPrompt.trim();
      if (!prompt || busy) return;

      setBusy(true);
      setInput("");
      pushMessage({ id: makeId("user"), type: "founder", text: prompt });

      const runId = makeId("run");
      setRuns((current) => [
        {
          id: runId,
          title: prompt.slice(0, 80),
          preview: prompt,
          timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          agents: [],
          status: "running",
          unread: false,
        },
        ...current,
      ]);
      setSelectedRunId(runId);

      let plan;
      try {
        plan = await orchestrate(prompt, history, { demoMode: isDemoMode });
      } catch (error) {
        setBusy(false);
        notify(error.message, "error");
        setRuns((current) => current.map((run) => (run.id === runId ? { ...run, status: "error" } : run)));
        return;
      }

      setRuns((current) =>
        current.map((run) =>
          run.id === runId
            ? { ...run, agents: (plan?.agents || []).map((entry) => entry.agent) }
            : run
        )
      );

      setHistory((current) => [...current, { role: "user", content: prompt }]);

      try {
        await executePlan(plan, { demoMode: isDemoMode });
        setRuns((current) => current.map((run) => (run.id === runId ? { ...run, status: "complete" } : run)));
        if (!isDemoMode && (status.services?.tinyfish?.configured || status.integrations?.gmail?.connected || status.integrations?.googleCalendar?.connected)) {
          track("Successful Live Run", {
            agents: plan?.agents?.length || 0,
            mode,
          });
        }
      } catch (error) {
        setAgentSignals((current) => {
          const next = { ...current };
          plan?.agents?.forEach(({ agent }) => {
            next[agent] = "issue";
          });
          return next;
        });
        setRuns((current) => current.map((run) => (run.id === runId ? { ...run, status: "issue" } : run)));
        notify(error.message, "error");
        pushMessage({
          id: makeId("guardrail-error"),
          type: "agent",
          agentId: "guardrail",
          isTyping: false,
          api: "fetch",
          lines: [`One or more agent runs failed: ${error.message}`],
        });
      } finally {
        setRunningAgents([]);
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, executePlan, history, isDemoMode, mode, notify, pushMessage, setAgentSignals, setRunningAgents, status.integrations, status.services]
  );

  useEffect(() => {
    if (!demoRunId) return;
    if (!isDemoMode) return;
    if (handledDemoRunIdRef.current === demoRunId) return;

    handledDemoRunIdRef.current = demoRunId;
    runPromptWithText(demoPrompt);
  }, [demoPrompt, demoRunId, isDemoMode, runPromptWithText]);

  useEffect(() => {
    setShowAllAgents(false);
  }, [selectedRunId, mode]);

  // --- Derived data for right sidebar (run context) ---
  const activeRun = useMemo(() => runs.find((run) => run.id === selectedRunId), [runs, selectedRunId]);
  const modeAgentIds = useMemo(() => new Set(getModeAgents(mode)), [mode]);
  const contextAgents = useMemo(() => {
    if (activeRun?.agents?.length) return activeRun.agents;
    return getModeAgents(mode);
  }, [activeRun, mode]);
  const visibleAgents = useMemo(
    () => (showAllAgents ? contextAgents : contextAgents.slice(0, 8)),
    [contextAgents, showAllAgents]
  );

  const runArtifacts = useMemo(
    () =>
      messages
        .filter((message) => message.type === "agent" && message.result)
        .slice(-6)
        .map((message) => ({
          id: message.id,
          agent: AGENT_BY_ID[message.agentId]?.name || message.agentId,
          title: message.progress || "Complete",
          api: message.api,
          imageUrl: message.imageUrl,
        }))
        .reverse(),
    [messages]
  );

  const getAgentSignal = (agentId) => {
    if (runningAgents.has?.(agentId)) return "running";
    if (agentSignals[agentId] === "issue") return "issue";
    if (agentSignals[agentId] === "pending") return "pending";
    if (modeAgentIds.has(agentId)) return "mode";
    return "idle";
  };

  const filteredRuns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return runs.filter((run) => {
      if (listFilter === "Unread" && !run.unread) return false;
      if (listFilter === "Running" && run.status !== "running") return false;
      if (query && !run.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [runs, listFilter, searchQuery]);

  const runCounts = useMemo(
    () => ({
      All: runs.length,
      Unread: runs.filter((run) => run.unread).length,
      Running: runs.filter((run) => run.status === "running").length,
    }),
    [runs]
  );

  const signalColor = (signal) => {
    if (signal === "running") return C.danger;
    if (signal === "issue") return C.warn;
    if (signal === "pending") return C.warn;
    if (signal === "mode") return C.success;
    return C.hint;
  };

  return (
    <div
      data-tour="chat-root"
      style={{
        display: "grid",
        gridTemplateColumns: CHAT_DESKTOP_COLUMNS,
        flex: 1,
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* conversation_list (340) */}
      <section
        data-tour="run-list"
        style={{
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div style={{ height: 56, padding: "0 16px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>Runs</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{runs.length}</span>
        </div>

        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
          <div
            style={{
              height: 40,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.surface,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 12px",
              marginBottom: 12,
            }}
          >
            <Icon name="search" size={14} color={C.hint} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search runs"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                color: C.text,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Unread", "Running"].map((option) => {
              const active = option === listFilter;
              const count = runCounts[option];
              return (
                <button
                  key={option}
                  onClick={() => setListFilter(option)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "none",
                    background: active ? C.surface : "transparent",
                    boxShadow: active ? `inset 0 0 0 1px ${C.border}` : "none",
                    color: active ? C.text : C.muted,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {option}
                  {count > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: active ? C.accent : C.base,
                        color: active ? "#FFFFFF" : C.muted,
                        fontSize: 10,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredRuns.length === 0 ? (
            <div style={{ padding: 24, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>No runs yet</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                Ask FounderReach what to build, raise, publish, or automate. Each run appears here.
              </div>
            </div>
          ) : (
            filteredRuns.map((run) => {
              const active = run.id === selectedRunId;
              return (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  style={{
                    width: "100%",
                    height: 64,
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: `1px solid ${C.border}`,
                    background: active ? C.accentL : "transparent",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {run.title}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{run.timestamp}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {run.agents.length > 0 ? `${run.agents.length} agents routed` : "Planning..."}
                    </span>
                    {run.status === "running" && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "founderreach-pulse 1.1s infinite" }} />
                    )}
                    {run.status === "issue" && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.warn }} />
                    )}
                    {run.status === "error" && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.danger }} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* chat_main (560) */}
      <section
        style={{
          background: C.surface,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* toolbar */}
        <div
          style={{
            height: 56,
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
              {activeRun?.title || "FounderReach"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
              {activeRun ? `${activeRun.agents.length} agents · ${activeRun.status}` : "Ready for your first run"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <button style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="search" size={16} color={C.muted} />
            </button>
            <button style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="dots" size={16} color={C.muted} />
            </button>
          </div>
        </div>

        {/* state banner */}
        <div
          style={{
            padding: "10px 20px",
            background: isDemoMode ? "#FFF7E6" : missingCapabilities.length ? "#FEF3CD" : C.accentL,
            color: isDemoMode ? "#B45309" : missingCapabilities.length ? C.warn : C.accent,
            borderBottom: `1px solid ${isDemoMode ? "#FDE4B5" : missingCapabilities.length ? "#F8DC8C" : C.accentM}`,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon
            name={isDemoMode ? "play" : missingCapabilities.length ? "slash" : "check"}
            size={13}
            color={isDemoMode ? "#B45309" : missingCapabilities.length ? C.warn : C.accent}
          />
          {isDemoMode
            ? "Demo Mode is active. FounderReach is running a fabricated showcase."
            : missingCapabilities.length
              ? `Core live services still missing: ${missingCapabilities.join(", ")}. FounderReach will stay honest and demo-safe where needed.`
              : status.integrations?.gmail?.connected || status.integrations?.googleCalendar?.connected
                ? "TinyFish and connected Google accounts are ready. FounderReach can mix live research with live drafts and meetings."
                : "TinyFish research is ready. Connect Gmail and Google Calendar in Settings to make drafts and meetings truly live."}
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: C.surface }}>
          {messages.map((message) => {
            if (message.type === "system") return <SystemMessage key={message.id} text={message.text} />;
            if (message.type === "founder") return <FounderMessage key={message.id} text={message.text} />;
            return <AgentMessage key={message.id} message={message} />;
          })}
          <div ref={bottomRef} />
        </div>

        {/* compose */}
        <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
            <div
              data-tour="chat-compose"
              style={{
                flex: 1,
                border: `1px solid ${C.border}`,
                background: C.surface,
                borderRadius: 8,
                padding: "0 12px",
                display: "flex",
                gap: 8,
                alignItems: "center",
                height: 52,
              }}
            >
              <Icon name="flash" size={14} color={C.hint} />
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    runPromptWithText(input);
                  }
                }}
                placeholder={isDemoMode ? "Ask for a showcase run or press Play demo." : "Type a message..."}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  resize: "none",
                  color: C.text,
                  fontSize: 14,
                  lineHeight: 1.5,
                  padding: "14px 0",
                  maxHeight: 120,
                }}
                onInput={(event) => {
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <button
              data-tour="chat-run"
              onClick={() => runPromptWithText(input)}
              disabled={!input.trim() || busy}
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                border: "none",
                background: input.trim() && !busy ? C.accent : C.base,
                color: input.trim() && !busy ? "#FFFFFF" : C.hint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={busy ? "Running..." : "Send"}
            >
              <Icon name="send" size={15} color={input.trim() && !busy ? "#FFFFFF" : C.hint} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInput(suggestion);
                  inputRef.current?.focus();
                }}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.muted,
                  padding: "6px 12px",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* sidebar_right (280) — group context / run context */}
      <aside
        data-tour="run-context"
        style={{
          background: C.surface,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div style={{ height: 56, padding: "0 16px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>Run context</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* About */}
          <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
              About
            </div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>
              {activeRun?.preview ||
                "Agent orchestration workspace. Runs route a single prompt across specialist agents and stitch results back into CRM, Calendar, and Vault."}
            </div>
          </div>

          {/* Agents in run */}
          <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Agents</span>
              {contextAgents.length > 8 && (
                <button
                  onClick={() => setShowAllAgents((current) => !current)}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.accent,
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                  }}
                >
                  {showAllAgents ? "Show Less" : `View All (${contextAgents.length})`}
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {visibleAgents.map((agentId) => {
                const agent = AGENT_BY_ID[agentId];
                if (!agent) return null;
                const signal = getAgentSignal(agentId);
                return (
                  <div
                    key={agentId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: signal === "running" ? C.accentL : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: C.base,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={agent.icon} size={13} color={C.muted} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {agent.api.toUpperCase()}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: signalColor(signal),
                        flexShrink: 0,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vault */}
          <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Vault</span>
              <button
                onClick={() => onOpenVault?.()}
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.accent,
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                }}
              >
                View All
              </button>
            </div>
            {runArtifacts.length === 0 ? (
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                Outputs from this run will appear here and sync to Vault.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 56px)", gap: 8 }}>
                {runArtifacts.slice(0, 6).map((artifact) => (
                  <div
                    key={artifact.id}
                    title={`${artifact.agent} · ${artifact.title}`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      background: artifact.imageUrl ? "#FFFFFF" : C.base,
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {artifact.imageUrl ? (
                      <img src={artifact.imageUrl} alt={artifact.agent} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Icon name="copy" size={14} color={C.muted} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signals */}
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Signals</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.danger }} />
                Running
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success }} />
                Mode active
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.warn }} />
                Needs attention
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.hint }} />
                Idle
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

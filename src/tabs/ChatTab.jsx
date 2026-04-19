import { useEffect, useMemo, useRef, useState } from "react";
import { AGENT_BY_ID, C, SUGGESTIONS } from "../lib/founderReachCore";
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
        <div style={{ fontSize: 10, color: C.hint, textAlign: "right", marginBottom: 4 }}>You</div>
        <div
          style={{
            padding: "11px 14px",
            borderRadius: "14px 4px 14px 14px",
            background: C.text,
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.65,
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
            background: C.surface,
            borderRadius: "4px 14px 14px 14px",
            padding: "12px 14px",
            fontSize: 13,
            lineHeight: 1.7,
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
                        background: "#f5f7f5",
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

export function ChatTab({ onWorkspaceUpdates, notify, runningAgents, setAgentSignals, setRunningAgents, status }) {
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
        "Use the suggestions below or describe what you want to build, raise, publish, or automate.",
      ],
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const missingKeys = useMemo(
    () =>
      Object.entries(status.services || {})
        .filter(([, value]) => !value.configured)
        .map(([key]) => key),
    [status.services]
  );

  function pushMessage(next) {
    setMessages((current) => [...current, next]);
  }

  function updateMessage(id, patch) {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...patch } : message)));
  }

  async function runPrompt() {
    const prompt = input.trim();
    if (!prompt || busy) return;

    setBusy(true);
    setInput("");
    pushMessage({ id: makeId("user"), type: "founder", text: prompt });

    let plan;
    try {
      plan = await orchestrate(prompt, history);
    } catch (error) {
      setBusy(false);
      notify(error.message, "error");
      return;
    }

    setHistory((current) => [...current, { role: "user", content: prompt }]);
    pushMessage({
      id: makeId("system"),
      type: "system",
      text: `Routing to ${plan.agents.length} agents across ${[...new Set(plan.agents.map((entry) => entry.api.toUpperCase()))].join(", ")}.`,
    });

    setRunningAgents([]);
    setAgentSignals(
      Object.fromEntries(plan.agents.map((entry) => [entry.agent, "pending"]))
    );

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
        progress: "Queued",
      });
    });

    try {
      await Promise.all(
        plan.agents.map(async (entry) => {
          const placeholderId = placeholders[entry.agent];
          const resultEnvelope = {};

          await streamAgentExecution({
            agentId: entry.agent,
            planMessage: entry.message,
            context: plan.context,
            onEvent: ({ event, data }) => {
              if (event === "started") {
                setRunningAgents((current) =>
                  current.includes(entry.agent) ? current : [...current, entry.agent]
                );
                setAgentSignals((current) => {
                  const next = { ...current };
                  delete next[entry.agent];
                  return next;
                });
                updateMessage(placeholderId, { progress: data.text || "Started" });
              }
              if (event === "progress") {
                setRunningAgents((current) =>
                  current.includes(entry.agent) ? current : [...current, entry.agent]
                );
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
                setRunningAgents((current) =>
                  current.filter((agentId) => agentId !== entry.agent)
                );
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
        })
      );

      pushMessage({
        id: makeId("system-complete"),
        type: "system",
        text: "All requested agents finished. New outputs have been added to CRM, Vault, and Calendar.",
      });
      setHistory((current) => [...current, ...plan.agents.map((entry) => ({ role: "assistant", agentId: entry.agent, content: entry.message }))]);
    } catch (error) {
      setAgentSignals((current) => {
        const next = { ...current };
        plan?.agents?.forEach(({ agent }) => {
          next[agent] = "issue";
        });
        return next;
      });
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
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minWidth: 0 }}>
      <div
        style={{
          padding: "8px 18px",
          background: missingKeys.length ? "#fef3cd" : C.accentL,
          color: missingKeys.length ? C.warn : C.accent,
          borderBottom: `1px solid ${missingKeys.length ? "#f8dc8c" : C.accentM}`,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name={missingKeys.length ? "slash" : "check"} size={13} color={missingKeys.length ? C.warn : C.accent} />
        {missingKeys.length
          ? `Live integrations still missing: ${missingKeys.join(", ")}. The app is using safe local simulation where needed.`
          : "All configured services detected. Live mode is ready."}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 10px", background: C.surface }}>
        {messages.map((message) => {
          if (message.type === "system") return <SystemMessage key={message.id} text={message.text} />;
          if (message.type === "founder") return <FounderMessage key={message.id} text={message.text} />;
          return <AgentMessage key={message.id} message={message} />;
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "14px 22px 18px", borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 10 }}>
          <div
            style={{
              flex: 1,
              border: `1.5px solid ${C.border}`,
              background: C.base,
              borderRadius: 16,
              padding: "10px 12px",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
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
                  runPrompt();
                }
              }}
              placeholder="Describe what you're building, raising, publishing, or automating."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                resize: "none",
                color: C.text,
                fontSize: 13,
                lineHeight: 1.6,
                maxHeight: 120,
              }}
              onInput={(event) => {
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            onClick={runPrompt}
            disabled={!input.trim() || busy}
            style={{
              minWidth: 110,
              height: 44,
              borderRadius: 14,
              border: "none",
              background: input.trim() && !busy ? C.accent : C.border,
              color: input.trim() && !busy ? "#fff" : C.hint,
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <Icon name="send" size={13} color={input.trim() && !busy ? "#fff" : C.hint} />
            {busy ? (runningAgents.size > 0 ? `${runningAgents.size} running` : "Running") : "Run"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((suggestion) => (
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
                padding: "6px 10px",
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

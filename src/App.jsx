import { useCallback, useEffect, useMemo, useState } from "react";
import { GuidedTour } from "./components/GuidedTour";
import { SettingsPanel } from "./components/SettingsPanel";
import { Shell } from "./components/Shell";
import { Toast } from "./components/Toast";
import { WelcomeOverlay } from "./components/WelcomeOverlay";
import { usePersistentState } from "./hooks/usePersistentState";
import { clearFounderReachSession, createEmptyApiKeys, hasApiKeys, mergeStatusWithUserKeys } from "./lib/session";
import { seedAssets, seedContacts, seedEvents } from "./lib/workspace";
import { bookMeeting, fetchStatus, publishAsset, sendEmail } from "./services/api";
import { CalendarTab } from "./tabs/CalendarTab";
import { CRMTab } from "./tabs/CRMTab";
import { ChatTab } from "./tabs/ChatTab";
import { VaultTab } from "./tabs/VaultTab";

const DEMO_PROMPT =
  "Show me the ultimate FounderReach workflow for a founder building in public: investor discovery, creator content strategy, launch thread, newsletter, a weekly execution calendar, and vault organization.";

function mergeUniqueRecords(incoming, current) {
  const next = new Map();

  [...incoming, ...current].forEach((item) => {
    if (!item?.id) return;
    next.set(item.id, {
      ...(next.get(item.id) || {}),
      ...item,
    });
  });

  return Array.from(next.values());
}

const TOUR_STEPS = [
  {
    id: "mode-select",
    selector: '[data-tour="mode-select"]',
    title: "Modes and demo playback",
    description:
      "This dropdown switches FounderReach between focused operating modes. Demo Mode is the guided version for new visitors, with fabricated but believable outputs that show the full product story.",
    hint: "Use Creator Mode for real founder-content work, or switch to Demo Mode to watch the ideal walkthrough.",
    placement: "bottom",
    duration: 3600,
    tab: "chat",
  },
  {
    id: "demo-play",
    selector: '[data-tour="demo-play"]',
    title: "One-click product walkthrough",
    description:
      "The play button launches a slower, narrated FounderReach demo. It shows the best-case workflow instead of dropping a new visitor into an empty interface.",
    hint: "This is where judges or first-time users can watch the app tell its own story.",
    placement: "bottom",
    duration: 3200,
    tab: "chat",
  },
  {
    id: "agent-rail",
    selector: '[data-tour="agent-rail"]',
    title: "The 24-agent operating rail",
    description:
      "Every specialist sits in the left rail. Signals glow green for the current mode, red while running, and yellow when something is pending or needs attention.",
    hint: "Hover any agent to inspect its process, prompt preview, and a plain-language explanation of how it works.",
    placement: "right",
    duration: 3600,
    tab: "chat",
  },
  {
    id: "chat-compose",
    selector: '[data-tour="chat-compose"]',
    title: "Multi-agent command center",
    description:
      "The chat tab is the control surface. One prompt can route work across fundraising, content, research, scheduling, and media generation.",
    hint: "In Demo Mode, this run is fabricated on purpose so the experience is safe, reliable, and easy to follow.",
    placement: "top",
    duration: 3600,
    tab: "chat",
  },
  {
    id: "crm-root",
    selector: '[data-tour="crm-root"]',
    title: "CRM updates from agent output",
    description:
      "Contacts discovered during the run are stitched directly into CRM so outreach, notes, and next actions stay connected to the original prompt.",
    hint: "This panel should feel like the execution memory of the workspace, not a disconnected database.",
    placement: "right",
    duration: 3400,
    tab: "crm",
  },
  {
    id: "calendar-root",
    selector: '[data-tour="calendar-root"]',
    title: "Calendar as execution cadence",
    description:
      "The scheduler turns strategy into a founder-friendly week by adding creation blocks, outreach windows, and publishing moments into Calendar.",
    hint: "A good demo should show not just ideas, but the rhythm of execution.",
    placement: "right",
    duration: 3400,
    tab: "calendar",
  },
  {
    id: "vault-root",
    selector: '[data-tour="vault-root"]',
    title: "Vault as system memory",
    description:
      "The vault stores the durable outputs: strategies, drafts, scripts, assets, and templates. This is where the work compounds over time instead of disappearing into chat history.",
    hint: "Newly generated assets should land here automatically during the demo run.",
    placement: "right",
    duration: 3400,
    tab: "vault",
  },
  {
    id: "settings-panel",
    selector: '[data-tour="settings-panel"]',
    title: "Personal keys, instructions, and sign-out",
    description:
      "Settings is where a new user can add their own API keys, replay the walkthrough, inspect agent instructions, and sign out of this browser session.",
    hint: "Keys are stored in this browser session and sent only on requests from this client.",
    placement: "left",
    duration: 3600,
    tab: "chat",
    panel: "settings",
  },
];

export default function App() {
  const [tab, setTab] = useState("chat");
  const [mode, setMode] = usePersistentState("fr-mode", "Creator Mode");
  const [crmContacts, setCRMContacts] = usePersistentState("fr-crm-contacts", seedContacts);
  const [vaultAssets, setVaultAssets] = usePersistentState("fr-vault-assets", seedAssets);
  const [calendarEvents, setCalendarEvents] = usePersistentState("fr-calendar-events", seedEvents);
  const [userApiKeys, setUserApiKeys] = usePersistentState("fr-api-keys", createEmptyApiKeys());
  const [welcomeDismissed, setWelcomeDismissed] = usePersistentState("fr-welcome-dismissed", false);
  const [runningAgents, setRunningAgents] = useState([]);
  const [agentSignals, setAgentSignals] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatSessionVersion, setChatSessionVersion] = useState(0);
  const [demoRunId, setDemoRunId] = useState(0);
  const [tourState, setTourState] = useState({ open: false, index: 0, playing: false });
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState({ loading: true, workspaceMode: "local", services: {} });

  const runningSet = useMemo(() => new Set(runningAgents), [runningAgents]);
  const effectiveStatus = useMemo(() => mergeStatusWithUserKeys(status, userApiKeys), [status, userApiKeys]);
  const userLabel = hasApiKeys(userApiKeys) ? "Personal browser session" : "Guest browser session";
  const currentTourStep = TOUR_STEPS[tourState.index];

  const notify = useCallback((message, tone = "info") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus((current) => ({ ...current, loading: true }));
      const next = await fetchStatus();
      setStatus({ loading: false, ...next });
    } catch (error) {
      setStatus({
        loading: false,
        workspaceMode: "local",
        services: {},
        error: error.message,
      });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!tourState.open) return;

    const step = TOUR_STEPS[tourState.index];
    if (step?.tab) setTab(step.tab);
    setSettingsOpen(step?.panel === "settings");
  }, [tourState.index, tourState.open]);

  useEffect(() => {
    if (!tourState.open || !tourState.playing) return undefined;

    const duration = TOUR_STEPS[tourState.index]?.duration || 3400;
    const timer = window.setTimeout(() => {
      setTourState((current) => {
        if (current.index >= TOUR_STEPS.length - 1) {
          return { open: false, index: 0, playing: false };
        }
        return { ...current, index: current.index + 1 };
      });
    }, duration);

    return () => window.clearTimeout(timer);
  }, [tourState.index, tourState.open, tourState.playing]);

  const resetWorkspaceToSeed = useCallback(() => {
    setCRMContacts(seedContacts);
    setVaultAssets(seedAssets);
    setCalendarEvents(seedEvents);
    setRunningAgents([]);
    setAgentSignals({});
    setSettingsOpen(false);
    setTab("chat");
    setChatSessionVersion((current) => current + 1);
  }, [setCRMContacts, setVaultAssets, setCalendarEvents]);

  const closeTour = useCallback(() => {
    setTourState({ open: false, index: 0, playing: false });
    setSettingsOpen(false);
  }, []);

  const startDemoPlayback = useCallback(() => {
    setWelcomeDismissed(true);
    setMode("Demo Mode");
    resetWorkspaceToSeed();
    setDemoRunId((current) => current + 1);
    setTourState({ open: true, index: 0, playing: false });
    notify("Demo walkthrough started. FounderReach is running in fabricated showcase mode.", "info");
  }, [notify, resetWorkspaceToSeed, setMode, setWelcomeDismissed]);

  const mergeWorkspaceUpdates = useCallback(
    ({ contacts = [], assets = [], events = [] }) => {
      if (contacts.length) setCRMContacts((current) => mergeUniqueRecords(contacts, current));
      if (assets.length) setVaultAssets((current) => mergeUniqueRecords(assets, current));
      if (events.length) setCalendarEvents((current) => mergeUniqueRecords(events, current));
    },
    [setCRMContacts, setVaultAssets, setCalendarEvents]
  );

  const handleSaveApiKeys = useCallback(
    (nextKeys) => {
      try {
        window.localStorage.setItem("fr-api-keys", JSON.stringify(nextKeys));
      } catch {
        // Ignore restricted-storage environments.
      }
      setUserApiKeys(nextKeys);
      notify("API keys saved to this browser session.", "success");
      refreshStatus();
    },
    [notify, refreshStatus]
  );

  const handleClearApiKeys = useCallback(() => {
    const next = createEmptyApiKeys();
    try {
      window.localStorage.setItem("fr-api-keys", JSON.stringify(next));
    } catch {
      // Ignore restricted-storage environments.
    }
    setUserApiKeys(next);
    notify("Stored API keys were cleared from this browser session.", "success");
    refreshStatus();
  }, [notify, refreshStatus]);

  const handleSendEmail = useCallback(
    async (contact) => {
      try {
        const result = await sendEmail(contact, { demoMode: mode === "Demo Mode" });
        notify(result.message, "success");
        const email = result?.email;
        if (email) {
          setVaultAssets((current) => {
            const id = `asset-sent-${contact.id}-${Date.now()}`;
            const entry = {
              id,
              name: `Email: ${email.toName} — ${email.subject}`,
              type: "Email",
              icon: "mail",
              agent: "outreach",
              section: "promo",
              time: "just now",
              content: {
                subject: email.subject,
                to_name: email.toName,
                to: email.to,
                body: email.body,
                sent_at: email.sentAt,
                status: email.status,
              },
            };
            return mergeUniqueRecords([entry], current);
          });
        }
        setCRMContacts((current) =>
          current.map((item) =>
            item.id === contact.id
              ? {
                  ...item,
                  stage: "Contacted",
                  lastContact: "just now",
                  lastEmail: email ? { subject: email.subject, sentAt: email.sentAt } : item.lastEmail,
                }
              : item
          )
        );
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [mode, notify, setCRMContacts, setVaultAssets]
  );

  const handleBookMeeting = useCallback(
    async (contact) => {
      try {
        const result = await bookMeeting(contact, { demoMode: mode === "Demo Mode" });
        notify(result.message, "success");
        const meeting = result?.meeting;
        if (meeting) {
          setCalendarEvents((current) => {
            const id = `event-meeting-${contact.id}-${Date.now()}`;
            const entry = {
              id,
              day: meeting.day,
              slot: meeting.slot,
              title: meeting.title,
              bg: meeting.bg || "#181C23",
              color: meeting.color || "#fff",
              startsAt: meeting.startsAt,
              endsAt: meeting.endsAt,
              with: meeting.with,
            };
            return mergeUniqueRecords([entry], current);
          });
        }
        setCRMContacts((current) =>
          current.map((item) =>
            item.id === contact.id
              ? {
                  ...item,
                  stage: "Meeting Booked",
                  lastContact: "just now",
                  nextMeeting: meeting ? { startsAt: meeting.startsAt, title: meeting.title } : item.nextMeeting,
                }
              : item
          )
        );
        setTab("calendar");
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [mode, notify, setCRMContacts, setCalendarEvents]
  );

  const handlePublishAsset = useCallback(
    async (asset) => {
      try {
        const result = await publishAsset(asset, { demoMode: mode === "Demo Mode" });
        notify(result.message, "success");
        const publish = result?.publish;
        if (publish) {
          setVaultAssets((current) =>
            current.map((item) =>
              item.id === asset.id
                ? {
                    ...item,
                    published: true,
                    publishedAt: publish.publishedAt,
                    publishedTo: publish.publishedTo,
                  }
                : item
            )
          );
        }
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [mode, notify, setVaultAssets]
  );

  const handleSignOut = useCallback(() => {
    clearFounderReachSession();
    window.location.reload();
  }, []);

  return (
    <>
      <Shell
        agentSignals={agentSignals}
        demoPlaying={tourState.open && tourState.playing && mode === "Demo Mode"}
        mode={mode}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={handleSignOut}
        onStartDemo={startDemoPlayback}
        runningAgents={runningSet}
        setMode={setMode}
        setTab={setTab}
        status={effectiveStatus}
        tab={tab}
        userLabel={userLabel}
      >
        {tab === "chat" && (
          <ChatTab
            key={`chat-${chatSessionVersion}`}
            agentSignals={agentSignals}
            demoPrompt={DEMO_PROMPT}
            demoRunId={demoRunId}
            mode={mode}
            notify={notify}
            onWorkspaceUpdates={mergeWorkspaceUpdates}
            runningAgents={runningSet}
            setAgentSignals={setAgentSignals}
            setRunningAgents={setRunningAgents}
            status={effectiveStatus}
          />
        )}
        {tab === "crm" && (
          <CRMTab
            contacts={crmContacts}
            onBookMeeting={handleBookMeeting}
            onSendEmail={handleSendEmail}
            setContacts={setCRMContacts}
          />
        )}
        {tab === "calendar" && <CalendarTab events={calendarEvents} />}
        {tab === "vault" && (
          <VaultTab
            assets={vaultAssets}
            notify={notify}
            onPublishAsset={handlePublishAsset}
          />
        )}
      </Shell>

      {settingsOpen && (
        <SettingsPanel
          onClearApiKeys={handleClearApiKeys}
          onClose={() => setSettingsOpen(false)}
          onRefresh={refreshStatus}
          onReplayDemo={startDemoPlayback}
          onSaveApiKeys={handleSaveApiKeys}
          onSignOut={handleSignOut}
          status={effectiveStatus}
          userApiKeys={userApiKeys}
        />
      )}

      {!welcomeDismissed && (
        <WelcomeOverlay
          onDismiss={() => setWelcomeDismissed(true)}
          onStartDemo={startDemoPlayback}
        />
      )}

      <GuidedTour
        open={tourState.open}
        onBack={() =>
          setTourState((current) => ({
            ...current,
            playing: false,
            index: Math.max(0, current.index - 1),
          }))
        }
        onClose={closeTour}
        onNext={() =>
          setTourState((current) => {
            if (current.index >= TOUR_STEPS.length - 1) {
              return { open: false, index: 0, playing: false };
            }
            return { ...current, playing: false, index: current.index + 1 };
          })
        }
        onTogglePlaying={() => setTourState((current) => ({ ...current, playing: !current.playing }))}
        playing={tourState.playing}
        step={currentTourStep}
        stepIndex={tourState.index}
        total={TOUR_STEPS.length}
      />

      {toast && <Toast key={toast.id} tone={toast.tone} message={toast.message} />}
    </>
  );
}

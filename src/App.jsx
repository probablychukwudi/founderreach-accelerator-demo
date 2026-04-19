import { useCallback, useEffect, useMemo, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { Shell } from "./components/Shell";
import { Toast } from "./components/Toast";
import { usePersistentState } from "./hooks/usePersistentState";
import { seedAssets, seedContacts, seedEvents } from "./lib/workspace";
import { bookMeeting, fetchStatus, publishAsset, sendEmail } from "./services/api";
import { CalendarTab } from "./tabs/CalendarTab";
import { CRMTab } from "./tabs/CRMTab";
import { ChatTab } from "./tabs/ChatTab";
import { VaultTab } from "./tabs/VaultTab";

export default function App() {
  const [tab, setTab] = useState("chat");
  const [mode, setMode] = usePersistentState("fr-mode", "Creator Mode");
  const [crmContacts, setCRMContacts] = usePersistentState("fr-crm-contacts", seedContacts);
  const [vaultAssets, setVaultAssets] = usePersistentState("fr-vault-assets", seedAssets);
  const [calendarEvents, setCalendarEvents] = usePersistentState("fr-calendar-events", seedEvents);
  const [runningAgents, setRunningAgents] = useState([]);
  const [agentSignals, setAgentSignals] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState({ loading: true, workspaceMode: "local", services: {} });

  const runningSet = useMemo(() => new Set(runningAgents), [runningAgents]);

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

  const mergeWorkspaceUpdates = useCallback(
    ({ contacts = [], assets = [], events = [] }) => {
      if (contacts.length) setCRMContacts((current) => [...contacts, ...current]);
      if (assets.length) setVaultAssets((current) => [...assets, ...current]);
      if (events.length) setCalendarEvents((current) => [...events, ...current]);
    },
    [setCRMContacts, setVaultAssets, setCalendarEvents]
  );

  const handleSendEmail = useCallback(
    async (contact) => {
      try {
        const result = await sendEmail(contact);
        notify(result.message, "success");
        setCRMContacts((current) =>
          current.map((item) =>
            item.id === contact.id ? { ...item, stage: "Contacted", lastContact: "just now" } : item
          )
        );
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [notify, setCRMContacts]
  );

  const handleBookMeeting = useCallback(
    async (contact) => {
      try {
        const result = await bookMeeting(contact);
        notify(result.message, "success");
        setCRMContacts((current) =>
          current.map((item) =>
            item.id === contact.id ? { ...item, stage: "Meeting Booked", lastContact: "just now" } : item
          )
        );
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [notify, setCRMContacts]
  );

  const handlePublishAsset = useCallback(
    async (asset) => {
      try {
        const result = await publishAsset(asset);
        notify(result.message, "success");
      } catch (error) {
        notify(error.message, "error");
      }
    },
    [notify]
  );

  return (
    <>
      <Shell
        agentSignals={agentSignals}
        mode={mode}
        onOpenSettings={() => setSettingsOpen(true)}
        runningAgents={runningSet}
        setMode={setMode}
        setTab={setTab}
        status={status}
        tab={tab}
      >
        {tab === "chat" && (
          <ChatTab
            notify={notify}
            onWorkspaceUpdates={mergeWorkspaceUpdates}
            runningAgents={runningSet}
            setAgentSignals={setAgentSignals}
            setRunningAgents={setRunningAgents}
            status={status}
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
          onClose={() => setSettingsOpen(false)}
          onRefresh={refreshStatus}
          status={status}
        />
      )}
      {toast && <Toast key={toast.id} tone={toast.tone} message={toast.message} />}
    </>
  );
}

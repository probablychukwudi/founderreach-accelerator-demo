import { useEffect, useMemo, useState } from "react";
import { C, VAULT_SECTIONS } from "../lib/founderReachCore";
import { buildAssetText, downloadAsset } from "../lib/workspace";
import { Icon } from "../components/Icon";

const typeStyles = {
  Tweet: { background: C.base, color: C.muted },
  Newsletter: { background: "#6d28d9", color: "#fff" },
  "Video Script": { background: "#dc2626", color: "#fff" },
  Podcast: { background: "#7c3aed", color: "#fff" },
  Course: { background: "#0f6e56", color: "#fff" },
  Email: { background: C.text, color: "#fff" },
  Image: { background: "#e6f2e8", color: "#258530" },
  Video: { background: "#dc2626", color: "#fff" },
  Strategy: { background: "#258530", color: "#fff" },
  SEO: { background: "#0369a1", color: "#fff" },
  Revenue: { background: "#b45309", color: "#fff" },
  Design: { background: "#db2777", color: "#fff" },
  Technical: { background: "#0369a1", color: "#fff" },
  Analytics: { background: "#0891b2", color: "#fff" },
  Calendar: { background: "#258530", color: "#fff" },
  System: { background: C.muted, color: "#fff" },
};

export function VaultTab({ assets, notify, onPublishAsset }) {
  const [selectedSection, setSelectedSection] = useState("pillars");
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const sectionAssets = useMemo(() => assets.filter((asset) => asset.section === selectedSection), [assets, selectedSection]);
  const selectedAsset = detailsOpen ? assets.find((asset) => asset.id === selectedAssetId) || null : null;

  useEffect(() => {
    if (!sectionAssets.length) {
      setSelectedAssetId(null);
      setDetailsOpen(false);
      return;
    }
    if (!sectionAssets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(sectionAssets[0].id);
      setDetailsOpen(true);
    }
  }, [sectionAssets, selectedAssetId]);

  async function handleCopy(asset) {
    try {
      await navigator.clipboard.writeText(buildAssetText(asset));
      notify("Asset copied to clipboard.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
      <div style={{ width: 246, borderRight: `1px solid ${C.border}`, background: "#f5f7f5", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "14px 14px 8px", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>Vault</div>
        {VAULT_SECTIONS.map((section) => {
          const count = assets.filter((asset) => asset.section === section.id).length;
          const active = section.id === selectedSection;
          return (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              style={{ width: "100%", textAlign: "left", border: "none", background: active ? C.accentL : "transparent", borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent", padding: "7px 14px", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Icon name={section.icon} size={13} color={active ? C.accent : section.color} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: active ? 700 : 500, color: active ? C.accent : C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{section.label}</span>
              {count > 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999, background: C.accentM, color: C.sidebar }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: C.surface }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{VAULT_SECTIONS.find((section) => section.id === selectedSection)?.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sectionAssets.length} items</div>
          </div>
        </div>

        {sectionAssets.length === 0 ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: C.hint }}>
            <div style={{ textAlign: "center" }}>
              <Icon name={VAULT_SECTIONS.find((section) => section.id === selectedSection)?.icon || "folder"} size={28} color={C.border} />
              <div style={{ marginTop: 12, fontSize: 13 }}>No content in this section yet.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                {sectionAssets.map((asset) => {
                  const style = typeStyles[asset.type] || { background: C.base, color: C.muted };
                  return (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAssetId(asset.id);
                        setDetailsOpen(true);
                      }}
                      style={{ textAlign: "left", borderRadius: 16, border: `1px solid ${selectedAsset?.id === asset.id ? C.accent : C.border}`, background: C.surface, overflow: "hidden", padding: 0 }}
                    >
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.name} style={{ width: "100%", height: 112, objectFit: "cover" }} />
                      ) : (
                        <div style={{ height: 112, borderBottom: `1px solid ${C.border}`, background: C.base, display: "grid", placeItems: "center" }}>
                          <Icon name={asset.icon || "folder"} size={26} color={C.hint} strokeWidth={1.3} />
                        </div>
                      )}
                      <div style={{ padding: "12px 13px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{asset.name}</div>
                        <div style={{ fontSize: 11, color: C.hint, marginBottom: 8 }}>{asset.time}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: C.muted }}>{asset.agent}</span>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: "4px 7px", borderRadius: 999, ...style }}>{asset.type}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedAsset && (
              <div style={{ width: 340, borderLeft: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{selectedAsset.name}</div>
                  <button onClick={() => setDetailsOpen(false)} style={{ border: "none", background: "none", padding: 4 }}>
                    <Icon name="close" size={15} color={C.muted} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 12 }}>
                  {selectedAsset.imageUrl && <img src={selectedAsset.imageUrl} alt={selectedAsset.name} style={{ borderRadius: 12, border: `1px solid ${C.border}` }} />}
                  {selectedAsset.videoUrl && <video controls style={{ borderRadius: 12, border: `1px solid ${C.border}` }}><source src={selectedAsset.videoUrl} /></video>}
                  <div style={{ fontSize: 11, color: C.muted }}>{selectedAsset.agent} agent · {selectedAsset.time}</div>
                  <pre style={{ padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: "#f5f7f5", fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{buildAssetText(selectedAsset)}</pre>
                </div>
                <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: "grid", gap: 8 }}>
                  <button onClick={() => handleCopy(selectedAsset)} style={{ width: "100%", borderRadius: 12, border: "none", background: C.text, color: "#fff", padding: "11px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Icon name="copy" size={13} color="#fff" />
                    Copy
                  </button>
                  <button onClick={() => onPublishAsset(selectedAsset)} style={{ width: "100%", borderRadius: 12, border: `1px solid ${C.accentM}`, background: C.accentL, color: C.accent, padding: "11px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Icon name="globe" size={13} color={C.accent} />
                    Publish
                  </button>
                  <button onClick={() => downloadAsset(selectedAsset)} style={{ width: "100%", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: "11px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Icon name="download" size={13} color={C.muted} />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

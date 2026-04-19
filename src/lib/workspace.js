import { AGENT_BY_ID } from "./founderReachCore";

export const seedContacts = [
  { id: "seed-contact-1", name: "Sequoia Scout", role: "Partner", company: "Sequoia Capital", type: "Investor", stage: "Meeting Booked", agent: "vc", notes: "Strong fit for AI infrastructure and founder-led distribution stories.", track: "VC", email: "partners@sequoiacapital.example", lastContact: "2h ago" },
  { id: "seed-contact-2", name: "Maya Chen", role: "Head of Partnerships", company: "Creator Stack Labs", type: "Prospect", stage: "Researching", agent: "sales", notes: "Potential design partner for creator workflow automation.", track: "Sales", email: "maya@creatorstacklabs.example", lastContact: "Yesterday" },
  { id: "seed-contact-3", name: "Dr. Amina Patel", role: "Lab Director", company: "Northwestern Applied AI Lab", type: "Research", stage: "Intro Sent", agent: "research", notes: "Interested in founder productivity systems and AI-mediated workflows.", track: "Research", email: "apatel@northwestern.example", lastContact: "3d ago" },
];

export const seedAssets = [
  { id: "seed-asset-1", name: "FounderReach Content Strategy", type: "Strategy", icon: "star", agent: "content_dir", section: "pillars", time: "today", content: { content_pillars: ["Founder workflows", "Creator leverage", "AI ops", "Go-to-market systems", "Fundraising narrative"], best_formats: ["Threads", "YouTube explainers", "Newsletters"], posting_frequency: "4 posts per week" } },
  { id: "seed-asset-2", name: "5-Tweet Launch Thread", type: "Tweet", icon: "send", agent: "tweets", section: "threads", time: "today", content: { thread: [{ n: 1, text: "Most founders do not need more tools. They need an operating system that turns one idea into outreach, content, and momentum.", chars: 136 }, { n: 2, text: "FounderReach treats a solo founder like a 24-agent company. Strategy, research, sales, content, and publishing all move from one prompt.", chars: 147 }, { n: 3, text: "The key is not automation theater. It is routing the right work to the right specialist, then watching the execution happen live.", chars: 139 }, { n: 4, text: "That means investor scouting, creator content, outreach, and scheduling can all share one memory and one workspace.", chars: 132 }, { n: 5, text: "If you are building in public, you are already running a media company and a startup. Your tools should reflect that.", chars: 125 }] } },
  { id: "seed-asset-3", name: "Launch Week Newsletter", type: "Newsletter", icon: "mail", agent: "newsletter", section: "newsletters", time: "yesterday", content: { subject: "How solo founders build like a full-stack team", preview: "The systems behind founder-led momentum.", intro: "This week we are unpacking the founder workflow stack behind FounderReach.", sections: [{ title: "Why founder-led distribution matters", body: "Audiences trust builders who show their work.", takeaway: "Ship in public with structure." }, { title: "What AI agents should actually do", body: "Specialists reduce context switching and create compounding outputs.", takeaway: "Design by function, not hype." }], cta: "Reply if you want the rollout checklist." } },
  { id: "seed-asset-4", name: "FounderReach Demo Script", type: "Video Script", icon: "video", agent: "video_prod", section: "yt_scripts", time: "yesterday", content: { title: "Inside FounderReach", hook: "What if a solo founder could operate like a 175-person company?", segments: [{ type: "intro", script: "Open on the problem of fragmented founder tools.", broll_note: "Dashboard closeups", duration_sec: 35 }, { type: "main", script: "Show the 24 agents working in parallel across CRM, vault, and calendar.", broll_note: "Live browser automation", duration_sec: 140 }] } },
  { id: "seed-asset-5", name: "Brand Direction", type: "Design", icon: "image", agent: "designer", section: "style", time: "3d ago", content: { palette: { primary: "#258530", secondary: "#091F17", accent: "#e6f2e8", rationale: "Signals depth, confidence, and precision." }, typography: { heading: "Inter", body: "Inter", rationale: "Operational clarity without noise." }, ui_direction: "Command center meets premium creator OS." } },
];

export const seedEvents = [
  { id: "seed-event-1", day: 0, slot: 2, title: "Tiny Fish Accelerator review", bg: "#091F17", color: "#fff" },
  { id: "seed-event-2", day: 1, slot: 4, title: "Newsletter production sprint", bg: "#6d28d9", color: "#fff" },
  { id: "seed-event-3", day: 2, slot: 6, title: "Investor outreach batch", bg: "#258530", color: "#fff" },
  { id: "seed-event-4", day: 3, slot: 3, title: "YouTube script review", bg: "#dc2626", color: "#fff" },
  { id: "seed-event-5", day: 4, slot: 1, title: "Publish launch thread", bg: "#0284c7", color: "#fff" },
];

export function makeId(prefix = "fr") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildAssetText(asset) {
  if (!asset) return "";
  if (asset.type === "Tweet" && asset.content?.thread) return asset.content.thread.map((tweet) => `${tweet.n}. ${tweet.text}`).join("\n\n");
  if (asset.type === "Email" && asset.content?.body) return `Subject: ${asset.content.subject}\n\n${asset.content.body}`;
  if (asset.type === "Newsletter" && asset.content) {
    const sections = (asset.content.sections || []).map((section) => `${section.title}\n${section.body}\nTakeaway: ${section.takeaway}`).join("\n\n");
    return `${asset.content.subject}\n${asset.content.preview}\n\n${asset.content.intro}\n\n${sections}\n\nCTA: ${asset.content.cta}`;
  }
  return JSON.stringify(asset.content || {}, null, 2);
}

export function downloadAsset(asset) {
  const blob = new Blob([buildAssetText(asset)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${asset.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function deriveWorkspaceUpdates(agentId, result) {
  const contacts = [];
  const assets = [];
  const events = [];
  const agent = AGENT_BY_ID[agentId];
  const stamp = "just now";
  const addContact = (entry) => {
    const stableId = entry.email
      ? `contact-${slugify(entry.email)}`
      : `contact-${slugify(`${entry.name}-${entry.company}-${entry.type}`)}`;
    contacts.push({ id: stableId, lastContact: stamp, ...entry });
  };
  const addAsset = (entry) => {
    const stableId = `asset-${slugify(`${entry.section}-${entry.type}-${entry.name}`)}`;
    assets.push({ id: stableId, time: stamp, agent: agentId, ...entry });
  };

  if (!result || typeof result !== "object") return { contacts, assets, events };

  if (agentId === "vc" && Array.isArray(result.investors)) {
    result.investors.forEach((investor) => addContact({ name: investor.name, role: "Partner", company: investor.name, type: "Investor", stage: investor.match === "high" ? "Meeting Booked" : "Contacted", agent: agentId, notes: investor.thesis, track: "VC", email: investor.email || "" }));
  }
  if (agentId === "sales" && Array.isArray(result.prospects)) {
    result.prospects.forEach((prospect) => addContact({ name: prospect.company, role: prospect.title, company: prospect.company, type: "Prospect", stage: "Researching", agent: agentId, notes: prospect.reason, track: "Sales", email: prospect.email || "" }));
  }
  if (agentId === "research" && Array.isArray(result.labs)) {
    result.labs.forEach((lab) => addContact({ name: lab.researcher, role: "Lab Director", company: lab.institution, type: "Research", stage: "Intro Sent", agent: agentId, notes: lab.focus, track: "Research", email: lab.email || "" }));
  }

  if (agentId === "tweets" && result.thread) addAsset({ name: "Generated Tweet Thread", type: "Tweet", icon: "send", section: "threads", content: result });
  if (agentId === "newsletter" && result.subject) addAsset({ name: result.subject, type: "Newsletter", icon: "mail", section: "newsletters", content: result });
  if (agentId === "video_prod" && result.title) addAsset({ name: `${result.title} Script`, type: "Video Script", icon: "video", section: "yt_scripts", content: result });
  if (agentId === "podcast" && result.episode_title) addAsset({ name: result.episode_title, type: "Podcast", icon: "mic", section: "podcasts", content: result });
  if (agentId === "course_builder" && result.course_title) addAsset({ name: result.course_title, type: "Course", icon: "book", section: "courses", content: result });
  if (agentId === "outreach" && Array.isArray(result.emails)) result.emails.forEach((email) => addAsset({ name: `Email: ${email.to_name}`, type: "Email", icon: "mail", section: "promo", content: email }));
  if (agentId === "imagegen" && result.imageUrl) addAsset({ name: result.prompt?.slice(0, 40) || "Generated Image", type: "Image", icon: "image", section: "thumbnails", imageUrl: result.imageUrl, content: result });
  if (agentId === "videogen" && (result.videoUrl || result.videoId)) addAsset({ name: "AI Video Deliverable", type: "Video", icon: "play", section: "shortform", videoUrl: result.videoUrl, content: result });
  if (agentId === "content_dir" && result.content_pillars) addAsset({ name: "Content Strategy", type: "Strategy", icon: "star", section: "pillars", content: result });
  if (agentId === "seo" && result.keywords) addAsset({ name: result.recommended_title || "SEO Research", type: "SEO", icon: "search", section: "keywords", content: result });
  if (agentId === "monetization" && result.sponsors) addAsset({ name: "Monetization Plan", type: "Revenue", icon: "tag", section: "revenue", content: result });
  if (agentId === "designer" && result.palette) addAsset({ name: "Brand Design Brief", type: "Design", icon: "image", section: "style", content: result });
  if (agentId === "webbuilder" && result.stack) addAsset({ name: "Tech Stack", type: "Technical", icon: "link", section: "multi_plat", content: result });
  if (agentId === "analytics" && result.benchmarks) addAsset({ name: "Analytics Benchmarks", type: "Analytics", icon: "chart", section: "perf", content: result });
  if (agentId === "archivist" && result.vault_structure) addAsset({ name: "Vault Organization", type: "System", icon: "folder", section: "roadmap", content: result });
  if (agentId === "scheduler" && result.weekly_schedule) {
    addAsset({ name: "Content Schedule", type: "Calendar", icon: "calendar2", section: "batch_days", content: result });
    result.weekly_schedule.forEach((entry, index) => {
      const day = (entry.day || "").toLowerCase();
      const mappedDay = day.startsWith("mon") ? 0 : day.startsWith("tue") ? 1 : day.startsWith("wed") ? 2 : day.startsWith("thu") ? 3 : day.startsWith("fri") ? 4 : index % 5;
      const title = entry.tasks?.[0] || entry.batch_type || "Content block";
      events.push({
        id: `event-${slugify(`${mappedDay}-${1 + (index % 7)}-${title}`)}`,
        day: mappedDay,
        slot: 1 + (index % 7),
        title,
        bg: "#258530",
        color: "#fff",
      });
    });
  }

  return { contacts, assets, events };
}

const canvas = document.querySelector("#graphCanvas");
const ctx = canvas.getContext("2d");
const graphStage = document.querySelector(".graph-stage");

const els = {
  apiStatus: document.querySelector("#apiStatus"),
  seedInput: document.querySelector("#seedInput"),
  targetCount: document.querySelector("#targetCount"),
  queueCount: document.querySelector("#queueCount"),
  depthOption: document.querySelector("#depthOption"),
  depthInput: document.querySelector("#depthInput"),
  snowballToggle: document.querySelector("#snowballToggle"),
  startCollection: document.querySelector("#startCollection"),
  cancelCollection: document.querySelector("#cancelCollection"),
  jsonImport: document.querySelector("#jsonImport"),
  exportCsv: document.querySelector("#exportCsv"),
  searchInput: document.querySelector("#searchInput"),
  searchPrev: document.querySelector("#searchPrev"),
  searchNext: document.querySelector("#searchNext"),
  searchCount: document.querySelector("#searchCount"),
  selectedActions: document.querySelector("#selectedActions"),
  selectedCount: document.querySelector("#selectedCount"),
  selectedMap: document.querySelector("#selectedMap"),
  selectedQueue: document.querySelector("#selectedQueue"),
  selectedMembers: document.querySelector("#selectedMembers"),
  selectedExportCsv: document.querySelector("#selectedExportCsv"),
  selectedDelete: document.querySelector("#selectedDelete"),
  selectedClear: document.querySelector("#selectedClear"),
  hideBlankNodes: document.querySelector("#hideBlankNodes"),
  hideChatGroups: document.querySelector("#hideChatGroups"),
  hideChannels: document.querySelector("#hideChannels"),
  showUserLayer: document.querySelector("#showUserLayer"),
  nodeSizeMode: document.querySelector("#nodeSizeMode"),
  labelDensity: document.querySelector("#labelDensity"),
  minEdgeWeight: document.querySelector("#minEdgeWeight"),
  readabilityLabel: document.querySelector("#readabilityLabel"),
  communityMode: document.querySelector("#communityMode"),
  communityLabel: document.querySelector("#communityLabel"),
  reflowGraph: document.querySelector("#reflowGraph"),
  gridGraph: document.querySelector("#gridGraph"),
  fitGraphTop: document.querySelector("#fitGraphTop"),
  timeFilterToggle: document.querySelector("#timeFilterToggle"),
  timeStart: document.querySelector("#timeStart"),
  timeEnd: document.querySelector("#timeEnd"),
  timePlay: document.querySelector("#timePlay"),
  timeSlider: document.querySelector("#timeSlider"),
  timeLabel: document.querySelector("#timeLabel"),
  layoutState: document.querySelector("#layoutState"),
  nodeCount: document.querySelector("#nodeCount"),
  edgeCount: document.querySelector("#edgeCount"),
  scanCount: document.querySelector("#scanCount"),
  progressFill: document.querySelector("#progressFill"),
  progressSeed: document.querySelector("#progressSeed"),
  progressBridge: document.querySelector("#progressBridge"),
  progressScan: document.querySelector("#progressScan"),
  progressMerge: document.querySelector("#progressMerge"),
  progressCard: document.querySelector(".scan-progress"),
  collectionStatusBanner: document.querySelector("#collectionStatusBanner"),
  progressSummary: document.querySelector("#progressSummary"),
  pauseCollectionTop: document.querySelector("#pauseCollectionTop"),
  skipCollectionTop: document.querySelector("#skipCollectionTop"),
  cancelCollectionTop: document.querySelector("#cancelCollectionTop"),
  queueDetails: document.querySelector("#queueDetails"),
  queueBadge: document.querySelector("#queueBadge"),
  queueList: document.querySelector("#queueList"),
  details: document.querySelector("#details"),
  automationState: document.querySelector("#automationState"),
  openSettings: document.querySelector("#openSettings"),
  collapseSidebar: document.querySelector("#collapseSidebar"),
  fitGraphQuick: document.querySelector("#fitGraphQuick"),
  reflowGraphQuick: document.querySelector("#reflowGraphQuick"),
  gridGraphQuick: document.querySelector("#gridGraphQuick"),
  openFiltersQuick: document.querySelector("#openFiltersQuick"),
  exitApp: document.querySelector("#exitApp"),
  closeSettings: document.querySelector("#closeSettings"),
  settingsModal: document.querySelector("#settingsModal"),
  settingsStatus: document.querySelector("#settingsStatus"),
  settingsApiId: document.querySelector("#settingsApiId"),
  settingsApiHash: document.querySelector("#settingsApiHash"),
  settingsPhone: document.querySelector("#settingsPhone"),
  settingsCode: document.querySelector("#settingsCode"),
  settingsPassword: document.querySelector("#settingsPassword"),
  settingsSession: document.querySelector("#settingsSession"),
  loginStepPhone: document.querySelector("#loginStepPhone"),
  loginStepCode: document.querySelector("#loginStepCode"),
  loginStepPassword: document.querySelector("#loginStepPassword"),
  apiIdFlag: document.querySelector("#apiIdFlag"),
  apiHashFlag: document.querySelector("#apiHashFlag"),
  sessionFlag: document.querySelector("#sessionFlag"),
  graphEmptyState: document.querySelector("#graphEmptyState"),
  emptyFocusSeeds: document.querySelector("#emptyFocusSeeds"),
  emptyFocusImport: document.querySelector("#emptyFocusImport"),
  collectPane: document.querySelector("#collectPane"),
  dataPane: document.querySelector("#dataPane"),
  directoryPane: document.querySelector("#directoryPane"),
  directoryStatus: document.querySelector("#directoryStatus"),
  directoryMeta: document.querySelector("#directoryMeta"),
  createDirectory: document.querySelector("#createDirectory"),
  clearDirectory: document.querySelector("#clearDirectory"),
  directoryCount: document.querySelector("#directoryCount"),
  directorySelectedCount: document.querySelector("#directorySelectedCount"),
  directoryTargetPosts: document.querySelector("#directoryTargetPosts"),
  targetUserInput: document.querySelector("#targetUserInput"),
  runTargetAnalysis: document.querySelector("#runTargetAnalysis"),
  clearTargetAnalysis: document.querySelector("#clearTargetAnalysis"),
  targetQueryInput: document.querySelector("#targetQueryInput"),
  targetChatFilter: document.querySelector("#targetChatFilter"),
  targetMembershipFilter: document.querySelector("#targetMembershipFilter"),
  targetActivityFilter: document.querySelector("#targetActivityFilter"),
  directoryList: document.querySelector("#directoryList"),
  targetDashboard: document.querySelector("#targetDashboard")
};

const sidebarMenuButtons = Array.from(document.querySelectorAll("[data-menu-target]"));
const sidebarPanes = Array.from(document.querySelectorAll(".sidebar-pane"));
const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>';
const skipIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 7 7-7 7M13 5l7 7-7 7" /></svg>';
const queueIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>';

const graph = {
  nodes: new Map(),
  edges: new Map(),
  selectedId: null,
  selectedIds: new Set(),
  scanned: new Set(),
  aliases: new Map(),
  queued: new Set()
};

const collection = {
  running: false,
  queue: [],
  current: "",
  controller: null,
  cancelled: false,
  paused: false,
  skipping: false
};

const messageState = {
  nodeId: "",
  items: [],
  nextOffsetId: 0,
  loading: false,
  error: "",
  loaded: false
};

const directoryState = {
  items: [],
  createdAt: "",
  source: "",
  target: null,
  loading: false,
  error: "",
  query: "",
  chatFilter: "all",
  membershipFilter: "all",
  activityFilter: "all",
  messageLimit: 1000
};

const messageLoadTimers = new Map();

const avatarImages = new Map();

const layout = {
  active: false,
  ticks: 0,
  stableFrames: 0,
  maxTicks: 720,
  exactLayoutNodeLimit: 160,
  bucketSize: 360,
  repulsionDistance: 420,
  collisionDistance: 160,
  lastTickAt: 0,
  largeGraphTickMs: 32,
  searchIndex: -1,
  searchTargetId: null
};

const view = {
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  dragNode: null,
  lastX: 0,
  lastY: 0,
  hoverEdge: null,
  hoverX: 0,
  hoverY: 0,
  pointerStartX: 0,
  pointerStartY: 0,
  didDrag: false
};

const time = {
  enabled: false,
  min: 0,
  max: 0,
  current: 0,
  playing: false,
  timer: 0
};

const filters = {
  hideBlankNodes: false,
  hideChatGroups: false,
  hideChannels: false,
  showUserLayer: false,
  nodeSizeMode: "fixed",
  labelDensity: "auto",
  minEdgeWeight: 1,
  communityMode: "off"
};

let detailsMinimized = false;
let membersViewOpen = false;
let detailPanelView = "members";
let detailPanelNodeId = "";

const communityState = {
  signature: "",
  communities: new Map(),
  count: 0
};

const palette = {
  seed: "#39d0b4",
  channel: "#6ba6ff",
  chat: "#f1b95a",
  user: "#d886ff",
  unknown: "#8d99a6",
  forward: "rgba(107, 166, 255, 0.62)",
  associated_chat: "rgba(57, 208, 180, 0.65)",
  telegram_link: "rgba(216, 134, 255, 0.58)",
  recommended: "rgba(241, 185, 90, 0.58)",
  text: "#e8edf2",
  muted: "#8d99a6"
};

const communityPalette = [
  "#6ba6ff",
  "#39d0b4",
  "#f1b95a",
  "#d886ff",
  "#ff7a7a",
  "#8ed16f",
  "#57c7e3",
  "#f48ac2",
  "#c9b66f",
  "#9d9cff",
  "#ff9f66",
  "#6ed6a8"
];

const relationshipLabels = {
  forward: "forwarding",
  associated_chat: "associated chat",
  telegram_link: "t.me link",
  recommended: "recommended"
};

const idleEdgeAlpha = 0.38;

let progressPoll = 0;

const progressSteps = [
  { key: "seed", element: els.progressSeed },
  { key: "bridge", element: els.progressBridge },
  { key: "scan", element: els.progressScan },
  { key: "merge", element: els.progressMerge }
];

function normalizeId(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/t\.me\//i, "@")
    .replace(/^t\.me\//i, "@")
    .replace(/\?.*$/, "");
}

function parseSeedList(value) {
  const seen = new Set();
  const seeds = [];
  for (const item of String(value || "").split(/[\s,]+/)) {
    const seed = normalizeId(item);
    if (!seed || seen.has(seed)) continue;
    seen.add(seed);
    seeds.push(seed);
  }
  return seeds;
}

function labelFromId(id) {
  return id.replace(/^@/, "") || "unknown";
}

function displayLabel(node) {
  return node.label || node.name || node.title || labelFromId(node.id);
}

function meaningfulText(value, node) {
  const text = String(value || "").trim();
  return text && text !== labelFromId(node.id) && text !== node.id;
}

function nodeHasPublicHandle(node) {
  return /^@/.test(node.id) || Boolean(String(node.username || "").trim());
}

function isBlankNode(node) {
  if (!node || node.seed || nodeHasPublicHandle(node)) return false;
  const hasName = [node.label, node.name, node.title, node.profile].some((value) => meaningfulText(value, node));
  const hasImage = Boolean(node.avatarUrl || node.imageUrl || node.avatarImage);
  return !hasName && !hasImage;
}

function timestampMs(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateInputValue(ms) {
  if (!ms) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function fromDateInputValue(value, endOfDay = false) {
  if (!value) return 0;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return timestampMs(`${value}${suffix}`);
}

function formatDateTime(ms) {
  if (!ms) return "undated";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(ms));
}

function edgeTimestamps(edge) {
  const values = [
    ...(Array.isArray(edge.timestamps) ? edge.timestamps : []),
    edge.timestamp,
    edge.forwardedAt,
    edge.firstSeenAt,
    edge.lastSeenAt
  ].map(timestampMs).filter(Boolean);
  return [...new Set(values)].sort((a, b) => a - b);
}

function edgeFirstTime(edge) {
  return edgeTimestamps(edge)[0] || 0;
}

function nodeCreatedTime(node) {
  return timestampMs(node.createdAt || node.creationDate || node.date);
}

function aliasKeysFor(id, attrs = {}) {
  const keys = new Set([normalizeId(id)]);
  const username = attrs.username ? normalizeId(`@${attrs.username}`) : "";
  if (username) keys.add(username);
  if (attrs.url) keys.add(normalizeId(attrs.url));
  return Array.from(keys).filter(Boolean);
}

function canonicalIdFor(id, attrs = {}) {
  for (const key of aliasKeysFor(id, attrs)) {
    const canonical = graph.aliases.get(key);
    if (canonical) return canonical;
  }
  return normalizeId(id);
}

function rewriteNodeId(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const from = graph.nodes.get(fromId);
  const to = graph.nodes.get(toId);
  if (from && to) {
    Object.assign(to, { ...from, ...to, seed: Boolean(from.seed || to.seed) });
    graph.nodes.delete(fromId);
  } else if (from && !to) {
    graph.nodes.delete(fromId);
    from.id = toId;
    graph.nodes.set(toId, from);
  }

  const rewrites = [];
  for (const edge of graph.edges.values()) {
    const nextSource = edge.source === fromId ? toId : edge.source;
    const nextTarget = edge.target === fromId ? toId : edge.target;
    if (nextSource !== edge.source || nextTarget !== edge.target) {
      rewrites.push({ edge, nextSource, nextTarget });
    }
  }
  for (const { edge, nextSource, nextTarget } of rewrites) {
    graph.edges.delete(edge.id);
    if (nextSource === nextTarget) continue;
    edge.source = nextSource;
    edge.target = nextTarget;
    edge.id = `${nextSource}->${nextTarget}:${edge.relationship || "forward"}`;
    const existing = graph.edges.get(edge.id);
    if (existing) {
      existing.weight += edge.weight;
      existing.evidence.push(...(edge.evidence || []));
    } else {
      graph.edges.set(edge.id, edge);
    }
  }

  if (graph.scanned.has(fromId)) {
    graph.scanned.delete(fromId);
    graph.scanned.add(toId);
  }
  if (graph.selectedIds.has(fromId)) {
    graph.selectedIds.delete(fromId);
    graph.selectedIds.add(toId);
  }
  if (graph.queued.has(fromId)) {
    graph.queued.delete(fromId);
    graph.queued.add(toId);
  }
  collection.queue = collection.queue.map((id) => id === fromId ? toId : id);
  if (collection.current === fromId) collection.current = toId;
  if (graph.selectedId === fromId) graph.selectedId = toId;
  for (const [alias, canonical] of graph.aliases.entries()) {
    if (canonical === fromId) graph.aliases.set(alias, toId);
  }
}

function registerAliases(node) {
  for (const key of aliasKeysFor(node.id, node)) {
    const existing = graph.aliases.get(key);
    if (existing && existing !== node.id) rewriteNodeId(existing, node.id);
    graph.aliases.set(key, node.id);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nodeType(id, fallback = "channel") {
  if (/^user:/i.test(id)) return "user";
  if (/^private:/i.test(id)) return "user";
  if (/^chat:/i.test(id)) return "chat";
  if (/^@/.test(id)) return "channel";
  return fallback;
}

function isUserNode(node) {
  return (node?.type || nodeType(node?.id || "")) === "user";
}

function loadAvatar(node) {
  if (!node?.avatarUrl) return;
  const cached = avatarImages.get(node.avatarUrl);
  if (cached) {
    node.avatarImage = cached.complete && cached.naturalWidth ? cached : null;
    return;
  }

  const image = new Image();
  image.onload = () => {
    node.avatarImage = image;
  };
  image.onerror = () => {
    avatarImages.delete(node.avatarUrl);
  };
  image.src = node.avatarUrl;
  avatarImages.set(node.avatarUrl, image);
}

function mergeMembers(current = [], incoming = []) {
  const members = new Map();
  for (const member of [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    if (!member?.id) continue;
    const existing = members.get(member.id) || {};
    const activityCount = Math.max(Number(existing.activityCount || 0), Number(member.activityCount || 0));
    members.set(member.id, {
      ...existing,
      ...member,
      activityCount,
      lastSeenAt: [existing.lastSeenAt, member.lastSeenAt].filter(Boolean).sort().pop() || ""
    });
  }
  return Array.from(members.values())
    .sort((a, b) => (b.activityCount || 0) - (a.activityCount || 0) || String(a.name || a.id).localeCompare(String(b.name || b.id)));
}

function addNode(id, attrs = {}) {
  let normalized = canonicalIdFor(id, attrs);
  if (!normalized) return null;
  for (const key of aliasKeysFor(id, attrs)) {
    const aliased = graph.aliases.get(key);
    if (aliased && aliased !== normalized) {
      rewriteNodeId(aliased, normalized);
    }
  }
  const existing = graph.nodes.get(normalized);
  if (existing) {
    const baseRadius = existing.baseRadius || existing.radius || 22;
    const currentMembers = existing.members || [];
    Object.assign(existing, attrs);
    existing.baseRadius = attrs.baseRadius || baseRadius;
    existing.label = attrs.label || existing.label || labelFromId(normalized);
    existing.name = attrs.name || attrs.profile || attrs.label || existing.name;
    existing.memberCount = attrs.memberCount || attrs.membershipCount || attrs.subscriberCount || existing.memberCount || 0;
    existing.memberAccess = attrs.memberAccess || existing.memberAccess || "";
    existing.memberSampled = Boolean(attrs.memberSampled || existing.memberSampled);
    existing.memberListCount = attrs.memberListCount || attrs.members?.length || existing.memberListCount || 0;
    if (Array.isArray(attrs.members)) existing.members = mergeMembers(currentMembers, attrs.members);
    existing.messageCount = attrs.messageCount || attrs.activityCount || attrs.messages || attrs.postCount || existing.messageCount || 0;
    loadAvatar(existing);
    registerAliases(existing);
    updateNodeRadii();
    return existing;
  }

  const type = attrs.type || nodeType(normalized);
  const radius = type === "user" ? 13 : 18 + Math.min(14, Math.sqrt(graph.nodes.size + 1) * 2);
  const index = graph.nodes.size;
  const angle = index * 2.399963;
  const distance = 120 + Math.sqrt(index + 1) * 72;
  const node = {
    id: normalized,
    label: attrs.label || labelFromId(normalized),
    type,
    seed: Boolean(attrs.seed),
    x: attrs.x ?? Math.cos(angle) * distance,
    y: attrs.y ?? Math.sin(angle) * distance,
    vx: 0,
    vy: 0,
    radius,
    baseRadius: attrs.baseRadius || radius,
    avatarUrl: attrs.avatarUrl || attrs.imageUrl || "",
    avatarImage: null,
    evidence: attrs.evidence || [],
    name: attrs.name || attrs.profile || attrs.label || labelFromId(normalized),
    profile: attrs.profile || attrs.name || attrs.label || labelFromId(normalized),
    username: attrs.username || "",
    title: attrs.title || "",
    description: attrs.description || "",
    url: attrs.url || (normalized.startsWith("@") ? `https://t.me/${normalized.slice(1)}` : ""),
    createdAt: attrs.createdAt || attrs.creationDate || attrs.date || "",
    memberCount: attrs.memberCount || attrs.membershipCount || attrs.subscriberCount || 0,
    memberAccess: attrs.memberAccess || "",
    memberSampled: Boolean(attrs.memberSampled),
    memberListCount: attrs.memberListCount || attrs.members?.length || 0,
    members: Array.isArray(attrs.members) ? mergeMembers([], attrs.members) : [],
    messageCount: attrs.messageCount || attrs.activityCount || attrs.messages || attrs.postCount || 0
  };
  graph.nodes.set(normalized, node);
  loadAvatar(node);
  registerAliases(node);
  updateNodeRadii();
  return node;
}

function addEdge(source, target, attrs = {}) {
  const from = addNode(source, { type: attrs.sourceType });
  const to = addNode(target, { type: attrs.targetType });
  if (!from || !to || from.id === to.id) return null;

  const relationship = attrs.relationship || attrs.type || "forward";
  const key = `${from.id}->${to.id}:${relationship}`;
  const existing = graph.edges.get(key);
  if (existing) {
    const incomingTimes = edgeTimestamps(attrs).map((ms) => new Date(ms).toISOString());
    const seenTimes = new Set(existing.timestamps || []);
    if (incomingTimes.length) {
      existing.timestamps = [...(existing.timestamps || []), ...incomingTimes.filter((item) => !seenTimes.has(item))].sort();
      existing.firstSeenAt = existing.timestamps[0] || existing.firstSeenAt;
      existing.lastSeenAt = existing.timestamps[existing.timestamps.length - 1] || existing.lastSeenAt;
    }
    const incomingEvidence = Array.isArray(attrs.evidence)
      ? attrs.evidence
      : attrs.evidence
        ? [attrs.evidence]
        : [];
    const seenEvidence = new Set(existing.evidence || []);
    existing.evidence.push(...incomingEvidence.filter((item) => !seenEvidence.has(item)));
    existing.weight = Math.max(existing.weight || 0, attrs.weight || 1, existing.timestamps?.length || 0);
    updateNodeRadii();
    return existing;
  }

  const evidence = Array.isArray(attrs.evidence)
    ? attrs.evidence
    : attrs.evidence
      ? [attrs.evidence]
      : [];
  const edge = {
    id: key,
    source: from.id,
    target: to.id,
    relationship,
    weight: attrs.weight || 1,
    evidence
  };
  const timestamps = edgeTimestamps(attrs).map((ms) => new Date(ms).toISOString());
  if (timestamps.length) {
    edge.timestamps = timestamps;
    edge.firstSeenAt = timestamps[0];
    edge.lastSeenAt = timestamps[timestamps.length - 1];
    edge.weight = Math.max(edge.weight, timestamps.length);
  }
  graph.edges.set(key, edge);
  updateNodeRadii();
  return edge;
}

function updateMetrics() {
  syncSelectionWithGraph();
  updateCommunityDetection();
  const visibleNodeCount = visibleNodes().length;
  const visibleEdgeCount = visibleEdges().length;
  els.nodeCount.textContent = visibleNodeCount;
  els.edgeCount.textContent = visibleEdgeCount;
  els.scanCount.textContent = graph.scanned.size;
  if (els.graphEmptyState) {
    els.graphEmptyState.hidden = graph.nodes.size > 0;
  }
  if (els.details) {
    els.details.hidden = graph.nodes.size === 0;
  }
  updateSearchCount();
  renderSelectedActions();
  updateCollectionMeta();
  updateReadabilityLabel();
  refreshTimeControls();
  renderTargetDashboard();
}

function updateReadabilityLabel() {
  if (!els.readabilityLabel) return;
  const weight = Number(filters.minEdgeWeight || 1);
  const density = {
    auto: "automatic label culling",
    priority: "priority labels only",
    all: "all labels",
    none: "labels hidden"
  }[filters.labelDensity] || "automatic label culling";
  els.readabilityLabel.textContent = weight > 1
    ? `Showing links with ${weight}+ observations and ${density}.`
    : `Showing all observed links with ${density}.`;
}

function setAutomationState(value) {
  els.automationState.textContent = value;
  els.automationState.dataset.state = value;
}

function setCollectionBanner(type = "", message = "") {
  if (!els.collectionStatusBanner) return;
  els.collectionStatusBanner.hidden = !message;
  els.collectionStatusBanner.dataset.type = type;
  els.collectionStatusBanner.textContent = message;
}

function setCollectionControls() {
  const running = Boolean(collection.running || collection.current || collection.controller);
  if (els.startCollection) els.startCollection.disabled = running;
  if (els.cancelCollection) els.cancelCollection.hidden = !running;
  if (els.pauseCollectionTop) {
    const canPause = Boolean(running || collection.queue.length || collection.paused);
    els.pauseCollectionTop.disabled = !canPause;
    els.pauseCollectionTop.innerHTML = collection.paused ? playIcon : pauseIcon;
    els.pauseCollectionTop.title = collection.paused ? "Resume collection" : "Pause collection";
    els.pauseCollectionTop.setAttribute("aria-label", collection.paused ? "Resume collection" : "Pause collection");
    els.pauseCollectionTop.classList.toggle("active", collection.paused);
  }
  if (els.skipCollectionTop) {
    const canSkip = Boolean(collection.current || collection.controller);
    els.skipCollectionTop.disabled = !canSkip || collection.cancelled || collection.skipping;
    els.skipCollectionTop.innerHTML = skipIcon;
    els.skipCollectionTop.title = canSkip ? "Skip current channel and continue queue" : "No active channel to skip";
    els.skipCollectionTop.setAttribute("aria-label", els.skipCollectionTop.title);
    els.skipCollectionTop.classList.toggle("active", collection.skipping);
  }
  if (els.cancelCollectionTop) {
    const canCancel = Boolean(running || collection.queue.length || collection.paused);
    els.cancelCollectionTop.disabled = !canCancel || collection.cancelled;
    els.cancelCollectionTop.title = "Cancel collection and clear queue";
    els.cancelCollectionTop.setAttribute("aria-label", els.cancelCollectionTop.title);
  }
}

function throwIfCollectionCancelled() {
  if (collection.cancelled) throw new DOMException("Collection cancelled.", "AbortError");
  if (collection.skipping) throw new DOMException("Collection skipped.", "AbortError");
  if (collection.paused) throw new DOMException("Collection paused.", "AbortError");
}

function updateCollectionMeta() {
  const count = collection.queue.length + (collection.current ? 1 : 0);
  if (els.targetCount) {
    const targetCount = parseSeedList(els.seedInput.value).length;
    els.targetCount.textContent = `${targetCount} target${targetCount === 1 ? "" : "s"}`;
  }
  if (els.queueCount) {
    els.queueCount.textContent = `${count} queued`;
    els.queueCount.classList.toggle("active", count > 0);
  }
  if (els.queueBadge) els.queueBadge.textContent = String(count);
  if (els.queueDetails) els.queueDetails.classList.toggle("active", count > 0);
  renderQueueList();
  setCollectionControls();
  renderSelectedActions();
}

function renderQueueList() {
  if (!els.queueList) return;
  const items = [];
  if (collection.current) items.push({ id: collection.current, state: collection.skipping ? "Skipping" : "Collecting", current: true });
  for (const id of collection.queue) items.push({ id, state: collection.paused ? "Paused" : "Queued", current: false });
  if (!items.length) {
    els.queueList.innerHTML = '<div class="queue-empty">No queued tasks</div>';
    return;
  }
  els.queueList.innerHTML = items.map((item) => `
    <div class="queue-item" role="listitem">
      <span>${escapeHtml(item.id)}</span>
      <small>${escapeHtml(item.state)}</small>
      <button class="queue-item-action" type="button" ${item.current ? "data-skip-current" : `data-remove-queued="${escapeHtml(item.id)}"`}>
        ${item.current ? "Skip" : "Remove"}
      </button>
    </div>
  `).join("");
}

function graphTimeExtent() {
  const values = [];
  for (const node of graph.nodes.values()) {
    const created = nodeCreatedTime(node);
    if (created) values.push(created);
  }
  for (const edge of graph.edges.values()) values.push(...edgeTimestamps(edge));
  if (!values.length) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function selectedTimeWindow() {
  if (!time.enabled) return { start: 0, end: Infinity, current: Infinity };
  const start = fromDateInputValue(els.timeStart.value) || time.min || 0;
  const end = fromDateInputValue(els.timeEnd.value, true) || time.max || Infinity;
  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
    current: time.current || end
  };
}

function edgeInTime(edge, { start, end, current } = selectedTimeWindow()) {
  if (!time.enabled) return true;
  const timestamps = edgeTimestamps(edge);
  if (!timestamps.length) return false;
  return timestamps.some((item) => item >= start && item <= end && item <= current);
}

function visibleEdge(edge, window = selectedTimeWindow()) {
  if (!time.enabled) return edge;
  const timestamps = edgeTimestamps(edge).filter((item) => item >= window.start && item <= window.end && item <= window.current);
  if (!timestamps.length) return null;
  return {
    ...edge,
    weight: timestamps.length,
    timestamps: timestamps.map((item) => new Date(item).toISOString()),
    firstSeenAt: new Date(timestamps[0]).toISOString(),
    lastSeenAt: new Date(timestamps[timestamps.length - 1]).toISOString()
  };
}

function nodePassesFilters(node) {
  if (filters.hideBlankNodes && isBlankNode(node)) return false;
  const type = node.type || nodeType(node.id);
  if (type === "user" && !filters.showUserLayer) return false;
  if (filters.hideChatGroups && type === "chat") return false;
  if (filters.hideChannels && type === "channel") return false;
  return true;
}

function visibleEdges() {
  const window = selectedTimeWindow();
  const shownNodes = new Set(visibleNodes({ includeEdges: false }).map((node) => node.id));
  return Array.from(graph.edges.values())
    .map((edge) => visibleEdge(edge, window))
    .filter((edge) => edge && Number(edge.weight || 1) >= filters.minEdgeWeight && shownNodes.has(edge.source) && shownNodes.has(edge.target))
    .filter(Boolean);
}

function visibleNodes({ includeEdges = true } = {}) {
  const allNodes = Array.from(graph.nodes.values()).filter(nodePassesFilters);
  if (!time.enabled) return allNodes;
  const window = selectedTimeWindow();
  const incident = new Set();
  const edges = includeEdges
    ? visibleEdges()
    : Array.from(graph.edges.values()).map((edge) => visibleEdge(edge, window)).filter(Boolean);
  for (const edge of edges) {
    incident.add(edge.source);
    incident.add(edge.target);
  }
  return allNodes.filter((node) => {
    const created = nodeCreatedTime(node);
    if (created && created <= window.current && created <= window.end && created >= window.start) return true;
    if (created && created <= window.current && incident.has(node.id)) return true;
    return incident.has(node.id);
  });
}

function communitySignature(nodes, edges) {
  const nodePart = nodes.map((node) => node.id).sort().join("|");
  const edgePart = edges
    .map((edge) => {
      const a = edge.source < edge.target ? edge.source : edge.target;
      const b = edge.source < edge.target ? edge.target : edge.source;
      return `${a}>${b}:${Number(edge.weight || 1)}`;
    })
    .sort()
    .join("|");
  return `${filters.communityMode}:${nodePart}::${edgePart}`;
}

function detectLabelPropagationCommunities(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, new Map()]));
  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) continue;
    const weight = Math.max(1, Number(edge.weight || 1));
    adjacency.get(edge.source).set(edge.target, (adjacency.get(edge.source).get(edge.target) || 0) + weight);
    adjacency.get(edge.target).set(edge.source, (adjacency.get(edge.target).get(edge.source) || 0) + weight);
  }

  const labels = new Map(nodes.map((node) => [node.id, node.id]));
  const ordered = nodes.slice().sort((a, b) => a.id.localeCompare(b.id));
  for (let pass = 0; pass < 18; pass += 1) {
    let changed = false;
    for (const node of ordered) {
      const neighbors = adjacency.get(node.id);
      if (!neighbors || !neighbors.size) continue;
      const scores = new Map();
      for (const [neighborId, weight] of neighbors) {
        const label = labels.get(neighborId);
        scores.set(label, (scores.get(label) || 0) + weight);
      }
      const current = labels.get(node.id);
      let bestLabel = current;
      let bestScore = scores.get(current) || 0;
      for (const [label, score] of scores) {
        if (score > bestScore || (score === bestScore && label < bestLabel)) {
          bestLabel = label;
          bestScore = score;
        }
      }
      if (bestLabel !== current) {
        labels.set(node.id, bestLabel);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const counts = new Map();
  for (const label of labels.values()) counts.set(label, (counts.get(label) || 0) + 1);
  const orderedLabels = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label]) => label);
  const indexes = new Map(orderedLabels.map((label, index) => [label, index]));
  const communities = new Map();
  for (const [nodeId, label] of labels) communities.set(nodeId, indexes.get(label) || 0);
  return { communities, count: orderedLabels.length };
}

function updateCommunityDetection() {
  if (filters.communityMode === "off") {
    communityState.signature = "off";
    communityState.communities.clear();
    communityState.count = 0;
    if (els.communityLabel) els.communityLabel.textContent = "community detection off";
    return;
  }

  const nodes = visibleNodes();
  const edges = visibleEdges();
  const signature = communitySignature(nodes, edges);
  if (signature === communityState.signature) return;
  communityState.signature = signature;

  if (nodes.length < 2) {
    communityState.communities.clear();
    communityState.count = nodes.length;
  } else {
    const result = detectLabelPropagationCommunities(nodes, edges);
    communityState.communities = result.communities;
    communityState.count = result.count;
  }

  if (els.communityLabel) {
    const count = communityState.count;
    els.communityLabel.textContent = `${count} communit${count === 1 ? "y" : "ies"} detected across ${nodes.length} visible nodes`;
  }
}

function nodeColor(node) {
  if (filters.communityMode !== "off" && communityState.communities.has(node.id)) {
    const index = communityState.communities.get(node.id) || 0;
    return communityPalette[index % communityPalette.length];
  }
  return node.seed ? palette.seed : palette[node.type] || palette.unknown;
}

function nodeCommunityLabel(node) {
  if (filters.communityMode === "off" || !communityState.communities.has(node.id)) return "";
  return `Community ${(communityState.communities.get(node.id) || 0) + 1}`;
}

function selectedVisibleNodes() {
  const visible = new Set(visibleNodes().map((node) => node.id));
  return Array.from(graph.selectedIds)
    .map((id) => graph.nodes.get(id))
    .filter((node) => node && visible.has(node.id));
}

function syncSelectionWithGraph() {
  const visible = new Set(visibleNodes().map((node) => node.id));
  for (const id of Array.from(graph.selectedIds)) {
    if (!graph.nodes.has(id) || !visible.has(id)) graph.selectedIds.delete(id);
  }
  if (graph.selectedId && (!graph.nodes.has(graph.selectedId) || !visible.has(graph.selectedId))) {
    graph.selectedId = Array.from(graph.selectedIds).pop() || null;
  }
}

function clearSelection() {
  graph.selectedIds.clear();
  graph.selectedId = null;
  membersViewOpen = false;
  renderDetails(null);
}

function directoryEligibleNodes() {
  const selected = selectedVisibleNodes().filter((node) => ["channel", "chat"].includes(node.type || nodeType(node.id)));
  if (selected.length) return { nodes: selected, source: "selection" };
  const visible = visibleNodes().filter((node) => ["channel", "chat"].includes(node.type || nodeType(node.id)));
  return { nodes: visible, source: "visible" };
}

function createDirectoryEntry(node) {
  return {
    id: node.id,
    label: displayLabel(node),
    type: node.type || nodeType(node.id),
    url: nodeUrl(node),
    memberCount: Number(node.memberCount || node.membershipCount || node.subscriberCount || 0),
    memberAccess: node.memberAccess || "",
    messageCount: Number(node.messageCount || node.activityCount || node.messages || node.postCount || 0)
  };
}

function updateDirectoryChatOptions() {
  if (!els.targetChatFilter) return;
  const active = directoryState.chatFilter;
  const chats = directoryState.target?.chats || [];
  const options = ['<option value="all">All chats</option>']
    .concat(chats.map((chat) => `<option value="${escapeHtml(chat.chatId)}">${escapeHtml(chat.chatLabel || chat.chatId)}</option>`));
  els.targetChatFilter.innerHTML = options.join("");
  els.targetChatFilter.value = chats.some((chat) => chat.chatId === active) ? active : "all";
  directoryState.chatFilter = els.targetChatFilter.value;
}

function targetMembershipLabel(chat) {
  if (chat.isMember) return "member";
  if (chat.memberAccess === "restricted" || chat.memberAccess === "error") return "unknown";
  return "not member";
}

function targetChatPassesFilters(chat, query = directoryState.query.trim().toLowerCase()) {
  if (!chat) return false;
  if (directoryState.chatFilter !== "all" && chat.chatId !== directoryState.chatFilter) return false;
  const membership = targetMembershipLabel(chat);
  if (directoryState.membershipFilter !== "all" && membership.replace(" ", "_") !== directoryState.membershipFilter) return false;
  if (directoryState.activityFilter === "active" && !chat.hasActivity) return false;
  if (directoryState.activityFilter === "inactive" && chat.hasActivity) return false;
  if (!query) return true;
  const haystack = [
    chat.chatLabel,
    chat.chatId,
    chat.chatType,
    membership,
    chat.memberAccess,
    chat.error,
    chat.matchedMember?.name,
    chat.matchedMember?.username,
    chat.matchedMember?.id
  ].join(" ").toLowerCase();
  return haystack.includes(query);
}

function filteredTargetChats() {
  const target = directoryState.target;
  if (!target?.chats?.length) return [];
  const query = directoryState.query.trim().toLowerCase();
  return target.chats.filter((chat) => targetChatPassesFilters(chat, query));
}

function filteredTargetPosts() {
  const target = directoryState.target;
  if (!target?.posts?.length) return [];
  const query = directoryState.query.trim().toLowerCase();
  return target.posts.filter((post) => {
    const chat = target.chats.find((item) => item.chatId === post.chatId);
    if (!targetChatPassesFilters(chat, "")) return false;
    if (!query) return true;
    const haystack = [
      post.chatLabel,
      post.chatId,
      post.senderName,
      post.senderUsername,
      post.text,
      ...(Array.isArray(post.urls) ? post.urls : [])
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function renderDirectoryList() {
  if (!els.directoryList) return;
  const items = directoryState.items.slice().sort((a, b) => a.label.localeCompare(b.label));
  if (!items.length) {
    els.directoryList.innerHTML = '<div class="directory-card empty">No directory created yet.</div>';
    return;
  }
  els.directoryList.innerHTML = items.map((item) => `
    <article class="directory-card">
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</span>
      </div>
      <small>${item.memberCount ? `${item.memberCount.toLocaleString()} members` : "member count unavailable"}${item.memberAccess ? ` · ${escapeHtml(item.memberAccess)}` : ""}</small>
    </article>
  `).join("");
}

function renderTargetDashboard() {
  if (!els.targetDashboard) return;
  if (els.directoryCount) els.directoryCount.textContent = String(directoryState.items.length);
  if (els.directorySelectedCount) {
    els.directorySelectedCount.textContent = String(selectedVisibleNodes().filter((node) => ["channel", "chat"].includes(node.type || nodeType(node.id))).length);
  }
  if (els.directoryTargetPosts) els.directoryTargetPosts.textContent = String(directoryState.target?.summary?.postCount || 0);
  if (els.directoryStatus) {
    const state = directoryState.loading
      ? "running"
      : directoryState.target
        ? "done"
        : directoryState.items.length
          ? "queued"
          : "empty";
    els.directoryStatus.textContent = state === "queued" ? "ready" : state;
    els.directoryStatus.dataset.state = state;
  }
  if (els.directoryMeta) {
    const source = directoryState.source ? `${directoryState.source} directory` : "directory";
    const created = directoryState.createdAt ? ` Created ${formatDateTime(timestampMs(directoryState.createdAt))}.` : "";
    const error = directoryState.error ? ` ${directoryState.error}` : "";
    els.directoryMeta.textContent = directoryState.items.length
      ? `${directoryState.items.length} chats/channels loaded from the ${source}.${created}${error}`.trim()
      : "Create a directory from the chats and channels currently visible in the graph, or from the selected group set.";
  }

  renderDirectoryList();
  updateDirectoryChatOptions();

  if (directoryState.loading) {
    els.targetDashboard.innerHTML = '<div class="dashboard-empty">Running target analysis across the current directory.</div>';
    return;
  }
  if (directoryState.error && !directoryState.target) {
    els.targetDashboard.innerHTML = `<div class="dashboard-empty error">${escapeHtml(directoryState.error)}</div>`;
    return;
  }
  if (!directoryState.target) {
    els.targetDashboard.innerHTML = '<div class="dashboard-empty">Run target analysis to collect membership and posts across the directory.</div>';
    return;
  }

  const { target, summary } = directoryState.target;
  const chats = filteredTargetChats();
  const posts = filteredTargetPosts();
  const chatCards = chats.map((chat) => `
    <article class="dashboard-chat-card${chat.error ? " has-error" : ""}">
      <strong>${escapeHtml(chat.chatLabel || chat.chatId)}</strong>
      <span>${escapeHtml(targetMembershipLabel(chat))} · ${chat.postCount.toLocaleString()} posts · ${Number(chat.scannedMessages || 0).toLocaleString()} checked</span>
      <small>${chat.lastPostAt ? `last ${escapeHtml(formatDateTime(timestampMs(chat.lastPostAt)))}` : chat.error ? escapeHtml(chat.error) : escapeHtml(chat.memberAccess || "no member result")}</small>
    </article>
  `).join("");
  const renderedPosts = posts.slice(0, 250);
  const postRows = renderedPosts.map((post) => {
    const links = [...new Set([post.link, ...(Array.isArray(post.urls) ? post.urls : []), post.mediaUrl].filter(Boolean))].slice(0, 3);
    return `
      <article class="dashboard-post-row">
        <div class="dashboard-post-head">
          <strong>${escapeHtml(post.chatLabel || post.chatId)}</strong>
          <span>${escapeHtml(formatDateTime(timestampMs(post.date)))} · #${escapeHtml(String(post.id || ""))}</span>
        </div>
        <div class="dashboard-post-meta">${escapeHtml(messageSenderLine(post))}</div>
        <p>${escapeHtml(messagePreviewText(post))}</p>
        ${links.length ? `<div class="dashboard-post-links">${links.map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`).join("")}</div>` : ""}
      </article>
    `;
  }).join("");
  const hiddenCount = Math.max(0, posts.length - 250);

  els.targetDashboard.innerHTML = `
    <section class="target-summary-grid">
      <div><strong>${escapeHtml(target.name || target.id)}</strong><span>${escapeHtml(target.username ? `@${target.username}` : target.id)}</span></div>
      <div><strong>${summary.membershipCount.toLocaleString()}</strong><span>member chats</span></div>
      <div><strong>${summary.activeChats.toLocaleString()}</strong><span>active chats</span></div>
      <div><strong>${summary.postCount.toLocaleString()}</strong><span>aggregated posts</span></div>
    </section>
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h3>Directory Match Summary</h3>
        <span>${chats.length.toLocaleString()} of ${summary.directoryCount.toLocaleString()} chats · ${Number(summary.scannedMessages || 0).toLocaleString()} messages checked · limit ${Number(summary.messageLimit || directoryState.messageLimit || 0).toLocaleString()}/chat</span>
      </div>
      <div class="dashboard-chat-grid">${chatCards || '<div class="dashboard-empty">No directory chats were analyzed.</div>'}</div>
    </section>
    <section class="dashboard-section">
      <div class="dashboard-section-head">
        <h3>Aggregated Posts</h3>
        <span>${renderedPosts.length.toLocaleString()} shown${hiddenCount ? ` · ${hiddenCount.toLocaleString()} more hidden` : ""}</span>
      </div>
      <div class="dashboard-post-list">${postRows || '<div class="dashboard-empty">No posts matched the current filters.</div>'}</div>
    </section>
  `;
}

function createDirectoryFromGraph() {
  const { nodes, source } = directoryEligibleNodes();
  directoryState.items = nodes.map(createDirectoryEntry)
    .sort((a, b) => a.label.localeCompare(b.label));
  directoryState.createdAt = new Date().toISOString();
  directoryState.source = source;
  directoryState.error = "";
  if (!directoryState.items.length) directoryState.target = null;
  renderTargetDashboard();
}

function nextTargetMessageLimit(limit) {
  if (limit < 1000) return 1000;
  if (limit < 10000) return 10000;
  return limit + 10000;
}

function targetContinueMessage(limit, result) {
  const chats = Number(result?.summary?.limitReachedChats || 0).toLocaleString();
  if (limit < 10000) {
    return `${chats} chats still have more than ${limit.toLocaleString()} messages. Would you like to continue to 10,000 messages per chat?`;
  }
  return `${chats} chats still have more than ${limit.toLocaleString()} messages. Would you like to continue another 10,000 messages per chat?`;
}

async function fetchTargetAnalysis(target, messageLimit) {
  return apiFetch("/api/target", {
    method: "POST",
    body: {
      target,
      messageLimit,
      chats: directoryState.items
    }
  });
}

async function runTargetAnalysis() {
  if (!directoryState.items.length) createDirectoryFromGraph();
  if (!directoryState.items.length) {
    directoryState.error = "No chats or channels are available in the current graph view.";
    renderTargetDashboard();
    return;
  }
  const target = els.targetUserInput.value.trim();
  if (!target) {
    directoryState.error = "Enter a target user before running analysis.";
    renderTargetDashboard();
    return;
  }

  let messageLimit = 1000;
  directoryState.messageLimit = messageLimit;
  directoryState.loading = true;
  directoryState.error = "";
  renderTargetDashboard();
  showSidebarPane("directoryPane");

  try {
    while (true) {
      directoryState.messageLimit = messageLimit;
      directoryState.target = await fetchTargetAnalysis(target, messageLimit);
      directoryState.query = els.targetQueryInput.value.trim();
      renderTargetDashboard();

      if (!directoryState.target?.summary?.limitReached) break;
      if (!window.confirm(targetContinueMessage(messageLimit, directoryState.target))) break;
      messageLimit = nextTargetMessageLimit(messageLimit);
    }
  } catch (error) {
    directoryState.target = null;
    directoryState.error = error.message;
  } finally {
    directoryState.loading = false;
    renderTargetDashboard();
  }
}

function clearDirectoryState(options = {}) {
  directoryState.items = [];
  directoryState.createdAt = "";
  directoryState.source = "";
  directoryState.target = null;
  directoryState.loading = false;
  directoryState.error = "";
  directoryState.query = "";
  directoryState.chatFilter = "all";
  directoryState.membershipFilter = "all";
  directoryState.activityFilter = "all";
  directoryState.messageLimit = 1000;
  if (!options.keepInputs) {
    if (els.targetUserInput) els.targetUserInput.value = "";
    if (els.targetQueryInput) els.targetQueryInput.value = "";
    if (els.targetMembershipFilter) els.targetMembershipFilter.value = "all";
    if (els.targetActivityFilter) els.targetActivityFilter.value = "all";
  }
  renderTargetDashboard();
}

function nodeMetricValue(node, mode = filters.nodeSizeMode) {
  const edges = visibleEdges();
  if (mode === "members") {
    return Number(node.memberCount || node.membershipCount || node.subscriberCount || 0);
  }
  if (mode === "activity") {
    const metadata = Number(node.messageCount || node.activityCount || node.messages || node.postCount || 0);
    if (metadata > 0) return metadata;
    return edges.reduce((sum, edge) => edge.source === node.id || edge.target === node.id ? sum + Number(edge.weight || 1) : sum, 0);
  }
  if (mode === "centrality") {
    return edges.reduce((sum, edge) => edge.source === node.id || edge.target === node.id ? sum + Number(edge.weight || 1) : sum, 0);
  }
  if (mode === "influence") {
    return edges.reduce((sum, edge) => edge.relationship === "forward" && edge.source === node.id ? sum + Number(edge.weight || 1) : sum, 0);
  }
  return 0;
}

function updateNodeRadii() {
  const nodes = Array.from(graph.nodes.values());
  if (!nodes.length) return;
  if (filters.nodeSizeMode === "fixed") {
    for (const node of nodes) node.radius = node.baseRadius || node.radius || 22;
    return;
  }

  const visible = new Set(visibleNodes({ includeEdges: false }).map((node) => node.id));
  const sizedNodes = nodes.filter((node) => visible.has(node.id));
  if (!sizedNodes.length) {
    for (const node of nodes) node.radius = node.baseRadius || node.radius || 22;
    return;
  }
  const values = sizedNodes.map((node) => nodeMetricValue(node));
  const max = Math.max(...values);
  for (const node of nodes) {
    if (!visible.has(node.id)) {
      node.radius = node.baseRadius || node.radius || 22;
    }
  }
  for (let index = 0; index < sizedNodes.length; index += 1) {
    const node = sizedNodes[index];
    const user = isUserNode(node);
    const minRadius = user ? 10 : 16;
    const maxRadius = user ? 24 : 46;
    const value = values[index];
    const scaled = max > 0 ? Math.sqrt(value) / Math.sqrt(max) : 0;
    node.radius = minRadius + scaled * (maxRadius - minRadius);
  }
}

function refreshTimeControls({ reset = false } = {}) {
  const extent = graphTimeExtent();
  const hadExtent = Boolean(time.min && time.max);
  time.min = extent.min;
  time.max = extent.max;
  const hasExtent = Boolean(time.min && time.max);
  els.timeFilterToggle.disabled = !hasExtent;
  els.timeSlider.disabled = !hasExtent || !time.enabled;
  els.timeStart.disabled = !hasExtent || !time.enabled;
  els.timeEnd.disabled = !hasExtent || !time.enabled;
  els.timePlay.disabled = !hasExtent || !time.enabled;

  if (hasExtent && (reset || !hadExtent || !els.timeStart.value || !els.timeEnd.value)) {
    els.timeStart.value = toDateInputValue(time.min);
    els.timeEnd.value = toDateInputValue(time.max);
    time.current = time.max;
  }
  if (!hasExtent) {
    time.current = 0;
    time.enabled = false;
    els.timeFilterToggle.checked = false;
    stopTimelapse();
  }

  const start = fromDateInputValue(els.timeStart.value) || time.min;
  const end = fromDateInputValue(els.timeEnd.value, true) || time.max;
  if (hasExtent) {
    time.current = Math.max(start, Math.min(time.current || end, end));
    const span = Math.max(1, end - start);
    els.timeSlider.value = String(Math.round(((time.current - start) / span) * 100));
    const visibleNodeCount = visibleNodes().length;
    const visibleEdgeCount = visibleEdges().length;
    els.timeLabel.textContent = time.enabled
      ? `${formatDateTime(time.current)} · ${visibleNodeCount} nodes · ${visibleEdgeCount} links`
      : `${formatDateTime(time.min)} to ${formatDateTime(time.max)}`;
  } else {
    els.timeLabel.textContent = "no dated data";
  }
  setTimePlayIcon();
}

function stopTimelapse() {
  if (time.timer) window.clearInterval(time.timer);
  time.timer = 0;
  time.playing = false;
  setTimePlayIcon();
}

function setTimePlayIcon() {
  if (!els.timePlay) return;
  els.timePlay.innerHTML = time.playing ? pauseIcon : playIcon;
  els.timePlay.title = time.playing ? "Pause timelapse" : "Play timelapse";
  els.timePlay.setAttribute("aria-label", els.timePlay.title);
}

function setCurrentFromSlider() {
  const start = fromDateInputValue(els.timeStart.value) || time.min;
  const end = fromDateInputValue(els.timeEnd.value, true) || time.max;
  const percent = Number(els.timeSlider.value) / 100;
  time.current = start + Math.max(0, Math.min(1, percent)) * Math.max(1, end - start);
  refreshTimeControls();
  updateMetrics();
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
}

function refreshGraphView({ fit = false, reflow = false } = {}) {
  updateNodeRadii();
  updateMetrics();
  const selected = graph.selectedId ? graph.nodes.get(graph.selectedId) : null;
  if (selected && !visibleNodes().some((node) => node.id === selected.id)) {
    graph.selectedId = null;
    graph.selectedIds.clear();
    renderDetails(null);
  } else {
    renderDetails(selected || null);
  }
  if (reflow) startLayout({ fit, label: "laying out" });
  else if (fit) fitGraph();
}

function toggleTimelapse() {
  if (!time.enabled || !time.min || !time.max) return;
  if (time.playing) {
    stopTimelapse();
    refreshTimeControls();
    return;
  }
  const start = fromDateInputValue(els.timeStart.value) || time.min;
  const end = fromDateInputValue(els.timeEnd.value, true) || time.max;
  if (time.current >= end) time.current = start;
  time.playing = true;
  setTimePlayIcon();
  const step = Math.max(1, (end - start) / 220);
  time.timer = window.setInterval(() => {
    time.current = Math.min(end, time.current + step);
    if (time.current >= end) stopTimelapse();
    refreshTimeControls();
    updateMetrics();
    renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
  }, 90);
}

function setLayoutActive(active, label = active ? "laying out" : "settled") {
  layout.active = active;
  if (els.layoutState) els.layoutState.textContent = label;
}

function resetNodeVelocity() {
  for (const node of graph.nodes.values()) {
    node.vx = 0;
    node.vy = 0;
  }
}

function startLayout({ fit = false, label = "laying out" } = {}) {
  if (!graph.nodes.size) {
    setLayoutActive(false);
    return;
  }
  layout.ticks = 0;
  layout.stableFrames = 0;
  layout.lastTickAt = 0;
  setLayoutActive(true, label);
  if (fit) fitGraph();
}

function setProgress(activeKey, summary, labels = {}) {
  const activeIndex = Math.max(0, progressSteps.findIndex((step) => step.key === activeKey));
  const finalIndex = ["done", "cancelled"].includes(activeKey) ? progressSteps.length : activeIndex;
  const failed = activeKey === "error";
  const cancelled = activeKey === "cancelled";

  for (let index = 0; index < progressSteps.length; index += 1) {
    const { key, element } = progressSteps[index];
    element.textContent = labels[key] || element.textContent;
    element.classList.toggle("done", !failed && !cancelled && index < finalIndex);
    element.classList.toggle("active", !failed && !cancelled && index === activeIndex && activeKey !== "done");
    element.classList.toggle("error", failed && index === progressSteps.length - 1);
    element.classList.toggle("cancelled", cancelled && index === progressSteps.length - 1);
  }

  const percent = ["done", "cancelled"].includes(activeKey)
    ? 100
    : failed
      ? 100
      : Math.round((activeIndex / Math.max(1, progressSteps.length - 1)) * 100);
  els.progressFill.style.width = `${percent}%`;
  els.progressFill.classList.toggle("error", failed);
  els.progressFill.classList.toggle("cancelled", cancelled);
  els.progressSummary.textContent = summary;
  if (els.progressCard) {
    els.progressCard.classList.toggle("is-idle", activeKey === "seed" && !collection.running && !collection.queue.length);
    els.progressCard.classList.toggle("is-finished", ["done", "error", "cancelled"].includes(activeKey));
  }
}

function minimapMetrics() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.min(220, Math.max(150, rect.width * 0.22));
  const height = Math.min(150, Math.max(104, rect.height * 0.18));
  const margin = rect.width <= 520 ? 10 : 14;
  return {
    width,
    height,
    margin,
    x: rect.width - width - margin,
    y: margin
  };
}

function syncProgressPopupPosition() {
  if (!graphStage) return;
  const { width, height, margin } = minimapMetrics();
  graphStage.style.setProperty("--minimap-width", `${width}px`);
  graphStage.style.setProperty("--progress-popup-top", `${height + margin * 2}px`);
  graphStage.style.setProperty("--progress-popup-right", `${margin}px`);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  syncProgressPopupPosition();
}

function worldFromScreen(x, y) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (x - rect.left - rect.width / 2 - view.x) / view.scale,
    y: (y - rect.top - rect.height / 2 - view.y) / view.scale
  };
}

function screenFromWorld(x, y) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.width / 2 + view.x + x * view.scale,
    y: rect.height / 2 + view.y + y * view.scale
  };
}

function graphBounds(nodes = visibleNodes()) {
  if (!nodes.length) return null;
  const minX = Math.min(...nodes.map((node) => node.x - node.radius));
  const maxX = Math.max(...nodes.map((node) => node.x + node.radius));
  const minY = Math.min(...nodes.map((node) => node.y - node.radius));
  const maxY = Math.max(...nodes.map((node) => node.y + node.radius));
  const padding = 90;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding
  };
}

function visibleWorldBounds() {
  const rect = canvas.getBoundingClientRect();
  return {
    minX: (-rect.width / 2 - view.x) / view.scale,
    maxX: (rect.width / 2 - view.x) / view.scale,
    minY: (-rect.height / 2 - view.y) / view.scale,
    maxY: (rect.height / 2 - view.y) / view.scale
  };
}

function drawMinimap() {
  const nodes = visibleNodes();
  if (!nodes.length) return;

  const rect = canvas.getBoundingClientRect();
  const { width: mapWidth, height: mapHeight, x, y } = minimapMetrics();
  const bounds = graphBounds(nodes);
  if (!bounds) return;

  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
  const innerPadding = 10;
  const innerWidth = mapWidth - innerPadding * 2;
  const innerHeight = mapHeight - innerPadding * 2;
  const mapScale = Math.min(innerWidth / graphWidth, innerHeight / graphHeight);
  const offsetX = x + innerPadding + (innerWidth - graphWidth * mapScale) / 2;
  const offsetY = y + innerPadding + (innerHeight - graphHeight * mapScale) / 2;
  const toMap = (worldX, worldY) => ({
    x: offsetX + (worldX - bounds.minX) * mapScale,
    y: offsetY + (worldY - bounds.minY) * mapScale
  });

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(17, 22, 28, 0.9)";
  ctx.strokeStyle = "rgba(232, 237, 242, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, mapWidth, mapHeight, 8);
  } else {
    ctx.rect(x, y, mapWidth, mapHeight);
  }
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, mapWidth - 2, mapHeight - 2);
  ctx.clip();

  for (const edge of visibleEdges()) {
    const source = graph.nodes.get(edge.source);
    const target = graph.nodes.get(edge.target);
    if (!source || !target) continue;
    const from = toMap(source.x, source.y);
    const to = toMap(target.x, target.y);
    ctx.strokeStyle = palette[edge.relationship] || palette.forward;
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = Math.max(1, Math.min(2.5, Math.log2(edge.weight + 1)));
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  for (const node of nodes) {
    const point = toMap(node.x, node.y);
    const radius = Math.max(2.2, Math.min(5.5, node.radius * mapScale));
    ctx.globalAlpha = graph.scanned.has(node.id) ? 0.95 : 0.55;
    ctx.fillStyle = nodeColor(node);
    traceNodeShape(point, radius, node);
    ctx.fill();
  }

  const visible = visibleWorldBounds();
  const topLeft = toMap(visible.minX, visible.minY);
  const bottomRight = toMap(visible.maxX, visible.maxY);
  const viewportX = Math.max(x + 4, Math.min(x + mapWidth - 4, topLeft.x));
  const viewportY = Math.max(y + 4, Math.min(y + mapHeight - 4, topLeft.y));
  const viewportRight = Math.max(x + 4, Math.min(x + mapWidth - 4, bottomRight.x));
  const viewportBottom = Math.max(y + 4, Math.min(y + mapHeight - 4, bottomRight.y));
  const viewportWidth = Math.max(8, viewportRight - viewportX);
  const viewportHeight = Math.max(8, viewportBottom - viewportY);

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(107, 166, 255, 0.12)";
  ctx.strokeStyle = "rgba(232, 237, 242, 0.88)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
  ctx.setLineDash([]);
  ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
  ctx.restore();

  ctx.restore();
}

function layoutTickInterval(nodeCount) {
  return nodeCount > layout.exactLayoutNodeLimit ? layout.largeGraphTickMs : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function denseGraphSpacing(nodes, edges = visibleEdges()) {
  if (nodes.length < 18) return 1;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const visibleEdgeCount = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).length;
  const averageDegree = (visibleEdgeCount * 2) / Math.max(1, nodes.length);
  const sizePressure = clamp((nodes.length - 48) / 220, 0, 0.38);
  const edgePressure = clamp((averageDegree - 2.2) / 7, 0, 0.55);
  return 1 + sizePressure + edgePressure;
}

function forEachLayoutPair(nodes, maxDistance, callback) {
  if (nodes.length <= layout.exactLayoutNodeLimit) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        callback(nodes[i], nodes[j]);
      }
    }
    return;
  }

  const buckets = new Map();
  const cellSize = Math.max(1, maxDistance || layout.bucketSize);
  const maxDistanceSq = maxDistance ? maxDistance * maxDistance : Infinity;
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const cellX = Math.floor(node.x / cellSize);
    const cellY = Math.floor(node.y / cellSize);
    const key = `${cellX},${cellY}`;
    const bucket = buckets.get(key);
    const item = { node, index, cellX, cellY };
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  const neighborRange = Math.max(1, Math.ceil((maxDistance || cellSize) / cellSize));
  for (const bucket of buckets.values()) {
    for (const item of bucket) {
      for (let offsetX = -neighborRange; offsetX <= neighborRange; offsetX += 1) {
        for (let offsetY = -neighborRange; offsetY <= neighborRange; offsetY += 1) {
          const neighbors = buckets.get(`${item.cellX + offsetX},${item.cellY + offsetY}`);
          if (!neighbors) continue;
          for (const other of neighbors) {
            if (other.index <= item.index) continue;
            const dx = item.node.x - other.node.x;
            const dy = item.node.y - other.node.y;
            if (dx * dx + dy * dy > maxDistanceSq) continue;
            callback(item.node, other.node);
          }
        }
      }
    }
  }
}

function applyNodeRepulsion(nodes, spacing = 1) {
  forEachLayoutPair(nodes, layout.repulsionDistance * spacing, (a, b) => {
    const dx = a.x - b.x || 0.01;
    const dy = a.y - b.y || 0.01;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    const minDistance = a.radius + b.radius + 96 * spacing;
    const force = Math.min(24 * spacing, Math.max(0.12, (minDistance * minDistance * 1.8) / Math.max(250, distSq)));
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  });
}

function resolveNodeOverlaps(nodes, maxSpeed, spacing = 1) {
  forEachLayoutPair(nodes, layout.collisionDistance * spacing, (a, b) => {
    const dx = b.x - a.x || 0.01;
    const dy = b.y - a.y || 0.01;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const minDistance = a.radius + b.radius + 34 * spacing;
    if (dist >= minDistance) return;
    const shift = (minDistance - dist) * 0.5;
    const sx = (dx / dist) * shift;
    const sy = (dy / dist) * shift;
    a.x -= sx;
    a.y -= sy;
    b.x += sx;
    b.y += sy;
    maxSpeed = Math.max(maxSpeed, shift);
  });
  return maxSpeed;
}

function tick(timestamp = 0) {
  if (!layout.active) return;
  const nodes = visibleNodes();
  const edges = visibleEdges();
  if (!nodes.length) {
    setLayoutActive(false);
    return;
  }

  const tickInterval = layoutTickInterval(nodes.length);
  if (tickInterval && timestamp && layout.lastTickAt && timestamp - layout.lastTickAt < tickInterval) {
    return;
  }
  layout.lastTickAt = timestamp || performance.now();

  const spacing = denseGraphSpacing(nodes, edges);
  applyNodeRepulsion(nodes, spacing);

  for (const edge of edges) {
    const a = graph.nodes.get(edge.source);
    const b = graph.nodes.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const desired = a.radius + b.radius + 180 * spacing + Math.min(140, Math.log2(edge.weight + 1) * 18 * spacing);
    const force = (dist - desired) * 0.006;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  const centerPull = Math.max(0.00045, (0.003 - nodes.length * 0.00002) / spacing);
  let maxSpeed = 0;
  for (const node of nodes) {
    node.vx -= node.x * centerPull;
    node.vy -= node.y * centerPull;
    node.vx *= 0.72;
    node.vy *= 0.72;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    const capped = Math.min(speed || 1, 14);
    if (speed > capped) {
      node.vx = (node.vx / speed) * capped;
      node.vy = (node.vy / speed) * capped;
    }
    node.x += node.vx;
    node.y += node.vy;
    maxSpeed = Math.max(maxSpeed, Math.sqrt(node.vx * node.vx + node.vy * node.vy));
  }

  for (let pass = 0; pass < 2; pass += 1) {
    maxSpeed = resolveNodeOverlaps(nodes, maxSpeed, spacing);
  }

  layout.ticks += 1;
  layout.stableFrames = maxSpeed < 0.18 ? layout.stableFrames + 1 : 0;
  if (layout.stableFrames > 45 || layout.ticks >= layout.maxTicks) {
    resetNodeVelocity();
    setLayoutActive(false);
  }
}

function drawArrow(from, to, edge) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const start = screenFromWorld(from.x + ux * from.radius, from.y + uy * from.radius);
  const end = screenFromWorld(to.x - ux * to.radius, to.y - uy * to.radius);
  const width = Math.min(5, 1 + Math.log2(edge.weight + 1));
  const color = palette[edge.relationship] || palette.forward;
  const selected = new Set(graph.selectedIds);
  if (graph.selectedId) selected.add(graph.selectedId);
  const hasSelection = selected.size > 0;
  const connectedToSelection = selected.has(edge.source) || selected.has(edge.target);

  ctx.globalAlpha = hasSelection
    ? connectedToSelection ? 0.92 : 0.08
    : idleEdgeAlpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (edge.relationship === "recommended") ctx.setLineDash([7, 6]);
  if (edge.relationship === "associated_chat") ctx.setLineDash([2, 5]);
  if (edge.relationship === "telegram_link") ctx.setLineDash([10, 4, 2, 4]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - ux * 11 - uy * 5, end.y - uy * 11 + ux * 5);
  ctx.lineTo(end.x - ux * 11 + uy * 5, end.y - uy * 11 - ux * 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function nodeDisplayName(id) {
  const node = graph.nodes.get(id);
  return node ? displayLabel(node) : id;
}

function nodeSearchText(node) {
  return [displayLabel(node), node.username, node.id, node.title, node.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function edgeDescription(edge) {
  const source = nodeDisplayName(edge.source);
  const target = nodeDisplayName(edge.target);
  const count = Number(edge.weight || 1).toLocaleString();
  const timing = edge.lastSeenAt ? `, last ${formatDateTime(timestampMs(edge.lastSeenAt))}` : "";
  if (edge.relationship === "forward") {
    return `${count} forward${Number(edge.weight || 1) === 1 ? "" : "s"} from ${source} into ${target}${timing}`;
  }
  if (edge.relationship === "associated_chat") {
    return `${target} is the linked chat for ${source}`;
  }
  if (edge.relationship === "telegram_link") {
    return `${source} links to ${target} in a bio or message`;
  }
  if (edge.relationship === "recommended") {
    return `${target} was suggested as similar to ${source}`;
  }
  return `${source} -> ${target}: ${relationshipLabels[edge.relationship] || edge.relationship || "relationship"}`;
}

function drawEdgeTooltip() {
  const edge = view.hoverEdge;
  if (!edge) return;
  const text = edgeDescription(edge);
  ctx.save();
  ctx.font = "12px Inter, system-ui, sans-serif";
  const paddingX = 10;
  const paddingY = 7;
  const maxWidth = 320;
  const textWidth = Math.min(maxWidth, ctx.measureText(text).width);
  const width = textWidth + paddingX * 2;
  const height = 32;
  const rect = canvas.getBoundingClientRect();
  const x = Math.min(rect.width - width - 10, Math.max(10, view.hoverX + 14));
  const y = Math.min(rect.height - height - 10, Math.max(10, view.hoverY + 14));
  ctx.fillStyle = "rgba(17, 22, 28, 0.96)";
  ctx.strokeStyle = "rgba(232, 237, 242, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, 7);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + height / 2, maxWidth);
  ctx.restore();
}

function drawNodeAvatar(node, point, radius) {
  if (!node.avatarImage) return false;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(1, radius - 3), 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(node.avatarImage, point.x - radius, point.y - radius, radius * 2, radius * 2);
  ctx.restore();
  return true;
}

function traceRoundedRect(x, y, width, height, radius) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function traceNodeShape(point, radius, nodeOrUser = false) {
  const type = typeof nodeOrUser === "object"
    ? nodeOrUser.type || nodeType(nodeOrUser.id)
    : nodeOrUser
      ? "user"
      : "channel";
  ctx.beginPath();
  if (type === "user") {
    ctx.moveTo(point.x, point.y - radius);
    ctx.lineTo(point.x + radius, point.y);
    ctx.lineTo(point.x, point.y + radius);
    ctx.lineTo(point.x - radius, point.y);
    ctx.closePath();
    return;
  }
  if (type === "chat") {
    const size = radius * 1.74;
    traceRoundedRect(point.x - size / 2, point.y - size / 2, size, size, Math.max(5, radius * 0.34));
    return;
  }
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
}

function selectedNeighborIds() {
  if (!graph.selectedIds.size && !graph.selectedId) return null;
  const selected = new Set(graph.selectedIds);
  if (graph.selectedId) selected.add(graph.selectedId);
  const related = new Set(selected);
  for (const edge of visibleEdges()) {
    if (selected.has(edge.source)) related.add(edge.target);
    if (selected.has(edge.target)) related.add(edge.source);
  }
  return related;
}

function shouldDrawNodeLabel(node, context) {
  if (filters.labelDensity === "none") return context.selected || context.matches || context.activeSearch;
  if (filters.labelDensity === "all") return true;
  if (context.selected || context.matches || context.activeSearch || node.seed) return true;
  const nodeCount = context.nodeCount || 0;
  const degree = context.degree || 0;
  if (filters.labelDensity === "priority") return degree >= Math.max(2, context.degreeCutoff);
  if (view.scale < 0.42 && nodeCount > 28) return false;
  if (nodeCount > 140) return degree >= context.degreeCutoff + 2;
  if (nodeCount > 80) return degree >= context.degreeCutoff || graph.scanned.has(node.id);
  if (nodeCount > 42) return degree >= Math.max(1, context.degreeCutoff - 1) || graph.scanned.has(node.id);
  return true;
}

function drawNodeLabel(text, point, radius, emphasis = false) {
  const label = text.length > 30 ? `${text.slice(0, 29)}...` : text;
  ctx.save();
  ctx.font = `${emphasis ? 700 : 600} 12px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(230, ctx.measureText(label).width + 14);
  const height = 22;
  const x = point.x - width / 2;
  const y = point.y + radius + 14;
  ctx.fillStyle = "rgba(6, 10, 13, 0.78)";
  ctx.strokeStyle = "rgba(232, 237, 242, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, width, height, 6);
  else ctx.rect(x, y, width, height);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.text;
  ctx.fillText(label, point.x, y + height / 2, width - 10);
  ctx.restore();
}

function draw(timestamp) {
  tick(timestamp);
  updateCommunityDetection();
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  const nodes = visibleNodes();
  const edges = visibleEdges();
  const relatedToSelection = selectedNeighborIds();
  const degrees = new Map();
  for (const edge of edges) {
    const weight = Number(edge.weight || 1);
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + weight);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + weight);
  }
  const sortedDegrees = Array.from(degrees.values()).sort((a, b) => a - b);
  const degreeCutoff = sortedDegrees.length
    ? sortedDegrees[Math.max(0, Math.floor(sortedDegrees.length * 0.72))]
    : 0;

  for (const edge of edges) {
    const from = graph.nodes.get(edge.source);
    const to = graph.nodes.get(edge.target);
    if (from && to) drawArrow(from, to, edge);
  }

  const query = els.searchInput.value.trim().toLowerCase();
  const shownNodes = new Set(nodes.map((node) => node.id));
  if (layout.searchTargetId) shownNodes.add(layout.searchTargetId);
  for (const node of graph.nodes.values()) {
    if (!shownNodes.has(node.id)) continue;
    const point = screenFromWorld(node.x, node.y);
    const color = nodeColor(node);
    const nodeLabel = displayLabel(node);
    const matches = query && nodeSearchText(node).includes(query);
    const activeSearch = layout.searchTargetId === node.id;
    const radius = node.radius * view.scale;
    const collected = graph.scanned.has(node.id);
    const user = isUserNode(node);
    const related = !relatedToSelection || relatedToSelection.has(node.id);

    ctx.shadowColor = color;
    const selected = graph.selectedId === node.id || graph.selectedIds.has(node.id);
    ctx.shadowBlur = selected || activeSearch || matches ? 22 : 8;
    ctx.fillStyle = color;
    ctx.globalAlpha = related ? collected ? 1 : 0.64 : 0.18;
    traceNodeShape(point, radius, node);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (!user && node.avatarImage) drawNodeAvatar(node, point, radius);

    ctx.lineWidth = activeSearch ? 4 : selected ? 3 : collected ? 2 : 1.5;
    ctx.strokeStyle = activeSearch
      ? "#f1b95a"
      : selected
        ? "#ffffff"
        : collected
          ? "#39d0b4"
          : "rgba(232,237,242,0.36)";
    if (!collected) ctx.setLineDash([5, 4]);
    ctx.globalAlpha = related ? 1 : 0.24;
    traceNodeShape(point, collected ? radius + 3 : radius + 2, node);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    if (user) {
      ctx.fillStyle = "rgba(8, 12, 16, 0.72)";
      traceNodeShape(point, Math.max(4, radius * 0.38), true);
      ctx.fill();
    }

    if (related && shouldDrawNodeLabel(node, {
      activeSearch,
      degree: degrees.get(node.id) || 0,
      degreeCutoff,
      matches,
      nodeCount: nodes.length,
      selected
    })) {
      drawNodeLabel(nodeLabel, point, radius, selected || activeSearch || matches);
    }
  }

  drawMinimap();
  drawEdgeTooltip();
  requestAnimationFrame(draw);
}

function pickNode(clientX, clientY) {
  const world = worldFromScreen(clientX, clientY);
  let picked = null;
  for (const node of visibleNodes()) {
    const dx = world.x - node.x;
    const dy = world.y - node.y;
    if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 4) picked = node;
  }
  return picked;
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
}

function pickEdge(clientX, clientY) {
  const world = worldFromScreen(clientX, clientY);
  let picked = null;
  let best = Infinity;
  for (const edge of visibleEdges()) {
    const source = graph.nodes.get(edge.source);
    const target = graph.nodes.get(edge.target);
    if (!source || !target) continue;
    const distance = distanceToSegment(world, source, target);
    const threshold = Math.max(10, 7 / view.scale);
    if (distance < threshold && distance < best) {
      best = distance;
      picked = edge;
    }
  }
  return picked;
}

function resetMessageState(nodeId = "") {
  messageState.nodeId = nodeId;
  messageState.items = [];
  messageState.nextOffsetId = 0;
  messageState.loading = false;
  messageState.error = "";
  messageState.loaded = false;
}

function canLoadMessagesForNode(node) {
  if (!node?.id) return false;
  if (node.id.startsWith("private:") || node.id.startsWith("user:")) return false;
  const type = node.type && node.type !== "unknown" ? node.type : nodeType(node.id);
  return ["channel", "chat"].includes(type);
}

function messagePreviewText(message) {
  if (message.text) return message.text;
  if (message.hasMedia) return `[${message.mediaType || "media"}]`;
  return "[no text]";
}

function initialsForName(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "?";
}

function messageSenderLine(message, node = null) {
  const username = message.senderUsername
    ? `@${String(message.senderUsername).replace(/^@/, "")}`
    : "";
  const name = message.senderName || (node ? displayLabel(node) : "") || "Unknown sender";
  return [name, username].filter(Boolean).join(" ");
}

function renderMessageList(node) {
  const loadable = canLoadMessagesForNode(node);
  const ownsState = messageState.nodeId === node.id;
  const loading = ownsState && messageState.loading;
  const loaded = ownsState && messageState.loaded;
  const error = ownsState ? messageState.error : "";
  const items = ownsState ? messageState.items : [];
  const canPage = loadable && ownsState && Boolean(messageState.nextOffsetId) && !loading;
  const status = error
    ? `<p class="message-status error">${escapeHtml(error)}</p>`
    : loading
    ? '<p class="message-status">Loading messages...</p>'
    : loaded
    ? `<p class="message-status">${items.length ? `${items.length} messages loaded` : "No messages returned for this chat."}</p>`
    : loadable
    ? '<p class="message-status">Load recent messages for this channel or chat.</p>'
    : '<p class="message-status">Messages are available for Telegram channels and chats.</p>';
  const rows = items
    .map((message) => {
      const meta = [
        message.date ? formatDateTime(timestampMs(message.date)) : "",
        message.views ? `${Number(message.views).toLocaleString()} views` : "",
        message.forwards ? `${Number(message.forwards).toLocaleString()} forwards` : ""
      ].filter(Boolean).join(" · ");
      const link = message.link
        ? `<a href="${escapeHtml(message.link)}" target="_blank" rel="noreferrer">Open</a>`
        : "";
      const mediaLinks = [
        message.mediaUrl,
        ...(Array.isArray(message.urls) ? message.urls : [])
      ].filter(Boolean);
      const uniqueMediaLinks = [...new Set(mediaLinks)].slice(0, 3);
      const mediaHtml = uniqueMediaLinks.length
        ? `<div class="message-media-links">${uniqueMediaLinks.map((url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`).join("")}</div>`
        : "";
      const senderAvatar = message.senderAvatarUrl
        ? `<img src="${escapeHtml(message.senderAvatarUrl)}" alt="" />`
        : `<span>${escapeHtml(initialsForName(message.senderName || displayLabel(node)))}</span>`;
      const mediaLabel = message.hasMedia
        ? `<span class="message-media-badge">${escapeHtml(message.mediaTitle || message.mediaType || "media")}</span>`
        : "";
      const messageClass = message.hasMedia ? " has-media" : "";
      return `
        <article class="message-row${messageClass}">
          <div class="message-avatar">${senderAvatar}</div>
          <div class="message-content">
            <div class="message-row-head">
              <div>
                <strong>${escapeHtml(messageSenderLine(message, node))}</strong>
                <span>${escapeHtml(meta || "message metadata unavailable")}</span>
              </div>
              <div class="message-row-actions">
                <span class="message-id">#${escapeHtml(String(message.id || ""))}</span>
                ${link}
              </div>
            </div>
            <p>${escapeHtml(messagePreviewText(message))}</p>
            ${mediaLabel}
            ${mediaHtml}
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="message-panel">
      <div class="message-panel-head">
        <div>
          <h3>Messages</h3>
        </div>
        ${renderDetailPanelSwitch("messages", node)}
        <div class="message-actions">
          <button class="detail-action secondary-action" data-load-messages="${escapeHtml(node.id)}" ${loading || !loadable ? "disabled" : ""}>${loaded ? "Refresh" : "Load Recent"}</button>
          <button class="detail-action secondary-action" data-page-messages="${escapeHtml(node.id)}" ${canPage ? "" : "disabled"}>Older</button>
        </div>
      </div>
      ${status}
      ${rows ? `<div class="message-list">${rows}</div>` : ""}
    </section>
  `;
}

function renderSelectedActions() {
  if (!els.selectedActions) return;
  const selected = selectedVisibleNodes();
  const count = selected.length;
  els.selectedActions.hidden = count === 0;
  if (!count) return;
  els.selectedCount.textContent = `${count} selected`;
  const ids = selected.map((node) => node.id);
  const allQueued = ids.every((id) => graph.queued.has(id) || collection.current === id);
  const hasMembers = selected.some((node) => Array.isArray(node.members) && node.members.length);
  els.selectedMap.disabled = false;
  els.selectedQueue.disabled = allQueued;
  if (els.selectedMembers) {
    els.selectedMembers.hidden = count < 2;
    els.selectedMembers.disabled = count < 2 || !hasMembers;
    els.selectedMembers.textContent = membersViewOpen ? "Graph" : "Members";
  }
  els.selectedExportCsv.disabled = false;
  els.selectedDelete.disabled = false;
  els.selectedClear.disabled = false;
}

function memberDisplayName(member) {
  const username = member.username ? `@${String(member.username).replace(/^@/, "")}` : "";
  return [member.name || member.id, username].filter(Boolean).join(" ");
}

function hasMemberResults(node) {
  if (!node) return false;
  return Boolean((Array.isArray(node.members) && node.members.length)
    || node.memberListCount
    || node.memberAccess
    || node.memberSampled);
}

function memberAccessText(node) {
  const access = node?.memberAccess || "";
  if (access === "full") return "Full exposed list collected";
  if (access === "limited") return "List reached collection limit";
  if (access === "partial") return "Partial list collected";
  if (access === "restricted") return "Member list restricted";
  if (access === "not_applicable") return "Members not applicable";
  if (hasMemberResults(node)) return "Member data collected";
  return "Not collected yet";
}

function memberStats(node) {
  const members = Array.isArray(node?.members) ? node.members : [];
  const listed = Number(node?.memberListCount || members.length || 0);
  const total = Number(node?.memberCount || node?.membershipCount || node?.subscriberCount || 0);
  const active = members.filter((member) => Number(member.activityCount || 0) > 0).length;
  const admins = members.filter((member) => ["creator", "admin"].includes(member.role)).length;
  return { members, listed, total, active, admins };
}

function renderMemberRows(rows, options = {}) {
  const selectedCount = options.selectedCount || 1;
  const limit = options.limit || 160;
  const empty = options.empty || "No member data collected yet.";
  const rowHtml = rows.slice(0, limit).map((row) => {
    const member = row.member || row;
    const groups = row.groups?.map((group) => displayLabel(group)).join(", ") || "";
    const role = member.role && member.role !== "member" ? member.role : "";
    const groupLine = row.groups
      ? `${row.groups.length}/${selectedCount} groups · ${groups}`
      : [role, member.joinedAt ? `joined ${formatDateTime(timestampMs(member.joinedAt))}` : ""].filter(Boolean).join(" · ");
    const activityCount = Number(row.activityCount ?? member.activityCount ?? 0);
    const activityLevel = member.activityLevel ? ` · ${member.activityLevel}` : "";
    const activity = activityCount
      ? `${activityCount.toLocaleString()} observed message${activityCount === 1 ? "" : "s"}${activityLevel}`
      : "no observed activity";
    const lastSeen = (row.lastSeenAt || member.lastSeenAt) ? ` · last ${formatDateTime(timestampMs(row.lastSeenAt || member.lastSeenAt))}` : "";
    const name = member.url
      ? `<a href="${escapeHtml(member.url)}" target="_blank" rel="noreferrer">${escapeHtml(memberDisplayName(member))}</a>`
      : escapeHtml(memberDisplayName(member));
    return `
      <div class="member-row ${row.groups?.length > 1 ? "overlap" : ""}">
        <strong>${name}</strong>
        ${groupLine ? `<span>${escapeHtml(groupLine)}</span>` : ""}
        <small>${escapeHtml([row.groups ? role : "", activity].filter(Boolean).join(" · "))}${escapeHtml(lastSeen)}</small>
      </div>
    `;
  }).join("");
  const remainder = rows.length > limit
    ? `<div class="member-row muted-row">${(rows.length - limit).toLocaleString()} more member${rows.length - limit === 1 ? "" : "s"} not shown.</div>`
    : "";
  return rowHtml ? rowHtml + remainder : `<div class="member-row muted-row">${escapeHtml(empty)}</div>`;
}

function renderDetailPanelSwitch(active, node) {
  const loadable = canLoadMessagesForNode(node);
  return `
    <div class="detail-panel-switch" role="tablist" aria-label="Detail view">
      <button type="button" class="${active === "members" ? "active" : ""}" data-detail-view="members">Members</button>
      <button type="button" class="${active === "messages" ? "active" : ""}" data-detail-view="messages" ${loadable ? "" : "disabled"}>Messages</button>
    </div>
  `;
}

function selectedMemberOverlap(nodes) {
  const rows = new Map();
  for (const node of nodes) {
    for (const member of node.members || []) {
      if (!member?.id) continue;
      const row = rows.get(member.id) || {
        id: member.id,
        member,
        groups: [],
        activityCount: 0,
        lastSeenAt: ""
      };
      row.groups.push(node);
      row.member = { ...row.member, ...member };
      row.activityCount += Number(member.activityCount || 0);
      if (member.lastSeenAt && (!row.lastSeenAt || member.lastSeenAt > row.lastSeenAt)) row.lastSeenAt = member.lastSeenAt;
      rows.set(member.id, row);
    }
  }
  return Array.from(rows.values())
    .sort((a, b) => b.groups.length - a.groups.length || b.activityCount - a.activityCount || memberDisplayName(a.member).localeCompare(memberDisplayName(b.member)));
}

function renderMemberOverlapPanel(nodes) {
  const rows = selectedMemberOverlap(nodes);
  const shared = rows.filter((row) => row.groups.length > 1);
  const selectedCount = nodes.length;
  const access = nodes
    .map((node) => {
      const count = node.members?.length || 0;
      const status = node.memberAccess || (count ? "partial" : "uncollected");
      return `<span>${escapeHtml(displayLabel(node))}: ${count.toLocaleString()} listed, ${escapeHtml(status)}</span>`;
    })
    .join("");
  const rowHtml = renderMemberRows(rows, {
    selectedCount,
    empty: "No member data collected for the selected groups yet."
  });

  return `
    <section class="members-panel">
      <div class="members-panel-head">
        <div>
          <h3>Members</h3>
          <p>${shared.length.toLocaleString()} overlapping member${shared.length === 1 ? "" : "s"} across ${selectedCount} selected groups.</p>
        </div>
        <button class="detail-action secondary-action" type="button" data-toggle-members-view>Graph Details</button>
      </div>
      <div class="member-access-list">${access}</div>
      <div class="member-list">${rowHtml}</div>
    </section>
  `;
}

function renderNodeMembersPanel(node) {
  const stats = memberStats(node);
  const collected = graph.scanned.has(node.id);
  const queued = graph.queued.has(node.id) || collection.current === node.id;
  const accessClass = node.memberAccess || (stats.listed ? "partial" : "uncollected");
  const rows = stats.members
    .slice()
    .sort((a, b) => {
      const roleScore = (role) => role === "creator" ? 0 : role === "admin" ? 1 : 2;
      return roleScore(a.role) - roleScore(b.role)
        || Number(b.activityCount || 0) - Number(a.activityCount || 0)
        || memberDisplayName(a).localeCompare(memberDisplayName(b));
    });
  const statItems = [
    ["Total", stats.total ? stats.total.toLocaleString() : "unknown"],
    ["Listed", stats.listed.toLocaleString()],
    ["Active", stats.active.toLocaleString()],
    ["Admins", stats.admins.toLocaleString()]
  ].map(([label, value]) => `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  const status = stats.listed
    ? `${stats.listed.toLocaleString()} listed member${stats.listed === 1 ? "" : "s"} available for review.`
    : collected
    ? memberAccessText(node)
    : "Map this group or channel to collect the exposed member list.";
  const action = queued
    ? '<button class="detail-action secondary-action" type="button" disabled>Queued</button>'
    : `<button class="detail-action" type="button" data-map-selected="${escapeHtml(node.id)}">${collected ? "Collect Again" : "Map Members"}</button>`;

  return `
    <section class="members-panel">
      <div class="members-panel-head">
        <div>
          <h3>Member Results</h3>
          <p>${escapeHtml(status)}</p>
        </div>
        ${renderDetailPanelSwitch("members", node)}
      </div>
      <div class="member-summary-grid">${statItems}</div>
      <div class="member-access-list">
        <span data-access="${escapeHtml(accessClass)}">${escapeHtml(memberAccessText(node))}</span>
        ${node.memberSampled ? "<span>sampled</span>" : ""}
      </div>
      <div class="member-panel-actions">${action}</div>
      <div class="member-list">${renderMemberRows(rows, { empty: collected ? "No exposed members were returned for this target." : "No member data collected yet." })}</div>
    </section>
  `;
}

function renderDetails(node) {
  syncSelectionWithGraph();
  renderSelectedActions();
  els.details.classList.toggle("minimized", detailsMinimized);
  const minimizeLabel = detailsMinimized ? "Restore details" : "Minimize details";
  const minimizeIcon = detailsMinimized ? "□" : "−";
  if (!node) {
    els.details.innerHTML = `
      <div class="detail-heading">
        <div class="detail-title">
          <h2>No node selected</h2>
        </div>
        <button class="icon-button detail-minimize" type="button" data-toggle-details title="${minimizeLabel}" aria-label="${minimizeLabel}">${minimizeIcon}</button>
      </div>
      <p>Click a node to inspect details. Shift-click, Ctrl-click, or Cmd-click to select multiple nodes.</p>
    `;
    return;
  }
  const selectedNodes = selectedVisibleNodes();
  const actionIds = selectedNodes.length > 1 ? selectedNodes.map((item) => item.id) : [node.id];
  const actionSummary = selectedNodes.length > 1 ? `${selectedNodes.length} selected` : "";
  if (detailPanelNodeId !== node.id) {
    detailPanelNodeId = node.id;
    detailPanelView = hasMemberResults(node) ? "members" : "messages";
  }
  if (selectedNodes.length < 2) membersViewOpen = false;
  if (membersViewOpen && selectedNodes.length > 1) {
    const actionIdsAttr = escapeHtml(actionIds.join(","));
    els.details.innerHTML = `
      <div class="detail-heading">
        <div class="detail-title">
          <h2>Selected Member Overlap</h2>
        </div>
        <div class="detail-header-actions">
          <div class="detail-actions">
            <button class="detail-action" data-map-selected="${actionIdsAttr}">Map</button>
            <button class="detail-action secondary-action" data-queue-selected="${actionIdsAttr}">Queue</button>
            <button class="detail-action danger-action" data-delete-selected="${actionIdsAttr}">Delete</button>
          </div>
          <button class="icon-button detail-minimize" type="button" data-toggle-details title="${minimizeLabel}" aria-label="${minimizeLabel}">${minimizeIcon}</button>
        </div>
      </div>
      <p class="selection-summary">${escapeHtml(actionSummary)}</p>
      <div class="detail-body members-only">
        ${renderMemberOverlapPanel(selectedNodes)}
      </div>
    `;
    return;
  }

  const detailEdges = visibleEdges();
  const incoming = detailEdges.filter((edge) => edge.target === node.id);
  const outgoing = detailEdges.filter((edge) => edge.source === node.id);
  const collected = graph.scanned.has(node.id);
  const queued = graph.queued.has(node.id) || collection.current === node.id;
  const collectionState = collected ? "collected" : "not collected";
  const actionLabel = selectedNodes.length > 1 ? "Map" : collected ? "Collect Again" : "Map";
  const queueLabel = collection.current === node.id ? "Mapping" : queued ? "Queued" : "Queue";
  const actionIdsAttr = escapeHtml(actionIds.join(","));
  const rows = [...incoming, ...outgoing]
    .slice(0, 12)
    .map((edge) => {
      const relationship = relationshipLabels[edge.relationship || "forward"] || edge.relationship || "link";
      const direction = edge.relationship === "forward"
        ? edge.source === node.id ? "Forwarded into" : "Inbound forward from"
        : edge.source === node.id ? "Links to" : "Linked from";
      const other = edge.source === node.id ? edge.target : edge.source;
      const evidence = edge.evidence[edge.evidence.length - 1] || `${edge.weight} observed forwards`;
      const timing = edge.lastSeenAt ? ` · last ${formatDateTime(timestampMs(edge.lastSeenAt))}` : "";
      return `<div class="detail-row"><strong>${escapeHtml(direction)} ${escapeHtml(other)}</strong><span>${escapeHtml(relationship)} · ${escapeHtml(evidence)}${escapeHtml(timing)}</span></div>`;
    })
    .join("");
  const username = node.username || (node.id.startsWith("@") ? node.id.slice(1) : "");
  const profileRows = [
    ["Username", username ? `@${username}` : ""],
    ["URL", node.url],
    ["Community", nodeCommunityLabel(node)],
    ["Created", nodeCreatedTime(node) ? formatDateTime(nodeCreatedTime(node)) : ""],
    ["Members", node.memberCount ? Number(node.memberCount).toLocaleString() : ""],
    ["Listed Members", node.memberListCount || node.memberAccess ? `${Number(node.memberListCount || 0).toLocaleString()}${node.memberAccess ? ` (${node.memberAccess})` : ""}` : ""],
    ["Description", node.description]
  ].filter(([, value]) => value);
  const profileHtml = profileRows
    .map(([label, value]) => {
      const content = label === "URL"
        ? `<a href="${escapeHtml(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
        : escapeHtml(value);
      return `<div class="profile-row"><strong>${escapeHtml(label)}</strong><span>${content}</span></div>`;
    })
    .join("");
  const detailPanel = detailPanelView === "messages"
    ? renderMessageList(node)
    : renderNodeMembersPanel(node);

  els.details.innerHTML = `
    <div class="detail-heading">
      <div class="detail-title">
        ${node.avatarUrl ? `<img src="${escapeHtml(node.avatarUrl)}" alt="" />` : ""}
        <h2>${escapeHtml(displayLabel(node))}</h2>
      </div>
      <div class="detail-header-actions">
        <div class="detail-actions">
          <button class="detail-action" data-map-selected="${actionIdsAttr}">${escapeHtml(actionLabel)}</button>
          <button class="detail-action secondary-action" data-queue-selected="${actionIdsAttr}" ${selectedNodes.length === 1 && queued ? "disabled" : ""}>${escapeHtml(selectedNodes.length > 1 ? "Queue" : queueLabel)}</button>
          <button class="detail-action danger-action" data-delete-selected="${actionIdsAttr}">Delete</button>
        </div>
        <button class="icon-button detail-minimize" type="button" data-toggle-details title="${minimizeLabel}" aria-label="${minimizeLabel}">${minimizeIcon}</button>
      </div>
    </div>
    ${actionSummary ? `<p class="selection-summary">${escapeHtml(actionSummary)}</p>` : ""}
    <p>${escapeHtml(node.id)} · ${node.seed ? "seed" : escapeHtml(node.type)} · ${escapeHtml(collectionState)} · ${incoming.length} inbound · ${outgoing.length} outbound</p>
    <div class="detail-body">
      <div class="detail-overview">
        ${profileHtml ? `<div class="profile-list">${profileHtml}</div>` : ""}
        <div class="detail-list">${rows || '<div class="detail-row">No forwards mapped yet.</div>'}</div>
      </div>
      ${selectedNodes.length > 1 ? renderMemberOverlapPanel(selectedNodes) : detailPanel}
    </div>
  `;
}

async function loadNodeMessages(nodeId, options = {}) {
  const node = graph.nodes.get(nodeId);
  if (!node || messageState.loading) return;
  const reset = options.reset !== false;
  if (reset || messageState.nodeId !== nodeId) resetMessageState(nodeId);
  messageState.nodeId = nodeId;
  messageState.loading = true;
  messageState.error = "";
  renderDetails(node);

  try {
    const params = new URLSearchParams({
      chat: nodeId,
      limit: "20"
    });
    if (!reset && messageState.nextOffsetId) params.set("offsetId", String(messageState.nextOffsetId));
    const data = await apiGet(`/api/messages?${params.toString()}`);
    messageState.items = reset ? data.messages || [] : [...messageState.items, ...(data.messages || [])];
    messageState.nextOffsetId = data.nextOffsetId || 0;
    messageState.loaded = true;
  } catch (error) {
    messageState.error = error.message;
  } finally {
    messageState.loading = false;
    if (graph.selectedId === nodeId) renderDetails(node);
  }
}

function ensureRecentMessages(node) {
  if (!canLoadMessagesForNode(node)) return;
  if (messageState.nodeId === node.id && (messageState.loading || messageState.loaded || messageState.error)) return;
  if (messageLoadTimers.has(node.id)) return;

  const timer = window.setTimeout(() => {
    messageLoadTimers.delete(node.id);
    if (graph.selectedId !== node.id) return;
    loadNodeMessages(node.id, { reset: true });
  }, 120);
  messageLoadTimers.set(node.id, timer);
}

function fitGraph() {
  const nodes = visibleNodes();
  if (!nodes.length) return;
  const rect = canvas.getBoundingClientRect();
  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y));
  const width = Math.max(120, maxX - minX);
  const height = Math.max(120, maxY - minY);
  view.scale = Math.max(0.35, Math.min(1.45, Math.min(rect.width / (width + 220), rect.height / (height + 220))));
  view.x = -((minX + maxX) / 2) * view.scale;
  view.y = -((minY + maxY) / 2) * view.scale;
}

function nodeDegree(id) {
  let degree = 0;
  for (const edge of visibleEdges()) {
    if (edge.source === id || edge.target === id) degree += edge.weight || 1;
  }
  return degree;
}

function layoutToGrid() {
  const nodes = visibleNodes()
    .sort((a, b) => nodeDegree(b.id) - nodeDegree(a.id) || displayLabel(a).localeCompare(displayLabel(b)));
  if (!nodes.length) return;
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const spacing = Math.max(170, Math.max(...nodes.map((node) => node.radius)) * 2 + 92);
  const rows = Math.ceil(nodes.length / columns);
  nodes.forEach((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    node.x = (col - (columns - 1) / 2) * spacing;
    node.y = (row - (rows - 1) / 2) * spacing;
    node.vx = 0;
    node.vy = 0;
  });
  setLayoutActive(false, "grid");
  fitGraph();
}

function searchMatches() {
  const query = els.searchInput.value.trim().toLowerCase();
  if (!query) return [];
  return visibleNodes().filter((node) => nodeSearchText(node).includes(query));
}

function updateSearchCount() {
  const matches = searchMatches();
  els.searchCount.textContent = matches.length
    ? layout.searchIndex >= 0 ? `${layout.searchIndex + 1}/${matches.length}` : `${matches.length}`
    : "0";
  els.searchPrev.disabled = !matches.length;
  els.searchNext.disabled = !matches.length;
}

function focusSearchMatch(direction = 1) {
  const matches = searchMatches();
  if (!matches.length) {
    layout.searchIndex = -1;
    layout.searchTargetId = null;
    updateSearchCount();
    return;
  }
  layout.searchIndex = layout.searchIndex < 0
    ? direction < 0 ? matches.length - 1 : 0
    : (layout.searchIndex + direction + matches.length) % matches.length;
  focusSearchNode(matches[layout.searchIndex]);
  updateSearchCount();
}

function focusSearchNode(node) {
  if (!node) return;
  layout.searchTargetId = node.id;
  view.x = -node.x * view.scale;
  view.y = -node.y * view.scale;
}

function exportData() {
  return {
    exportedAt: new Date().toISOString(),
    nodes: Array.from(graph.nodes.values()).map(({ vx, vy, avatarImage, ...node }) => node),
    edges: Array.from(graph.edges.values()),
    scanned: Array.from(graph.scanned)
  };
}

function csvValue(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function nodeUsername(node) {
  if (node.username) return node.username.startsWith("@") ? node.username : `@${node.username}`;
  return node.id.startsWith("@") ? node.id : "";
}

function nodeUrl(node) {
  if (node.url) return node.url;
  const username = nodeUsername(node);
  return username ? `https://t.me/${username.replace(/^@/, "")}` : "";
}

function exportCsvData(nodesOverride = null) {
  const visible = visibleNodes();
  const selectedVisible = Array.from(graph.selectedIds)
    .map((id) => graph.nodes.get(id))
    .filter((node) => node && visible.some((visibleNode) => visibleNode.id === node.id));
  const nodes = nodesOverride || (selectedVisible.length > 1 ? selectedVisible : visible);
  const rows = [
    ["Channel Name", "Username", "URL"],
    ...nodes
      .slice()
      .sort((a, b) => displayLabel(a).localeCompare(displayLabel(b)))
      .map((node) => [displayLabel(node), nodeUsername(node), nodeUrl(node)])
  ];
  return rows.map((row) => row.map(csvValue).join(",")).join("\n");
}

async function exportSelectedCsv() {
  const nodes = selectedVisibleNodes();
  if (!nodes.length) return;
  const csv = exportCsvData(nodes);
  els.jsonImport.value = csv;
  await navigator.clipboard?.writeText(csv).catch(() => {});
  downloadText("telerecon-selected-nodes.csv", csv, "text/csv;charset=utf-8");
}

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importData(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    data = {
      edges: trimmed.split(/\n+/).map((line) => {
        const [source, target, ...rest] = line.split(/[,\s]+/).filter(Boolean);
        return { source, target, evidence: rest.join(" ") };
      })
    };
  }

  mergeGraphData(data);
}

function mergeGraphData(data, options = {}) {
  const beforeNodes = graph.nodes.size;
  const beforeEdges = graph.edges.size;
  for (const node of data.nodes || []) addNode(node.id, node);
  for (const edge of data.edges || []) addEdge(edge.source, edge.target, edge);
  for (const scanned of data.scanned || []) graph.scanned.add(scanned);
  updateMetrics();
  const addedNodes = Math.max(0, graph.nodes.size - beforeNodes);
  const addedEdges = Math.max(0, graph.edges.size - beforeEdges);
  if (addedNodes || addedEdges || (data.nodes || []).length || (data.edges || []).length) {
    startLayout({ label: "laying out" });
  }
  if (options.fit !== false) fitGraph();
  return {
    addedNodes,
    addedEdges
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

async function apiGet(path) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

async function apiStream(path, options = {}, onEvent = () => {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  if (!response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalData = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "error") throw new Error(event.error || "Collection failed.");
      if (event.type === "cancelled") throw new DOMException(event.error || "Collection cancelled.", "AbortError");
      if (event.data) {
        onEvent(event);
        if (event.type === "done") finalData = event.data;
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer);
    if (event.type === "error") throw new Error(event.error || "Collection failed.");
    if (event.type === "cancelled") throw new DOMException(event.error || "Collection cancelled.", "AbortError");
    if (event.data) {
      onEvent(event);
      if (event.type === "done") finalData = event.data;
    }
  }

  return finalData;
}

function formatProgress(progress) {
  const chat = progress.chatId || progress.chat || "channel";
  if (progress.phase === "messages") {
    if (!progress.totalMessages) {
      return `Scanning ${chat}: ${progress.scannedMessages || 0} messages checked, ${progress.forwardsFound || 0} forwards found.`;
    }
    return `Scanning ${chat}: ${progress.scannedMessages || 0}/${progress.totalMessages || 0} messages checked, ${progress.forwardsFound || 0} forwards found.`;
  }
  if (progress.phase === "metadata") {
    return `Collecting metadata, associated chat, and recommendations for ${chat}.`;
  }
  if (progress.phase === "members") {
    return `Collecting exposed member list and admin roles for ${chat}.`;
  }
  if (progress.phase === "recommendations") {
    return `Checking mapped channels and chats for similar suggestions.`;
  }
  if (progress.phase === "resolving") {
    return `Resolving ${progress.chat || chat}.`;
  }
  if (progress.phase === "error") return progress.error || "Scan failed.";
  if (progress.phase === "cancelled") return progress.error || "Collection cancelled.";
  if (progress.phase === "done") {
    return `Finished ${chat}: ${progress.scannedMessages || 0} messages checked, ${progress.nodesFound || 0} nodes found.`;
  }
  return els.progressSummary.textContent;
}

function startProgressPolling() {
  clearInterval(progressPoll);
  progressPoll = window.setInterval(async () => {
    try {
      const progress = await apiFetch("/api/progress");
      if (!progress.running && progress.phase !== "done") return;
      els.progressSummary.textContent = formatProgress(progress);
      if (!progress.running && ["done", "error", "cancelled"].includes(progress.phase)) {
        clearInterval(progressPoll);
        progressPoll = 0;
      }
    } catch {
      clearInterval(progressPoll);
      progressPoll = 0;
    }
  }, 850);
}

async function checkApi() {
  try {
    const status = await apiFetch("/api/status");
    els.apiStatus.classList.toggle("online", Boolean(status.ready));
    els.apiStatus.classList.toggle("configured", Boolean(status.configured && !status.ready));
    els.apiStatus.classList.toggle("missing-dependency", status.dependencyReady === false);
    els.apiStatus.title = status.ready
      ? "Telegram bridge connected"
      : status.reason || "Telegram bridge not authenticated";
  } catch {
    els.apiStatus.classList.remove("online");
    els.apiStatus.title = "Open directly or server not running";
  }
}

function setFlag(element, label, ok) {
  element.textContent = `${label} ${ok ? "set" : "unset"}`;
  element.classList.toggle("ready", ok);
}

function setLoginStep(step) {
  els.loginStepPhone.classList.toggle("active", step === "phone");
  els.loginStepCode.classList.toggle("active", step === "code");
  els.loginStepPassword.classList.toggle("active", step === "password");
}

async function handleAuthResult(result) {
  if (result.step === "code") {
    setLoginStep("code");
    const next = result.nextType ? ` Next method: ${result.nextType}.` : "";
    els.settingsStatus.textContent = result.message || `Enter the verification code Telegram sent.${next}`;
    els.settingsCode.focus();
    return;
  }
  if (result.step === "password") {
    setLoginStep("password");
    els.settingsStatus.textContent = "Telegram requires your two-step password.";
    els.settingsPassword.focus();
    return;
  }
  if (result.step === "complete") {
    setLoginStep("phone");
    els.settingsCode.value = "";
    els.settingsPassword.value = "";
    els.settingsSession.value = "";
    await loadSettings();
    await checkApi();
    els.settingsStatus.textContent = "Telegram login complete. Session saved locally.";
    return;
  }
  els.settingsStatus.textContent = result.message || "Waiting for Telegram.";
}

async function sendLoginCode() {
  const body = {
    apiId: els.settingsApiId.value.trim(),
    apiHash: els.settingsApiHash.value,
    phone: els.settingsPhone.value.trim()
  };
  try {
    els.settingsStatus.textContent = "Requesting Telegram verification code.";
    const result = await apiFetch("/api/auth/start", { method: "POST", body });
    await handleAuthResult(result);
  } catch (error) {
    setLoginStep("phone");
    els.settingsStatus.textContent = error.message;
  }
}

async function verifyLoginCode() {
  try {
    els.settingsStatus.textContent = "Verifying code.";
    const result = await apiFetch("/api/auth/code", {
      method: "POST",
      body: { code: els.settingsCode.value }
    });
    await handleAuthResult(result);
  } catch (error) {
    setLoginStep("code");
    els.settingsStatus.textContent = error.message;
  }
}

async function verifyLoginPassword() {
  try {
    els.settingsStatus.textContent = "Checking two-step password.";
    const result = await apiFetch("/api/auth/password", {
      method: "POST",
      body: { password: els.settingsPassword.value }
    });
    await handleAuthResult(result);
  } catch (error) {
    setLoginStep("password");
    els.settingsStatus.textContent = error.message;
  }
}

async function loadSettings() {
  try {
    const settings = await apiFetch("/api/settings");
    els.settingsApiId.value = settings.apiIdPreview || "";
    els.settingsApiHash.value = "";
    els.settingsSession.value = "";
    setFlag(els.apiIdFlag, "api id", settings.hasApiId);
    setFlag(els.apiHashFlag, "hash", settings.hasApiHash);
    setFlag(els.sessionFlag, "session", settings.hasSession);
    els.settingsStatus.textContent = settings.path
      ? `Stored locally at ${settings.path}`
      : "Settings are available when the local server is running.";
    setLoginStep(settings.hasSession ? "phone" : "phone");
  } catch (error) {
    els.settingsStatus.textContent = error.message;
  }
}

async function saveSettings(clear = false) {
  const body = clear
    ? { clear: true }
    : {
      apiId: els.settingsApiId.value.trim(),
      apiHash: els.settingsApiHash.value,
      session: els.settingsSession.value
    };
  try {
    await apiFetch("/api/settings", { method: "POST", body });
    await loadSettings();
    await checkApi();
    els.settingsStatus.textContent = clear ? "Saved credentials cleared." : "Settings saved locally.";
  } catch (error) {
    els.settingsStatus.textContent = error.message;
  }
}

function openSettings() {
  els.settingsModal.hidden = false;
  loadSettings();
  setTimeout(() => els.settingsApiId.focus(), 0);
}

function closeSettings() {
  els.settingsModal.hidden = true;
}

function sendHeartbeat() {
  fetch("/api/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    keepalive: true
  }).catch(() => {});
}

async function exitApp() {
  const shouldExit = window.confirm("Exit Telerecon and stop the local server?");
  if (!shouldExit) return;
  try {
    await apiFetch("/api/shutdown", { method: "POST", body: {} });
    document.body.innerHTML = '<main class="shutdown-screen"><h1>Telerecon stopped</h1><p>The local server has been shut down. You can close this tab.</p></main>';
  } catch (error) {
    setAutomationState("error");
    setCollectionBanner("error", `Could not stop the local server: ${error.message}`);
  }
}

async function runAutomation(kind, targetId = "") {
  const seed = normalizeId(targetId || graph.selectedId);
  if (!seed) return false;
  const depth = Number(els.depthInput.value) || 2;
  const seedNode = addNode(seed, { seed: true });
  if (graph.selectedId === seedNode.id) renderDetails(seedNode);
  updateMetrics();
  startLayout();
  fitGraph();
  const scanLabel = kind === "snowball" ? "Mapping seed and discovered channels" : "Mapping target seed";
  setCollectionBanner("", "");
  setProgress("seed", `Seed accepted: ${seed}. Collection will start inside this channel.`, {
    seed: `Seed selected: ${seed}`,
    bridge: "Checking Telegram bridge",
    scan: scanLabel,
    merge: "Waiting for scan results"
  });
  setAutomationState("running");
  try {
    setProgress("bridge", "Checking the local Telegram bridge before reading channel messages.", {
      seed: `Seed selected: ${seed}`,
      bridge: "Checking Telegram bridge",
      scan: scanLabel,
      merge: "Waiting for scan results"
    });
    const status = await apiFetch("/api/status");
    throwIfCollectionCancelled();
    if (status.dependencyReady === false) {
      setAutomationState("setup");
      setCollectionBanner("error", status.reason);
      setProgress("error", status.reason, {
        seed: `Seed selected: ${seed}`,
        bridge: "Bridge dependency missing",
        scan: scanLabel,
        merge: "Scan stopped"
      });
      return false;
    }
    if (!status.configured) {
      setAutomationState("manual");
      const message = "Telegram credentials are needed before the target seed can be collected.";
      setCollectionBanner("warning", `${message} Settings opened so you can add them.`);
      setProgress("error", message, {
        seed: `Seed selected: ${seed}`,
        bridge: "Bridge needs settings",
        scan: scanLabel,
        merge: "Scan stopped"
      });
      openSettings();
      return false;
    }
    const payload = kind === "snowball"
      ? { seed, depth }
      : { chat: seed, stream: true };
    throwIfCollectionCancelled();
    setProgress("scan", `Reading all accessible history in ${seed} and mapping inbound forwards.`, {
      seed: `Seed selected: ${seed}`,
      bridge: "Telegram bridge ready",
      scan: scanLabel,
      merge: "Waiting for scan results"
    });
    startProgressPolling();
    const beforeNodes = graph.nodes.size;
    const beforeEdges = graph.edges.size;
    const controller = new AbortController();
    collection.controller = controller;
    setCollectionControls();
    const requestOptions = { method: "POST", body: payload, signal: controller.signal };
    const data = kind === "snowball"
      ? await apiFetch("/api/snowball", requestOptions)
      : await apiStream("/api/forwards", requestOptions, (event) => {
        if (collection.cancelled) return;
        if (!event.data) return;
        mergeGraphData(event.data, { fit: event.type === "metadata" });
        const selected = graph.nodes.get(seed);
        if (event.type === "members" && selected && graph.selectedId === selected.id) detailPanelView = "members";
        if (selected && graph.selectedId === selected.id) renderDetails(selected);
      });
    throwIfCollectionCancelled();
    if (collection.controller === controller) collection.controller = null;
    setCollectionControls();
    clearInterval(progressPoll);
    progressPoll = 0;
    setProgress("merge", "Merging forwarded channels and evidence into the graph.", {
      seed: `Seed selected: ${seed}`,
      bridge: "Telegram bridge ready",
      scan: scanLabel,
      merge: "Merging graph results"
    });
    mergeGraphData(data || {}, { fit: false });
    for (const item of data?.scanned || [seed]) graph.scanned.add(item);
    updateMetrics();
    const selected = graph.nodes.get(seed);
    if (selected && graph.selectedId === selected.id && hasMemberResults(selected)) detailPanelView = "members";
    if (selected && graph.selectedId === selected.id) renderDetails(selected);
    const addedNodes = Math.max(0, graph.nodes.size - beforeNodes);
    const addedEdges = Math.max(0, graph.edges.size - beforeEdges);
    const scannedCount = data?.scanned?.length || 1;
    const completionMessage = `Mapped ${scannedCount} channel scan${scannedCount === 1 ? "" : "s"} from ${seed}; added ${addedNodes} node${addedNodes === 1 ? "" : "s"} and ${addedEdges} link${addedEdges === 1 ? "" : "s"}.`;
    setCollectionBanner("success", completionMessage);
    setProgress("done", completionMessage, {
      seed: `Seed selected: ${seed}`,
      bridge: "Telegram bridge ready",
      scan: scanLabel,
      merge: "Graph updated"
    });
    setAutomationState("done");
    return true;
  } catch (error) {
    if (error.name === "AbortError" || collection.cancelled) {
      clearInterval(progressPoll);
      progressPoll = 0;
      collection.controller = null;
      if (collection.skipping) {
        collection.skipping = false;
        setAutomationState(collection.queue.length ? "queued" : "done");
        const message = `Skipped ${seed}. ${collection.queue.length} queued target${collection.queue.length === 1 ? "" : "s"} remaining.`;
        setCollectionBanner("info", message);
        setProgress("cancelled", message, {
          seed: `Seed skipped: ${seed}`,
          bridge: "Bridge ready",
          scan: "Channel scan skipped",
          merge: "Moving to next target"
        });
        setCollectionControls();
        return "skipped";
      }
      if (collection.paused && !collection.cancelled) {
        if (!collection.queue.includes(seed)) {
          collection.queue.unshift(seed);
          graph.queued.add(seed);
        }
        collection.current = "";
        setAutomationState("paused");
        const count = collection.queue.length;
        const message = `Collection paused. ${seed} was returned to the front of the queue.`;
        setCollectionBanner("info", message);
        setProgress("cancelled", message, {
          seed: `${count} target${count === 1 ? "" : "s"} paused`,
          bridge: "Bridge stopped",
          scan: "Channel scan paused",
          merge: "Graph unchanged"
        });
        updateCollectionMeta();
        return false;
      }
      setAutomationState("cancelled");
      const message = `Collection cancelled. ${seed} stopped and queued targets were cleared.`;
      setCollectionBanner("warning", message);
      setProgress("cancelled", message, {
        seed: `Seed selected: ${seed}`,
        bridge: "Telegram bridge checked",
        scan: scanLabel,
        merge: "Scan cancelled"
      });
      setCollectionControls();
      return false;
    }
    clearInterval(progressPoll);
    progressPoll = 0;
    collection.controller = null;
    setAutomationState("error");
    setCollectionBanner("error", error.message);
    setProgress("error", error.message, {
      seed: `Seed selected: ${seed}`,
      bridge: "Telegram bridge checked",
      scan: scanLabel,
      merge: "Scan failed"
    });
    return false;
  }
}

function toggleNodeSelection(node, additive = false) {
  if (!node) {
    clearSelection();
    return;
  }
  if (!additive) graph.selectedIds.clear();
  if (additive && graph.selectedIds.has(node.id)) graph.selectedIds.delete(node.id);
  else graph.selectedIds.add(node.id);
  graph.selectedId = graph.selectedIds.has(node.id)
    ? node.id
    : Array.from(graph.selectedIds).pop() || null;
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
}

async function startTargetCollection(targetId = "") {
  collection.cancelled = false;
  const kind = els.snowballToggle.checked ? "snowball" : "scan";
  const seeds = targetId ? [normalizeId(targetId)] : parseSeedList(els.seedInput.value);
  const targets = seeds.filter(Boolean);
  if (!targets.length) return;
  enqueueTargets(targets, { front: Boolean(targetId) });
  await processCollectionQueue(kind);
}

function enqueueTargets(targets, options = {}) {
  for (const target of targets) {
    const seed = normalizeId(target);
    if (!seed || seed === collection.current || graph.queued.has(seed) || collection.queue.includes(seed)) continue;
    if (options.front) collection.queue.unshift(seed);
    else collection.queue.push(seed);
    graph.queued.add(seed);
  }
  updateCollectionMeta();
  const selected = graph.selectedId ? graph.nodes.get(graph.selectedId) : null;
  if (selected) renderDetails(selected);
}

function parseActionIds(value) {
  return String(value || "")
    .split(",")
    .map((id) => normalizeId(id))
    .filter(Boolean);
}

function selectedActionIds() {
  return selectedVisibleNodes().map((node) => node.id);
}

function deleteNodes(ids) {
  const targets = new Set(ids.map((id) => canonicalIdFor(id)).filter(Boolean));
  if (!targets.size) return;
  for (const id of targets) {
    graph.nodes.delete(id);
    graph.scanned.delete(id);
    graph.selectedIds.delete(id);
    graph.queued.delete(id);
    for (const [alias, canonical] of Array.from(graph.aliases.entries())) {
      if (canonical === id || alias === id) graph.aliases.delete(alias);
    }
  }
  for (const edge of Array.from(graph.edges.values())) {
    if (targets.has(edge.source) || targets.has(edge.target)) graph.edges.delete(edge.id);
  }
  collection.queue = collection.queue.filter((id) => !targets.has(id));
  if (targets.has(collection.current)) collection.current = "";
  if (targets.has(graph.selectedId)) graph.selectedId = Array.from(graph.selectedIds).pop() || null;
  if (targets.has(layout.searchTargetId)) layout.searchTargetId = null;
  updateMetrics();
  updateCollectionMeta();
  const selected = graph.selectedId ? graph.nodes.get(graph.selectedId) : null;
  renderDetails(selected || null);
}

async function processCollectionQueue(kind = els.snowballToggle.checked ? "snowball" : "scan") {
  if (collection.running) {
    setAutomationState("queued");
    return;
  }
  if (collection.paused) {
    const count = collection.queue.length + (collection.current ? 1 : 0);
    setAutomationState("paused");
    setCollectionBanner("info", `Collection paused with ${count} queued target${count === 1 ? "" : "s"}.`);
    updateCollectionMeta();
    return;
  }
  collection.cancelled = false;
  collection.running = true;
  const initialCount = collection.queue.length;

  if (initialCount > 1) {
    setAutomationState("queued");
    setCollectionBanner("info", `Queued ${initialCount} target seeds for collection.`);
    setProgress("seed", `Queued ${initialCount} target seeds for collection.`, {
      seed: `${initialCount} seeds queued`,
      bridge: "Bridge waiting",
      scan: "Channel scan waiting",
      merge: "Graph merge waiting"
    });
  }

  let index = 0;
  while (collection.queue.length) {
    if (collection.cancelled || collection.paused) break;
    const seed = collection.queue.shift();
    graph.queued.delete(seed);
    collection.current = seed;
    updateCollectionMeta();
    index += 1;
    if (initialCount > 1 || collection.queue.length) {
      setProgress("seed", `Collecting target ${index} of ${initialCount}: ${seed}.`, {
        seed: `Target ${index}/${initialCount}: ${seed}`,
        bridge: "Checking Telegram bridge",
        scan: kind === "snowball" ? "Mapping seed and discovered channels" : "Mapping target seed",
        merge: "Waiting for scan results"
      });
    }
    const result = await runAutomation(kind, seed);
    if (result === "skipped") {
      collection.current = "";
      updateCollectionMeta();
      continue;
    }
    if (!result || collection.cancelled || collection.paused) break;
    collection.current = "";
    updateCollectionMeta();
  }
  if (collection.cancelled) {
    collection.queue = [];
    graph.queued.clear();
    collection.paused = false;
    setAutomationState("cancelled");
    const message = "Collection cancelled. Active scan stopped and queued targets were cleared.";
    setCollectionBanner("warning", message);
    setProgress("cancelled", message, {
      seed: "Seed cancelled",
      bridge: "Bridge stopped",
      scan: "Channel scan cancelled",
      merge: "Graph unchanged"
    });
  } else if (collection.paused) {
    const count = collection.queue.length;
    const message = `Collection paused with ${count} queued target${count === 1 ? "" : "s"} remaining.`;
    setAutomationState("paused");
    setCollectionBanner("info", message);
    if (!collection.current) {
      setProgress("seed", message, {
        seed: count ? `${count} target${count === 1 ? "" : "s"} paused` : "Seed waiting",
        bridge: "Bridge waiting",
        scan: "Channel scan waiting",
        merge: "Graph merge waiting"
      });
    }
  }
  collection.current = "";
  collection.running = false;
  collection.controller = null;
  updateCollectionMeta();
}

async function cancelActiveCollectionRequest() {
  if (collection.controller) collection.controller.abort();
  clearInterval(progressPoll);
  progressPoll = 0;
  try {
    await apiFetch("/api/cancel", { method: "POST", body: {} });
  } catch {
    // Request close/AbortController usually reaches the server first; this endpoint is best effort.
  }
}

async function cancelCollection() {
  if (!collection.running && !collection.controller && !collection.queue.length) return;
  collection.cancelled = true;
  collection.paused = false;
  collection.skipping = false;
  collection.queue = [];
  graph.queued.clear();
  setAutomationState("cancelled");
  const message = "Cancelling collection. Stopping the active scan and clearing queued targets.";
  setCollectionBanner("warning", message);
  setProgress("cancelled", message, {
    seed: collection.current ? `Seed selected: ${collection.current}` : "Seed cancelled",
    bridge: "Bridge stopping",
    scan: "Channel scan cancelling",
    merge: "Graph unchanged"
  });
  updateCollectionMeta();
  await cancelActiveCollectionRequest();
}

async function skipCurrentCollection() {
  if ((!collection.current && !collection.controller) || collection.skipping || collection.cancelled) return;
  const current = collection.current || "active channel";
  collection.skipping = true;
  collection.paused = false;
  setAutomationState("skipping");
  const message = `Skipping ${current}. The next queued channel will start after this scan stops.`;
  setCollectionBanner("info", message);
  if (els.progressSummary) els.progressSummary.textContent = message;
  updateCollectionMeta();
  await cancelActiveCollectionRequest();
}

function removeQueuedTarget(id) {
  const target = normalizeId(id);
  if (!target) return;
  collection.queue = collection.queue.filter((queued) => queued !== target);
  graph.queued.delete(target);
  updateCollectionMeta();
  const selected = graph.selectedId ? graph.nodes.get(graph.selectedId) : null;
  if (selected) renderDetails(selected);
}

async function togglePauseCollection() {
  if (collection.paused) {
    collection.paused = false;
    const count = collection.queue.length + (collection.current ? 1 : 0);
    setAutomationState(count ? "queued" : "idle");
    setCollectionBanner("info", count ? `Collection resumed with ${count} target${count === 1 ? "" : "s"} queued.` : "");
    updateCollectionMeta();
    if (collection.queue.length && !collection.running && !collection.controller) processCollectionQueue();
    return;
  }

  const count = collection.queue.length + (collection.current ? 1 : 0);
  if (!count && !collection.controller) return;
  collection.paused = true;
  setAutomationState("paused");
  const message = collection.controller || collection.current
    ? "Pausing now. The active channel will be returned to the front of the queue."
    : `Collection paused with ${count} queued target${count === 1 ? "" : "s"}.`;
  setCollectionBanner("info", message);
  if (!collection.controller && !collection.current) {
    setProgress("seed", message, {
      seed: `${count} target${count === 1 ? "" : "s"} paused`,
      bridge: "Bridge waiting",
      scan: "Channel scan waiting",
      merge: "Graph merge waiting"
    });
  } else if (els.progressSummary) {
    els.progressSummary.textContent = message;
    await cancelActiveCollectionRequest();
  }
  updateCollectionMeta();
}

function showSidebarPane(targetId) {
  document.body.classList.remove("sidebar-collapsed");
  if (els.collapseSidebar) {
    els.collapseSidebar.title = "Collapse sidebar";
    els.collapseSidebar.setAttribute("aria-label", "Collapse sidebar");
  }
  for (const pane of sidebarPanes) {
    const active = pane.id === targetId;
    pane.hidden = !active;
    pane.classList.toggle("active", active);
  }
  for (const button of sidebarMenuButtons) {
    const active = button.dataset.menuTarget === targetId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  }
}

for (const button of sidebarMenuButtons) {
  button.addEventListener("click", () => showSidebarPane(button.dataset.menuTarget));
}

if (els.collapseSidebar) {
  els.collapseSidebar.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    els.collapseSidebar.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    els.collapseSidebar.setAttribute("aria-label", els.collapseSidebar.title);
  });
}

els.emptyFocusSeeds.addEventListener("click", () => {
  showSidebarPane("collectPane");
  els.seedInput.focus();
});
els.emptyFocusImport.addEventListener("click", () => {
  showSidebarPane("dataPane");
  els.jsonImport.focus();
});
els.startCollection.addEventListener("click", () => startTargetCollection());
els.cancelCollection.addEventListener("click", () => cancelCollection());
if (els.pauseCollectionTop) els.pauseCollectionTop.addEventListener("click", () => togglePauseCollection());
if (els.skipCollectionTop) els.skipCollectionTop.addEventListener("click", () => skipCurrentCollection());
if (els.cancelCollectionTop) els.cancelCollectionTop.addEventListener("click", () => cancelCollection());
if (els.queueList) {
  els.queueList.addEventListener("click", (event) => {
    const skipButton = event.target.closest("[data-skip-current]");
    if (skipButton) {
      skipCurrentCollection();
      return;
    }
    const removeButton = event.target.closest("[data-remove-queued]");
    if (removeButton) removeQueuedTarget(removeButton.dataset.removeQueued);
  });
}
els.snowballToggle.addEventListener("change", () => {
  const enabled = els.snowballToggle.checked;
  els.depthOption.hidden = !enabled;
  els.depthInput.disabled = !enabled;
});
els.seedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) startTargetCollection();
});
els.seedInput.addEventListener("input", updateCollectionMeta);
els.details.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-details]");
  if (toggleButton) {
    detailsMinimized = !detailsMinimized;
    renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
    return;
  }
  const mapButton = event.target.closest("[data-map-selected]");
  if (mapButton) {
    enqueueTargets(parseActionIds(mapButton.dataset.mapSelected), { front: true });
    processCollectionQueue();
    return;
  }
  const queueButton = event.target.closest("[data-queue-selected]");
  if (queueButton) {
    enqueueTargets(parseActionIds(queueButton.dataset.queueSelected));
    processCollectionQueue();
    return;
  }
  const loadMessagesButton = event.target.closest("[data-load-messages]");
  if (loadMessagesButton) {
    loadNodeMessages(loadMessagesButton.dataset.loadMessages, { reset: true });
    return;
  }
  const pageMessagesButton = event.target.closest("[data-page-messages]");
  if (pageMessagesButton) {
    loadNodeMessages(pageMessagesButton.dataset.pageMessages, { reset: false });
    return;
  }
  const detailViewButton = event.target.closest("[data-detail-view]");
  if (detailViewButton && !detailViewButton.disabled) {
    detailPanelView = detailViewButton.dataset.detailView === "messages" ? "messages" : "members";
    renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
    return;
  }
  const membersToggle = event.target.closest("[data-toggle-members-view]");
  if (membersToggle) {
    membersViewOpen = false;
    renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-selected]");
  if (!deleteButton) return;
  deleteNodes(parseActionIds(deleteButton.dataset.deleteSelected));
});
els.selectedMap.addEventListener("click", () => {
  const ids = selectedActionIds();
  if (!ids.length) return;
  enqueueTargets(ids, { front: true });
  processCollectionQueue();
});
els.selectedQueue.addEventListener("click", () => {
  const ids = selectedActionIds();
  if (!ids.length) return;
  enqueueTargets(ids);
  processCollectionQueue();
});
els.selectedMembers.addEventListener("click", () => {
  membersViewOpen = !membersViewOpen;
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
});
els.selectedExportCsv.addEventListener("click", () => exportSelectedCsv());
els.selectedDelete.addEventListener("click", () => deleteNodes(selectedActionIds()));
els.selectedClear.addEventListener("click", clearSelection);
if (els.createDirectory) {
  els.createDirectory.addEventListener("click", () => {
    createDirectoryFromGraph();
    showSidebarPane("directoryPane");
  });
}
if (els.clearDirectory) els.clearDirectory.addEventListener("click", () => clearDirectoryState());
if (els.runTargetAnalysis) els.runTargetAnalysis.addEventListener("click", () => runTargetAnalysis());
if (els.clearTargetAnalysis) {
  els.clearTargetAnalysis.addEventListener("click", () => {
    directoryState.target = null;
    directoryState.error = "";
    directoryState.query = "";
    if (els.targetQueryInput) els.targetQueryInput.value = "";
    renderTargetDashboard();
  });
}
if (els.targetQueryInput) {
  els.targetQueryInput.addEventListener("input", () => {
    directoryState.query = els.targetQueryInput.value;
    renderTargetDashboard();
  });
}
if (els.targetChatFilter) {
  els.targetChatFilter.addEventListener("change", () => {
    directoryState.chatFilter = els.targetChatFilter.value;
    renderTargetDashboard();
  });
}
if (els.targetMembershipFilter) {
  els.targetMembershipFilter.addEventListener("change", () => {
    directoryState.membershipFilter = els.targetMembershipFilter.value;
    renderTargetDashboard();
  });
}
if (els.targetActivityFilter) {
  els.targetActivityFilter.addEventListener("change", () => {
    directoryState.activityFilter = els.targetActivityFilter.value;
    renderTargetDashboard();
  });
}
if (els.targetUserInput) {
  els.targetUserInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runTargetAnalysis();
    }
  });
}
document.querySelector("#clearGraph").addEventListener("click", () => {
  const wasCollecting = Boolean(collection.running || collection.controller || collection.queue.length);
  if (wasCollecting) {
    collection.cancelled = true;
    if (collection.controller) collection.controller.abort();
    apiFetch("/api/cancel", { method: "POST", body: {} }).catch(() => {});
  }
  graph.nodes.clear();
  graph.edges.clear();
  graph.selectedIds.clear();
  graph.scanned.clear();
  graph.aliases.clear();
  graph.queued.clear();
  collection.queue = [];
  collection.running = false;
  collection.current = "";
  collection.controller = null;
  collection.cancelled = wasCollecting;
  collection.paused = false;
  collection.skipping = false;
  clearDirectoryState();
  updateCollectionMeta();
  graph.selectedId = null;
  graph.selectedIds.clear();
  layout.searchIndex = -1;
  layout.searchTargetId = null;
  els.searchInput.value = "";
  stopTimelapse();
  time.enabled = false;
  time.min = 0;
  time.max = 0;
  time.current = 0;
  els.timeFilterToggle.checked = false;
  els.timeStart.value = "";
  els.timeEnd.value = "";
  els.timeSlider.value = "100";
  resetNodeVelocity();
  setLayoutActive(false);
  updateMetrics();
  renderDetails(null);
  if (wasCollecting) {
    const message = "Collection cancelled and graph cleared.";
    setAutomationState("cancelled");
    setCollectionBanner("warning", message);
    setProgress("cancelled", message, {
      seed: "Seed cancelled",
      bridge: "Bridge stopped",
      scan: "Channel scan cancelled",
      merge: "Graph cleared"
    });
  } else {
    setCollectionBanner("", "");
    setProgress("seed", "Enter a target seed to begin collection.", {
      seed: "Seed waiting",
      bridge: "Bridge waiting",
      scan: "Channel scan waiting",
      merge: "Graph merge waiting"
    });
  }
});
document.querySelector("#importGraph").addEventListener("click", () => importData(els.jsonImport.value));
document.querySelector("#exportGraph").addEventListener("click", async () => {
  const json = JSON.stringify(exportData(), null, 2);
  els.jsonImport.value = json;
  await navigator.clipboard?.writeText(json).catch(() => {});
});
els.exportCsv.addEventListener("click", async () => {
  const csv = exportCsvData();
  els.jsonImport.value = csv;
  await navigator.clipboard?.writeText(csv).catch(() => {});
  downloadText("telerecon-nodes.csv", csv, "text/csv;charset=utf-8");
});
document.querySelector("#fitGraph").addEventListener("click", fitGraph);
els.fitGraphTop.addEventListener("click", fitGraph);
if (els.fitGraphQuick) els.fitGraphQuick.addEventListener("click", fitGraph);
els.reflowGraph.addEventListener("click", () => startLayout({ fit: true }));
if (els.reflowGraphQuick) els.reflowGraphQuick.addEventListener("click", () => startLayout({ fit: true }));
els.gridGraph.addEventListener("click", layoutToGrid);
if (els.gridGraphQuick) els.gridGraphQuick.addEventListener("click", layoutToGrid);
if (els.openFiltersQuick) els.openFiltersQuick.addEventListener("click", () => showSidebarPane("filtersPane"));
els.hideBlankNodes.addEventListener("change", () => {
  filters.hideBlankNodes = els.hideBlankNodes.checked;
  layout.searchIndex = -1;
  layout.searchTargetId = null;
  refreshGraphView({ fit: true, reflow: true });
});
els.hideChatGroups.addEventListener("change", () => {
  filters.hideChatGroups = els.hideChatGroups.checked;
  layout.searchIndex = -1;
  layout.searchTargetId = null;
  refreshGraphView({ fit: true, reflow: true });
});
els.hideChannels.addEventListener("change", () => {
  filters.hideChannels = els.hideChannels.checked;
  layout.searchIndex = -1;
  layout.searchTargetId = null;
  refreshGraphView({ fit: true, reflow: true });
});
els.showUserLayer.addEventListener("change", () => {
  filters.showUserLayer = els.showUserLayer.checked;
  layout.searchIndex = -1;
  layout.searchTargetId = null;
  refreshGraphView({ fit: true, reflow: true });
});
els.nodeSizeMode.addEventListener("change", () => {
  filters.nodeSizeMode = els.nodeSizeMode.value;
  refreshGraphView({ fit: true, reflow: true });
});
if (els.labelDensity) {
  els.labelDensity.addEventListener("change", () => {
    filters.labelDensity = els.labelDensity.value;
    updateReadabilityLabel();
  });
}
if (els.minEdgeWeight) {
  els.minEdgeWeight.addEventListener("input", () => {
    filters.minEdgeWeight = Number(els.minEdgeWeight.value) || 1;
    layout.searchIndex = -1;
    layout.searchTargetId = null;
    refreshGraphView({ fit: true, reflow: true });
  });
}
els.communityMode.addEventListener("change", () => {
  filters.communityMode = els.communityMode.value;
  communityState.signature = "";
  updateCommunityDetection();
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
});
els.searchInput.addEventListener("input", () => {
  const matches = searchMatches();
  layout.searchIndex = matches.length ? 0 : -1;
  if (matches.length) {
    focusSearchNode(matches[0]);
  } else {
    layout.searchTargetId = null;
  }
  updateSearchCount();
});
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  focusSearchMatch(event.shiftKey ? -1 : 1);
});
els.searchPrev.addEventListener("click", () => focusSearchMatch(-1));
els.searchNext.addEventListener("click", () => focusSearchMatch(1));
els.timeFilterToggle.addEventListener("change", () => {
  time.enabled = els.timeFilterToggle.checked;
  if (time.enabled && time.max) time.current = fromDateInputValue(els.timeEnd.value, true) || time.max;
  if (!time.enabled) stopTimelapse();
  refreshTimeControls();
  updateMetrics();
  fitGraph();
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
});
els.timeStart.addEventListener("change", () => {
  stopTimelapse();
  time.current = fromDateInputValue(els.timeStart.value) || time.min;
  refreshTimeControls();
  updateMetrics();
  fitGraph();
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
});
els.timeEnd.addEventListener("change", () => {
  stopTimelapse();
  time.current = fromDateInputValue(els.timeEnd.value, true) || time.max;
  refreshTimeControls();
  updateMetrics();
  fitGraph();
  renderDetails(graph.selectedId ? graph.nodes.get(graph.selectedId) : null);
});
els.timeSlider.addEventListener("input", setCurrentFromSlider);
els.timePlay.addEventListener("click", toggleTimelapse);
els.openSettings.addEventListener("click", openSettings);
els.exitApp.addEventListener("click", exitApp);
els.closeSettings.addEventListener("click", closeSettings);
document.querySelector("#saveSettings").addEventListener("click", () => saveSettings(false));
document.querySelector("#clearSettings").addEventListener("click", () => saveSettings(true));
document.querySelector("#sendLoginCode").addEventListener("click", sendLoginCode);
document.querySelector("#verifyLoginCode").addEventListener("click", verifyLoginCode);
document.querySelector("#verifyLoginPassword").addEventListener("click", verifyLoginPassword);
els.settingsPhone.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendLoginCode();
});
els.settingsCode.addEventListener("keydown", (event) => {
  if (event.key === "Enter") verifyLoginCode();
});
els.settingsPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") verifyLoginPassword();
});
els.settingsModal.addEventListener("click", (event) => {
  if (event.target === els.settingsModal) closeSettings();
});

renderTargetDashboard();
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.settingsModal.hidden) closeSettings();
});

canvas.addEventListener("pointerdown", (event) => {
  const node = pickNode(event.clientX, event.clientY);
  if (node) {
    resetNodeVelocity();
    setLayoutActive(false);
  }
  view.dragging = true;
  view.dragNode = node;
  view.lastX = event.clientX;
  view.lastY = event.clientY;
  view.pointerStartX = event.clientX;
  view.pointerStartY = event.clientY;
  view.didDrag = false;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  view.hoverX = event.clientX - canvas.getBoundingClientRect().left;
  view.hoverY = event.clientY - canvas.getBoundingClientRect().top;
  if (!view.dragging) {
    const hoveredNode = pickNode(event.clientX, event.clientY);
    view.hoverEdge = hoveredNode ? null : pickEdge(event.clientX, event.clientY);
    canvas.style.cursor = hoveredNode ? "pointer" : view.hoverEdge ? "help" : "default";
    return;
  }
  view.hoverEdge = null;
  const dx = event.clientX - view.lastX;
  const dy = event.clientY - view.lastY;
  const totalDx = event.clientX - view.pointerStartX;
  const totalDy = event.clientY - view.pointerStartY;
  if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > 4) view.didDrag = true;
  view.lastX = event.clientX;
  view.lastY = event.clientY;
  if (view.dragNode) {
    view.dragNode.x += dx / view.scale;
    view.dragNode.y += dy / view.scale;
    view.dragNode.vx = 0;
    view.dragNode.vy = 0;
  } else {
    view.x += dx;
    view.y += dy;
  }
});

canvas.addEventListener("pointerup", (event) => {
  const clickedNode = !view.didDrag ? pickNode(event.clientX, event.clientY) : null;
  const additive = event.shiftKey || event.ctrlKey || event.metaKey;
  if (clickedNode) toggleNodeSelection(clickedNode, additive);
  else if (!view.didDrag && !additive) toggleNodeSelection(null);
  view.dragging = false;
  view.dragNode = null;
  view.didDrag = false;
});

canvas.addEventListener("pointerleave", () => {
  view.hoverEdge = null;
  canvas.style.cursor = "default";
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const before = worldFromScreen(event.clientX, event.clientY);
  view.scale = Math.max(0.25, Math.min(2.3, view.scale * (event.deltaY > 0 ? 0.9 : 1.1)));
  const after = worldFromScreen(event.clientX, event.clientY);
  view.x += (after.x - before.x) * view.scale;
  view.y += (after.y - before.y) * view.scale;
}, { passive: false });

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
sendHeartbeat();
setInterval(sendHeartbeat, 5000);
checkApi();
setInterval(checkApi, 10000);
updateMetrics();
setProgress("seed", "Enter a target seed to begin collection.", {
  seed: "Seed waiting",
  bridge: "Bridge waiting",
  scan: "Channel scan waiting",
  merge: "Graph merge waiting"
});
requestAnimationFrame(draw);

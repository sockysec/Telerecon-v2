import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const settingsPath = path.join(__dirname, ".telerecon-settings.json");
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"]
]);

let clientPromise;
let activeClient;
let authFlow;
let activeScanController;
let telegramUnavailableReason = "";
let heartbeatStarted = false;
let lastHeartbeatAt = 0;
const profilePhotoCache = new Map();
const scanProgress = {
  running: false,
  phase: "idle",
  chat: "",
  chatId: "",
  scannedMessages: 0,
  totalMessages: 0,
  forwardsFound: 0,
  nodesFound: 0,
  currentTarget: "",
  startedAt: "",
  updatedAt: ""
};
const missingGramJsMessage = "Missing Node dependency: telegram. Run npm install in this directory, then restart Telerecon.";
const heartbeatTimeoutMs = 15000;

async function loadSettings() {
  try {
    const content = await fs.readFile(settingsPath, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSettings(nextSettings) {
  const current = await loadSettings();
  const merged = {
    apiId: nextSettings.apiId || current.apiId || "",
    apiHash: nextSettings.apiHash || current.apiHash || "",
    session: nextSettings.session || current.session || "",
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), { mode: 0o600 });
  await fs.chmod(settingsPath, 0o600).catch(() => {});
  return merged;
}

async function clearSettings() {
  await fs.unlink(settingsPath).catch(() => {});
}

async function resetTelegramClient() {
  const resolved = await clientPromise?.catch(() => null);
  clientPromise = undefined;
  activeClient = undefined;
  telegramUnavailableReason = "";
  if (resolved?.disconnect) await resolved.disconnect().catch(() => {});
}

async function cancelAuthFlow() {
  const flow = authFlow;
  authFlow = undefined;
  if (flow?.client?.disconnect) await flow.client.disconnect().catch(() => {});
}

async function telegramConfig() {
  const settings = await loadSettings();
  return {
    apiId: Number(process.env.TELEGRAM_API_ID || settings.apiId),
    apiHash: process.env.TELEGRAM_API_HASH || settings.apiHash || "",
    session: process.env.TELEGRAM_SESSION || settings.session || "",
    sources: {
      apiId: process.env.TELEGRAM_API_ID ? "env" : settings.apiId ? "settings" : "",
      apiHash: process.env.TELEGRAM_API_HASH ? "env" : settings.apiHash ? "settings" : "",
      session: process.env.TELEGRAM_SESSION ? "env" : settings.session ? "settings" : ""
    }
  };
}

async function telegramConfigStatus() {
  const config = await telegramConfig();
  const missing = [];
  if (!config.apiId) missing.push("API ID");
  if (!config.apiHash) missing.push("API hash");
  if (!config.session) missing.push("string session");
  return {
    configured: missing.length === 0,
    missing,
    config
  };
}

async function getTelegramClient() {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const { apiId, apiHash, session } = await telegramConfig();
    if (!apiId || !apiHash || !session) {
      telegramUnavailableReason = "Set Telegram API ID, API hash, and string session in Settings.";
      return null;
    }

    try {
      const { TelegramClient, StringSession } = await telegramModules();
      const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
        connectionRetries: 4
      });
      await client.connect();
      activeClient = client;
      return client;
    } catch (error) {
      telegramUnavailableReason = error.message;
      return null;
    }
  })();

  return clientPromise;
}

async function telegramModules() {
  try {
    const { Api, TelegramClient } = await import("telegram");
    const { StringSession } = await import("telegram/sessions/index.js");
    return { Api, TelegramClient, StringSession };
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" || String(error.message).includes("Cannot find package 'telegram'")) {
      const missing = new Error(missingGramJsMessage);
      missing.status = 503;
      throw missing;
    }
    throw error;
  }
}

async function persistAuthorizedClient(flow) {
  const session = flow.client.session.save();
  await saveSettings({
    apiId: String(flow.apiId),
    apiHash: flow.apiHash,
    session
  });
  await resetTelegramClient();
  activeClient = flow.client;
  clientPromise = Promise.resolve(flow.client);
  authFlow = undefined;
}

async function startTelegramAuth(body) {
  const config = await telegramConfig();
  const apiId = Number(String(body.apiId || config.apiId || "").trim());
  const apiHash = String(body.apiHash || config.apiHash || "").trim();
  const phone = String(body.phone || "").trim();
  if (!apiId || !apiHash || !phone) {
    const error = new Error("API ID, API hash, and phone number are required.");
    error.status = 400;
    throw error;
  }

  await cancelAuthFlow();
  const { Api, TelegramClient, StringSession } = await telegramModules();
  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 4
  });

  await client.connect();
  const sentCode = await client.invoke(new Api.auth.SendCode({
    phoneNumber: phone,
    apiId,
    apiHash,
    settings: new Api.CodeSettings({})
  }));

  const flow = {
    apiId,
    apiHash,
    phone,
    client,
    phoneCodeHash: sentCode.phoneCodeHash,
    codeType: sentCode.type?.className || "auth.SentCode",
    nextType: sentCode.nextType?.className || "",
    timeout: sentCode.timeout || 0
  };

  if (sentCode.className === "auth.SentCodeSuccess") {
    await persistAuthorizedClient(flow);
    return { step: "complete", ready: true };
  }

  if (!flow.phoneCodeHash) {
    await cancelAuthFlow();
    const error = new Error("Telegram did not return a phone code hash. Restart login and check the phone number.");
    error.status = 502;
    throw error;
  }

  authFlow = flow;
  return {
    step: "code",
    message: "Verification code sent. Check Telegram first, then SMS if Telegram offers it.",
    codeType: flow.codeType,
    nextType: flow.nextType,
    timeout: flow.timeout
  };
}

async function submitTelegramCode(body) {
  if (!authFlow?.phoneCodeHash) {
    const error = new Error("No login is waiting for a verification code.");
    error.status = 409;
    throw error;
  }
  const code = String(body.code || "").trim().replace(/\s+/g, "");
  if (!code) {
    const error = new Error("Verification code is required.");
    error.status = 400;
    throw error;
  }

  const flow = authFlow;
  const { Api } = await telegramModules();
  try {
    await flow.client.invoke(new Api.auth.SignIn({
      phoneNumber: flow.phone,
      phoneCodeHash: flow.phoneCodeHash,
      phoneCode: code
    }));
    await persistAuthorizedClient(flow);
    return { step: "complete", ready: true };
  } catch (error) {
    const message = String(error.errorMessage || error.message || "");
    if (message.includes("SESSION_PASSWORD_NEEDED")) {
      return { step: "password", message: "Telegram requires your two-step password." };
    }
    error.status = error.status || 400;
    throw error;
  }
}

async function submitTelegramPassword(body) {
  if (!authFlow?.client) {
    const error = new Error("No login is waiting for a two-step password.");
    error.status = 409;
    throw error;
  }
  const password = String(body.password || "");
  if (!password) {
    const error = new Error("Two-step password is required.");
    error.status = 400;
    throw error;
  }

  const flow = authFlow;
  try {
    await flow.client.signInWithPassword({
      apiId: flow.apiId,
      apiHash: flow.apiHash
    }, {
      password: async () => password,
      onError: (error) => {
        throw error;
      }
    });
  } catch (error) {
    error.status = error.status || 400;
    throw error;
  }
  await persistAuthorizedClient(flow);
  return { step: "complete", ready: true };
}

function normalizePeer(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/t\.me\//i, "@")
    .replace(/^https?:\/\/telegram\.(?:me|dog)\//i, "@")
    .replace(/^t\.me\//i, "@")
    .replace(/^telegram\.(?:me|dog)\//i, "@")
    .replace(/\?.*$/, "");
}

function normalizeTelegramPath(pathValue = "") {
  const path = String(pathValue || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
  if (!path) return "";
  const [first, second] = path.split("/");
  if (!first || /^(c|s)$/i.test(first)) return "";
  if (/^(joinchat|\+)$/i.test(first)) return second ? `invite:${second}` : "";
  if (first.startsWith("+")) return first.length > 1 ? `invite:${first.slice(1)}` : "";
  if (/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(first)) return `@${first}`;
  return "";
}

function extractTelegramLinks(text = "") {
  const links = new Map();
  const source = String(text || "");
  for (const match of source.matchAll(/(?:https?:\/\/)?(?:t\.me|telegram\.(?:me|dog))\/([^\s<>"')\]}]+)/gi)) {
    const raw = match[0].replace(/[),.;!?]+$/, "");
    const id = normalizeTelegramPath(match[1]);
    if (!id) continue;
    links.set(id, raw.startsWith("http") ? raw : `https://${raw}`);
  }
  for (const match of source.matchAll(/(^|[\s([{])@([A-Za-z][A-Za-z0-9_]{3,31})\b/g)) {
    const id = `@${match[2]}`;
    if (!links.has(id)) links.set(id, `https://t.me/${match[2]}`);
  }
  return Array.from(links, ([id, url]) => ({ id, url }));
}

function mergeTelegramLinks(...sources) {
  const links = new Map();
  for (const source of sources.flat()) {
    if (!source) continue;
    const extracted = typeof source === "object" && source.id
      ? [source]
      : extractTelegramLinks(source);
    for (const link of extracted) {
      if (!link?.id) continue;
      links.set(link.id, { ...links.get(link.id), ...link });
    }
  }
  return Array.from(links.values());
}

function entityText(message, entity) {
  const text = String(message?.message || message?.text || "");
  const offset = Number(entity?.offset);
  const length = Number(entity?.length);
  if (!text || !Number.isFinite(offset) || !Number.isFinite(length) || length <= 0) return "";
  return text.slice(offset, offset + length);
}

function collectButtonUrls(replyMarkup) {
  const urls = [];
  for (const row of replyMarkup?.rows || []) {
    for (const button of row?.buttons || []) {
      if (button?.url) urls.push(button.url);
    }
  }
  return urls;
}

function extractMessageTelegramLinks(message) {
  const sources = [message?.message || message?.text || ""];
  for (const entity of message?.entities || []) {
    if (entity?.url) sources.push(entity.url);
    sources.push(entityText(message, entity));
  }
  sources.push(...collectButtonUrls(message?.replyMarkup));
  const webpage = message?.media?.webpage || message?.media?.webPage;
  sources.push(webpage?.url, webpage?.displayUrl, message?.media?.url);
  return mergeTelegramLinks(sources);
}

function peerId(peer) {
  if (!peer) return "";
  if (typeof peer === "string") return normalizePeer(peer);
  if (peer.username) return `@${peer.username}`;
  if (peer.channelId) return `channel:${peer.channelId}`;
  if (peer.chatId) return `chat:${peer.chatId}`;
  if (peer.userId) return `user:${peer.userId}`;
  if (peer.className === "Channel" && peer.id) return `channel:${peer.id}`;
  if (peer.className === "Chat" && peer.id) return `chat:${peer.id}`;
  if (peer.className === "User" && peer.id) return `user:${peer.id}`;
  if (peer.id) return String(peer.id);
  return "";
}

function peerLabel(peer) {
  if (!peer || typeof peer === "string") return "";
  return peer.title || [peer.firstName, peer.lastName].filter(Boolean).join(" ") || peer.username || "";
}

function peerUsername(peer) {
  return peer?.username ? String(peer.username) : "";
}

function peerUrl(peer, id = "") {
  const username = peerUsername(peer) || (id.startsWith("@") ? id.slice(1) : "");
  return username ? `https://t.me/${username}` : "";
}

function peerType(peer, id = "") {
  if (peer?.className === "Chat") return "chat";
  if (peer?.className === "Channel" && peer.megagroup) return "chat";
  if (peer?.className === "User") return "user";
  return classify(id);
}

function isoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (typeof value === "number") {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function sameTelegramId(a, b) {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  return String(a) === String(b);
}

function countFromFull(fullChat) {
  return fullChat?.participantsCount || fullChat?.membersCount || fullChat?.participants?.count || 0;
}

function memberId(user) {
  return peerId(user);
}

function participantRole(participant) {
  const className = participant?.className || "";
  if (/Creator/i.test(className)) return "creator";
  if (/Admin/i.test(className)) return "admin";
  return "member";
}

function serializeMember(user, participant = null, attrs = {}) {
  const id = memberId(user) || peerId(participant);
  if (!id) return null;
  const username = peerUsername(user);
  const role = attrs.role || participantRole(participant);
  const member = {
    id,
    name: peerLabel(user) || username || id,
    username,
    role,
    joinedAt: isoDate(participant?.date),
    rank: participant?.rank || "",
    bot: Boolean(user?.bot),
    deleted: Boolean(user?.deleted),
    activityCount: Number(attrs.activityCount || 0),
    lastSeenAt: attrs.lastSeenAt || ""
  };
  if (username) member.url = `https://t.me/${username}`;
  if (participant?.adminRights) member.adminRights = participant.adminRights.className || "admin rights";
  if (participant?.bannedRights) member.bannedRights = participant.bannedRights.className || "restricted";
  return Object.fromEntries(Object.entries(member).filter(([, value]) => value !== "" && value !== false && value !== 0));
}

function memberActivityLevel(count = 0) {
  if (count >= 25) return "high";
  if (count >= 6) return "medium";
  if (count > 0) return "low";
  return "";
}

async function collectMembers(client, Api, entity, options = {}) {
  const type = peerType(entity, peerId(entity));
  if (!["channel", "chat"].includes(type)) return { members: [], memberAccess: "not_applicable" };
  const limit = Math.max(1, Math.min(10000, Number(options.limit) || 5000));
  const members = new Map();
  let memberAccess = "partial";

  try {
    for await (const user of client.iterParticipants(entity, { limit })) {
      throwIfCancelled(options.signal);
      const member = serializeMember(user, user.participant);
      if (!member) continue;
      members.set(member.id, member);
    }
    memberAccess = members.size >= limit ? "limited" : "full";
  } catch (error) {
    throwIfCancelled(options.signal);
    memberAccess = members.size ? "partial" : "restricted";
  }

  try {
    for await (const user of client.iterParticipants(entity, { limit: 500, filter: Api.ChannelParticipantsAdmins })) {
      throwIfCancelled(options.signal);
      const member = serializeMember(user, user.participant, { role: participantRole(user.participant) || "admin" });
      if (!member) continue;
      members.set(member.id, { ...members.get(member.id), ...member });
    }
  } catch {
    throwIfCancelled(options.signal);
    // Admin listings are only available where Telegram/account permissions expose them.
  }

  const serialized = Array.from(members.values())
    .map((member) => ({
      ...member,
      activityLevel: memberActivityLevel(member.activityCount)
    }))
    .sort((a, b) => {
      const roleScore = (role) => role === "creator" ? 0 : role === "admin" ? 1 : 2;
      return roleScore(a.role) - roleScore(b.role)
        || (b.activityCount || 0) - (a.activityCount || 0)
        || String(a.name || a.id).localeCompare(String(b.name || b.id));
    });
  return { members: serialized, memberAccess, memberSampled: serialized.length >= limit };
}

function updateScanProgress(patch) {
  Object.assign(scanProgress, patch, { updatedAt: new Date().toISOString() });
}

function cancellationError(message = "Collection cancelled.") {
  const error = new Error(message);
  error.name = "AbortError";
  error.status = 499;
  error.cancelled = true;
  return error;
}

function throwIfCancelled(signal) {
  if (signal?.aborted) throw cancellationError();
}

function setupScanCancellation(req, res) {
  const controller = new AbortController();
  activeScanController = controller;
  req.on("aborted", () => controller.abort());
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller;
}

function clearActiveScan(controller) {
  if (activeScanController === controller) activeScanController = undefined;
}

function cancelActiveScan() {
  if (activeScanController && !activeScanController.signal.aborted) {
    activeScanController.abort();
  }
  updateScanProgress({ running: false, phase: "cancelled", currentTarget: "", error: "Collection cancelled." });
}

function classify(id) {
  if (id.startsWith("@")) return "channel";
  if (id.startsWith("chat:")) return "chat";
  if (id.startsWith("user:")) return "user";
  return "unknown";
}

async function profilePhotoDataUrl(client, entity, nodeId) {
  if (!entity || !nodeId || classify(nodeId) === "user") return "";
  if (profilePhotoCache.has(nodeId)) return profilePhotoCache.get(nodeId);

  try {
    const photo = await client.downloadProfilePhoto(entity, { isBig: false });
    const bytes = Buffer.isBuffer(photo) ? photo : photo ? Buffer.from(photo) : null;
    const dataUrl = bytes?.length ? `data:image/jpeg;base64,${bytes.toString("base64")}` : "";
    profilePhotoCache.set(nodeId, dataUrl);
    return dataUrl;
  } catch {
    profilePhotoCache.set(nodeId, "");
    return "";
  }
}

async function senderPhotoDataUrl(client, sender, senderId) {
  if (!sender || !senderId) return "";
  const cacheKey = `sender:${senderId}`;
  if (profilePhotoCache.has(cacheKey)) return profilePhotoCache.get(cacheKey);

  try {
    const photo = await client.downloadProfilePhoto(sender, { isBig: false });
    const bytes = Buffer.isBuffer(photo) ? photo : photo ? Buffer.from(photo) : null;
    const dataUrl = bytes?.length ? `data:image/jpeg;base64,${bytes.toString("base64")}` : "";
    profilePhotoCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch {
    profilePhotoCache.set(cacheKey, "");
    return "";
  }
}

async function nodeForEntity(client, entity, fallbackId = "", attrs = {}) {
  const id = peerId(entity) || fallbackId;
  const label = peerLabel(entity);
  const node = {
    id,
    type: peerType(entity, id),
    name: label || id,
    profile: label || id,
    title: entity?.title || "",
    username: peerUsername(entity),
    url: peerUrl(entity, id),
    createdAt: isoDate(entity?.date),
    ...attrs
  };
  if (!node.createdAt) delete node.createdAt;
  if (label) node.label = label;
  const avatarUrl = await profilePhotoDataUrl(client, entity, id);
  if (avatarUrl) {
    node.avatarUrl = avatarUrl;
    node.imageUrl = avatarUrl;
  }
  return node;
}

async function getFullChannelInfo(client, Api, entity) {
  try {
    return await client.invoke(new Api.channels.GetFullChannel({ channel: entity }));
  } catch {
    return null;
  }
}

function findChatById(chats, id) {
  return (chats || []).find((chat) => sameTelegramId(chat.id, id)) || null;
}

function findChatByPeer(chats, peer) {
  if (!peer) return null;
  const id = peer.channelId || peer.chatId || peer.userId || peer.id;
  return findChatById(chats, id);
}

async function channelMetadata(client, Api, entity, fallbackId = "", attrs = {}) {
  const full = entity?.className === "Channel"
    ? await getFullChannelInfo(client, Api, entity)
    : null;
  const node = await nodeForEntity(client, entity, fallbackId, attrs);
  const fullChat = full?.fullChat;
  if (fullChat?.about) node.description = fullChat.about;
  const count = countFromFull(fullChat);
  if (count) {
    node.memberCount = count;
    node.subscribedCount = count;
    node.membershipCount = count;
  }
  return { node, full, fullChat };
}

async function addRelationshipNode(client, nodes, nodeIds, entity, attrs = {}) {
  const node = await nodeForEntity(client, entity, "", attrs);
  if (!node.id) return null;
  const existing = nodes.get(node.id) || {};
  nodes.set(node.id, { ...existing, ...node });
  nodeIds.add(node.id);
  return node;
}

function setEdge(edges, source, target, relationship, attrs = {}) {
  if (!source || !target || source === target) return;
  const key = `${source}->${target}:${relationship}`;
  const evidence = Array.isArray(attrs.evidence)
    ? attrs.evidence
    : attrs.evidence
      ? [attrs.evidence]
      : [];
  const timestamps = [
    ...(Array.isArray(attrs.timestamps) ? attrs.timestamps : []),
    attrs.timestamp,
    attrs.forwardedAt,
    attrs.date
  ].map(isoDate).filter(Boolean);
  const existing = edges.get(key);
  if (existing) {
    existing.weight += attrs.weight || 1;
    existing.evidence.push(...evidence);
    if (timestamps.length) {
      const seen = new Set(existing.timestamps || []);
      existing.timestamps = [...(existing.timestamps || []), ...timestamps.filter((item) => !seen.has(item))]
        .sort();
      existing.firstSeenAt = existing.timestamps[0] || existing.firstSeenAt;
      existing.lastSeenAt = existing.timestamps[existing.timestamps.length - 1] || existing.lastSeenAt;
    }
    return;
  }
  const edge = {
    source,
    target,
    relationship,
    weight: attrs.weight || 1,
    evidence
  };
  if (timestamps.length) {
    edge.timestamps = [...new Set(timestamps)].sort();
    edge.firstSeenAt = edge.timestamps[0];
    edge.lastSeenAt = edge.timestamps[edge.timestamps.length - 1];
  }
  edges.set(key, edge);
}

async function collectAssociatedChat(client, Api, sourceId, fullResult, nodes, nodeIds, edges, options = {}) {
  throwIfCancelled(options.signal);
  const linkedChatId = fullResult?.fullChat?.linkedChatId;
  if (!linkedChatId) return;
  let linked = findChatById(fullResult.chats, linkedChatId);
  if (!linked) {
    try {
      linked = await client.getEntity(linkedChatId);
      throwIfCancelled(options.signal);
    } catch {
      linked = null;
    }
  }
  if (!linked) return;
  const linkedInfo = linked.className === "Channel"
    ? await channelMetadata(client, Api, linked)
    : { node: await nodeForEntity(client, linked) };
  throwIfCancelled(options.signal);
  nodes.set(linkedInfo.node.id, { ...nodes.get(linkedInfo.node.id), ...linkedInfo.node });
  nodeIds.add(linkedInfo.node.id);
  setEdge(edges, sourceId, linkedInfo.node.id, "associated_chat", {
    evidence: "linked discussion chat"
  });
}

async function collectRecommendations(client, Api, sourceId, entity, nodes, nodeIds, edges, options = {}) {
  const attempts = [];
  try {
    attempts.push(await client.getInputEntity(entity));
  } catch {
    attempts.push(entity);
  }
  if (options.globalFallback !== false) attempts.push(undefined);

  for (const channel of attempts) {
    throwIfCancelled(options.signal);
    try {
      const recommended = await client.invoke(new Api.channels.GetChannelRecommendations({ channel }));
      throwIfCancelled(options.signal);
      for (const chat of recommended.chats || []) {
        throwIfCancelled(options.signal);
        const node = await addRelationshipNode(client, nodes, nodeIds, chat);
        if (!node) continue;
        setEdge(edges, sourceId, node.id, "recommended", {
          evidence: "Telegram channel recommendation"
        });
      }
      if ((recommended.chats || []).length) return;
    } catch {
      // Recommendations are not available for every peer/account; try the next form.
    }
  }
}

async function resolveTelegramLink(client, Api, link) {
  if (!link?.id) return null;
  if (link.id.startsWith("@")) {
    try {
      const entity = await client.getEntity(link.id);
      return { node: await nodeForEntity(client, entity, link.id), entity };
    } catch {
      return {
        node: {
          id: link.id,
          type: "unknown",
          label: link.id.slice(1),
          name: link.id.slice(1),
          username: link.id.slice(1),
          url: link.url,
          linkDeadend: true
        }
      };
    }
  }

  if (!link.id.startsWith("invite:")) return null;
  const hash = link.id.slice("invite:".length);
  try {
    const checked = await client.invoke(new Api.messages.CheckChatInvite({ hash }));
    const chat = checked.chat || checked.channel;
    if (chat) {
      return { node: await nodeForEntity(client, chat, link.id, { inviteUrl: link.url }), entity: chat };
    }
    const isChannel = Boolean(checked.broadcast);
    const title = checked.title || "Telegram invite";
    return {
      node: {
        id: link.id,
        type: isChannel ? "channel" : "chat",
        label: title,
        name: title,
        title,
        url: link.url,
        inviteUrl: link.url,
        linkDeadend: true,
        privateInvite: true,
        memberCount: checked.participantsCount || 0
      }
    };
  } catch {
    return {
      node: {
        id: link.id,
        type: "chat",
        label: "Telegram invite",
        name: "Telegram invite",
        url: link.url,
        inviteUrl: link.url,
        linkDeadend: true,
        privateInvite: true
      }
    };
  }
}

async function collectTelegramLinks(client, Api, sourceId, text, nodes, nodeIds, edges, options = {}) {
  const links = Array.isArray(text) ? mergeTelegramLinks(text) : extractTelegramLinks(text);
  let found = 0;
  for (const link of links) {
    throwIfCancelled(options.signal);
    if (!link.id || link.id === sourceId) continue;
    const resolved = await resolveTelegramLink(client, Api, link);
    throwIfCancelled(options.signal);
    const node = resolved?.node;
    if (!node?.id || node.id === sourceId) continue;
    const type = node.type || classify(node.id);
    if (!["channel", "chat"].includes(type) && !node.linkDeadend) continue;
    const existing = nodes.get(node.id) || {};
    nodes.set(node.id, { ...existing, ...node });
    nodeIds.add(node.id);
    const evidence = options.evidence && options.evidence !== link.url
      ? [options.evidence, link.url]
      : options.evidence || link.url;
    setEdge(edges, sourceId, node.id, "telegram_link", {
      evidence,
      timestamp: options.timestamp
    });
    found += 1;
  }
  return found;
}

async function resolveRecommendationEntity(client, Api, node) {
  if (!node?.id || node.type === "user" || node.id.startsWith("private:")) return null;
  try {
    if (node.id.startsWith("@")) return await client.getEntity(node.id);
    if (node.id.startsWith("channel:")) {
      const channelId = Number(node.id.slice("channel:".length));
      if (Number.isFinite(channelId)) return await client.getEntity(new Api.PeerChannel({ channelId }));
    }
    if (node.id.startsWith("chat:")) {
      const chatId = Number(node.id.slice("chat:".length));
      if (Number.isFinite(chatId)) return await client.getEntity(new Api.PeerChat({ chatId }));
    }
  } catch {
    return null;
  }
  return null;
}

async function resolveChatEntity(client, Api, chat) {
  const source = normalizePeer(chat);
  if (!source || source.startsWith("private:") || source.startsWith("user:")) {
    const error = new Error("Messages can only be loaded for Telegram channels and chats.");
    error.status = 400;
    throw error;
  }
  if (source.startsWith("@")) return client.getEntity(source);
  if (source.startsWith("channel:")) {
    const channelId = Number(source.slice("channel:".length));
    if (Number.isFinite(channelId)) return client.getEntity(new Api.PeerChannel({ channelId }));
  }
  if (source.startsWith("chat:")) {
    const chatId = Number(source.slice("chat:".length));
    if (Number.isFinite(chatId)) return client.getEntity(new Api.PeerChat({ chatId }));
  }
  return client.getEntity(source);
}

async function messageSender(message) {
  if (typeof message.getSender === "function") {
    return message.getSender().catch(() => null);
  }
  return message.sender || null;
}

function extractUrls(text = "") {
  return [...String(text).matchAll(/https?:\/\/[^\s<>"']+/gi)]
    .map((match) => match[0].replace(/[),.;!?]+$/, ""))
    .filter(Boolean);
}

function mediaInfo(message, publicMessageLink = "") {
  const media = message.media;
  if (!media) return { mediaType: "", mediaTitle: "", mediaUrl: "" };
  const webpage = media.webpage || media.webPage;
  const document = media.document;
  const mediaType = media.className || document?.mimeType || "";
  const mediaTitle = webpage?.title || document?.attributes?.find?.((attr) => attr.fileName)?.fileName || mediaType;
  const mediaUrl = webpage?.url || webpage?.displayUrl || media.url || publicMessageLink || "";
  return { mediaType, mediaTitle, mediaUrl };
}

async function serializeMessage(client, message, sourceId = "") {
  const sender = await messageSender(message);
  const senderId = peerId(sender) || peerId(message.fromId) || "";
  const senderUsername = peerUsername(sender);
  const publicSource = sourceId.startsWith("@") ? sourceId.slice(1) : "";
  const link = publicSource && message.id ? `https://t.me/${publicSource}/${message.id}` : "";
  const media = mediaInfo(message, link);
  return {
    id: message.id || 0,
    date: isoDate(message.date),
    senderId,
    senderUsername,
    senderName: peerLabel(sender) || senderUsername || senderId || "Unknown sender",
    senderAvatarUrl: client ? await senderPhotoDataUrl(client, sender, senderId) : "",
    text: message.message || message.text || "",
    urls: extractUrls(message.message || message.text || ""),
    views: message.views || 0,
    forwards: message.forwards || 0,
    hasMedia: Boolean(message.media),
    mediaType: media.mediaType,
    mediaTitle: media.mediaTitle,
    mediaUrl: media.mediaUrl,
    link
  };
}

async function fetchMessages(chat, options = {}) {
  const client = await getTelegramClient();
  if (!client) {
    const error = new Error(telegramUnavailableReason || "Telegram bridge is not configured.");
    error.status = 503;
    throw error;
  }

  const { Api } = await telegramModules();
  const limit = Math.max(1, Math.min(50, Number(options.limit) || 20));
  const offsetId = Math.max(0, Number(options.offsetId) || 0);
  const entity = await resolveChatEntity(client, Api, chat);
  const sourceId = peerId(entity) || normalizePeer(chat);
  const messages = [];

  for await (const message of client.iterMessages(entity, { limit, offsetId })) {
    messages.push(await serializeMessage(client, message, sourceId));
  }

  const last = messages[messages.length - 1];
  return {
    chat: sourceId,
    messages,
    nextOffsetId: messages.length === limit && last?.id ? last.id : 0
  };
}

function normalizeTargetQuery(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^user:\d+$/i.test(raw)) return raw.toLowerCase();
  if (/^\d+$/.test(raw)) return `user:${raw}`;
  if (/^@?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(raw)) return raw.startsWith("@") ? raw : `@${raw}`;
  return raw;
}

function buildTargetMatchers(target = {}) {
  const ids = new Set([target.id, target.query].filter(Boolean).map((value) => String(value)));
  const usernames = new Set();
  const candidates = [target.username, target.query, target.id];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (!value) continue;
    if (value.startsWith("@")) usernames.add(value.slice(1).toLowerCase());
    else if (/^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(value)) usernames.add(value.toLowerCase());
  }
  return { ids, usernames };
}

async function resolveTargetProfile(client, query) {
  const normalized = normalizeTargetQuery(query);
  if (!normalized) {
    const error = new Error("Target user is required.");
    error.status = 400;
    throw error;
  }

  let entity = null;
  if (normalized.startsWith("@")) {
    try {
      entity = await client.getEntity(normalized);
    } catch {
      entity = null;
    }
  }

  if (!entity && /^user:\d+$/.test(normalized)) {
    return {
      query: normalized,
      id: normalized,
      username: "",
      name: normalized,
      avatarUrl: "",
      resolved: false,
      matchers: buildTargetMatchers({ query: normalized, id: normalized })
    };
  }

  if (!entity) {
    const error = new Error("Could not resolve that target user. Use @username or a Telegram user id.");
    error.status = 404;
    throw error;
  }

  const id = peerId(entity) || normalized;
  const username = peerUsername(entity);
  const name = peerLabel(entity) || username || id;
  return {
    query: normalized,
    id,
    username,
    name,
    avatarUrl: await senderPhotoDataUrl(client, entity, id),
    resolved: true,
    matchers: buildTargetMatchers({ query: normalized, id, username })
  };
}

function targetMatchesMember(member, target) {
  if (!member) return false;
  if (target.matchers.ids.has(String(member.id || ""))) return true;
  const username = String(member.username || "").replace(/^@/, "").toLowerCase();
  return Boolean(username && target.matchers.usernames.has(username));
}

function targetMatchesMessage(message, target) {
  if (!message) return false;
  if (target.matchers.ids.has(String(message.senderId || ""))) return true;
  const username = String(message.senderUsername || "").replace(/^@/, "").toLowerCase();
  return Boolean(username && target.matchers.usernames.has(username));
}

async function analyzeTargetAcrossDirectory(body = {}, options = {}) {
  const client = await getTelegramClient();
  if (!client) {
    const error = new Error(telegramUnavailableReason || "Telegram bridge is not configured.");
    error.status = 503;
    throw error;
  }

  const { Api } = await telegramModules();
  const signal = options.signal;
  const directory = Array.isArray(body.chats) ? body.chats : [];
  const messageLimit = Math.max(25, Math.min(100000, Number(body.messageLimit) || 1000));
  if (!directory.length) {
    const error = new Error("Directory is empty. Create a directory from the graph first.");
    error.status = 400;
    throw error;
  }

  const target = await resolveTargetProfile(client, body.target);
  const startedAt = new Date().toISOString();
  const chats = [];
  const posts = [];

  for (const item of directory) {
    throwIfCancelled(signal);
    const seedId = normalizePeer(item?.id || "");
    if (!seedId) continue;

    try {
      const entity = await resolveChatEntity(client, Api, seedId);
      throwIfCancelled(signal);
      const chatId = peerId(entity) || seedId;
      const chatLabel = item?.label || peerLabel(entity) || chatId;
      const chatType = peerType(entity, chatId);
      if (!["channel", "chat"].includes(chatType)) continue;

      const memberResult = await collectMembers(client, Api, entity, { signal, limit: 5000 });
      const matchedMember = memberResult.members.find((member) => targetMatchesMember(member, target)) || null;
      let postCount = 0;
      let lastPostAt = "";

      let scannedMessages = 0;
      let limitReached = false;
      for await (const message of client.iterMessages(entity, { limit: messageLimit + 1 })) {
        throwIfCancelled(signal);
        if (scannedMessages >= messageLimit) {
          limitReached = true;
          break;
        }
        scannedMessages += 1;
        const senderId = peerId(message.fromId);
        const senderUsername = String(message.postAuthor || "");
        const senderMatch = target.matchers.ids.has(String(senderId || ""))
          || (senderUsername && target.matchers.usernames.has(senderUsername.replace(/^@/, "").toLowerCase()));
        if (!senderMatch) {
          const serialized = {
            senderId,
            senderUsername
          };
          if (!targetMatchesMessage(serialized, target)) continue;
        }

        const serialized = await serializeMessage(client, message, chatId);
        if (!targetMatchesMessage(serialized, target)) continue;
        posts.push({
          ...serialized,
          chatId,
          chatLabel,
          chatType,
          membership: matchedMember ? "member" : memberResult.memberAccess === "restricted" ? "unknown" : "not_member"
        });
        postCount += 1;
        if (serialized.date && (!lastPostAt || serialized.date > lastPostAt)) lastPostAt = serialized.date;
      }

      chats.push({
        chatId,
        chatLabel,
        chatType,
        chatUrl: item?.url || peerUrl(entity, chatId) || "",
        memberCount: Number(item?.memberCount || 0),
        listedMemberCount: Number(memberResult.members.length || 0),
        memberAccess: memberResult.memberAccess || "unknown",
        isMember: Boolean(matchedMember),
        hasActivity: postCount > 0,
        postCount,
        scannedMessages,
        messageLimit,
        limitReached,
        lastPostAt,
        matchedMember: matchedMember || null
      });
    } catch (error) {
      chats.push({
        chatId: seedId,
        chatLabel: item?.label || seedId,
        chatType: item?.type || classify(seedId),
        chatUrl: item?.url || "",
        memberCount: Number(item?.memberCount || 0),
        listedMemberCount: 0,
        memberAccess: "error",
        isMember: false,
        hasActivity: false,
        postCount: 0,
        scannedMessages: 0,
        messageLimit,
        limitReached: false,
        lastPostAt: "",
        error: error.message
      });
    }
  }

  posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.id || 0) - Number(a.id || 0));
  chats.sort((a, b) => Number(b.postCount || 0) - Number(a.postCount || 0) || String(a.chatLabel || a.chatId).localeCompare(String(b.chatLabel || b.chatId)));

  return {
    target: {
      query: target.query,
      id: target.id,
      username: target.username,
      name: target.name,
      avatarUrl: target.avatarUrl,
      resolved: target.resolved
    },
    summary: {
      startedAt,
      completedAt: new Date().toISOString(),
      directoryCount: chats.length,
      membershipCount: chats.filter((chat) => chat.isMember).length,
      activeChats: chats.filter((chat) => chat.hasActivity).length,
      postCount: posts.length,
      messageLimit,
      scannedMessages: chats.reduce((total, chat) => total + Number(chat.scannedMessages || 0), 0),
      limitReached: chats.some((chat) => chat.limitReached),
      limitReachedChats: chats.filter((chat) => chat.limitReached).length,
      errorCount: chats.filter((chat) => chat.error).length
    },
    chats,
    posts
  };
}

async function collectMappedRecommendations(client, Api, nodes, nodeIds, edges, checkedIds = new Set(), options = {}) {
  const candidates = Array.from(nodes.values());
  const beforeEdgeCount = edges.size;

  for (const node of candidates) {
    throwIfCancelled(options.signal);
    if (!node?.id || checkedIds.has(node.id)) continue;
    const type = node.type && node.type !== "unknown" ? node.type : classify(node.id);
    if (!["channel", "chat"].includes(type)) continue;
    checkedIds.add(node.id);

    const entity = await resolveRecommendationEntity(client, Api, node);
    throwIfCancelled(options.signal);
    if (!entity) continue;
    await collectRecommendations(client, Api, node.id, entity, nodes, nodeIds, edges, { globalFallback: false, signal: options.signal });
  }

  return edges.size - beforeEdgeCount;
}

async function collectPeerRecommendations(client, Api, sourceId, nodes, nodeIds, edges, options = {}) {
  throwIfCancelled(options.signal);
  try {
    const recommended = await client.invoke(new Api.channels.GetChannelRecommendations({}));
    throwIfCancelled(options.signal);
    for (const chat of recommended.chats || []) {
      throwIfCancelled(options.signal);
      const node = await addRelationshipNode(client, nodes, nodeIds, chat);
      if (!node) continue;
      setEdge(edges, sourceId, node.id, "recommended", {
        evidence: "Telegram channel recommendation"
      });
    }
  } catch {
    // Global recommendations are optional and may not be returned for every account.
  }
}

async function collectPublicForwards(client, Api, sourceId, entity, sourceMessage, nodes, nodeIds, edges, options = {}) {
  throwIfCancelled(options.signal);
  const forwardCount = Number(sourceMessage?.forwards || 0);
  if (!sourceMessage?.id || forwardCount <= 0) return 0;

  let found = 0;
  let offset = "";
  do {
    throwIfCancelled(options.signal);
    let result;
    try {
      result = await client.invoke(new Api.stats.GetMessagePublicForwards({
        channel: entity,
        msgId: sourceMessage.id,
        offset,
        limit: 100
      }));
      throwIfCancelled(options.signal);
    } catch {
      throwIfCancelled(options.signal);
      return found;
    }

    for (const item of result.forwards || []) {
      throwIfCancelled(options.signal);
      const forwardedMessage = item.message;
      if (!forwardedMessage) continue;
      const destination = findChatByPeer(result.chats, forwardedMessage.peerId)
        || findChatByPeer(result.chats, forwardedMessage.toId);
      if (!destination) continue;
      const node = await addRelationshipNode(client, nodes, nodeIds, destination);
      throwIfCancelled(options.signal);
      if (!node) continue;
      const evidence = sourceId.startsWith("@")
        ? `https://t.me/${sourceId.slice(1)}/${sourceMessage.id}`
        : `${sourceId}/${sourceMessage.id}`;
      setEdge(edges, sourceId, node.id, "forward", { evidence, timestamp: forwardedMessage.date || sourceMessage.date });
      found += 1;
    }

    offset = result.nextOffset || "";
  } while (offset);

  return found;
}

function evidenceFor(targetId, message) {
  if (!message.id) return "forwarded message";
  if (targetId.startsWith("@")) return `https://t.me/${targetId.slice(1)}/${message.id}`;
  return `${targetId}/${message.id}`;
}

async function resolveForwardOrigin(client, message) {
  const forwarded = message.fwdFrom || message.forward?.originalFwd || message.forward;
  if (!forwarded) return null;

  const direct = peerId(forwarded.savedFromPeer)
    || peerId(forwarded.fromId);
  if (direct && !direct.startsWith("channel:") && !direct.startsWith("chat:") && !direct.startsWith("user:")) {
    return { id: direct };
  }

  const candidate = forwarded.savedFromPeer || forwarded.fromId;
  if (candidate) {
    try {
      const entity = await client.getEntity(candidate);
      return { id: peerId(entity) || direct, entity };
    } catch {
      return direct ? { id: direct } : null;
    }
  }

  const channelId = forwarded.channelId;
  if (channelId) {
    try {
      const { Api } = await telegramModules();
      const entity = await client.getEntity(new Api.PeerChannel({ channelId }));
      return { id: peerId(entity) || `channel:${channelId}`, entity };
    } catch {
      return { id: `channel:${channelId}` };
    }
  }

  const fromName = forwarded.fromName;
  if (fromName) {
    const safeName = String(fromName).trim().replace(/\s+/g, " ");
    if (safeName) return { id: `private:${safeName}`, label: safeName };
  }
  return direct ? { id: direct } : null;
}

async function collectForwards(chat, options = {}) {
  const emit = typeof options.emit === "function" ? options.emit : () => {};
  const signal = options.signal;
  throwIfCancelled(signal);
  const client = await getTelegramClient();
  throwIfCancelled(signal);
  if (!client) {
    const error = new Error(telegramUnavailableReason || "Telegram bridge is not configured.");
    error.status = 503;
    throw error;
  }

  const { Api } = await telegramModules();
  const source = normalizePeer(chat);
  updateScanProgress({
    running: true,
    phase: "resolving",
    chat: source,
    chatId: "",
    scannedMessages: 0,
    totalMessages: 0,
    forwardsFound: 0,
    nodesFound: 0,
    currentTarget: source,
    startedAt: new Date().toISOString(),
    error: ""
  });
  const entity = await client.getEntity(source);
  throwIfCancelled(signal);
  const sourceId = peerId(entity) || source;
  const sourceInfo = await channelMetadata(client, Api, entity, sourceId, { seed: true });
  throwIfCancelled(signal);
  updateScanProgress({ phase: "members", chatId: sourceId, nodesFound: 1 });
  const memberResult = await collectMembers(client, Api, entity, { signal });
  if (memberResult.members.length || memberResult.memberAccess) {
    sourceInfo.node.members = memberResult.members;
    sourceInfo.node.memberAccess = memberResult.memberAccess;
    sourceInfo.node.memberSampled = Boolean(memberResult.memberSampled);
    sourceInfo.node.memberListCount = memberResult.members.length;
    if (!sourceInfo.node.memberCount && memberResult.members.length) sourceInfo.node.memberCount = memberResult.members.length;
  }
  const nodes = new Map([[sourceInfo.node.id, sourceInfo.node]]);
  const nodeIds = new Set(nodes.keys());
  const edges = new Map();
  updateScanProgress({ phase: "metadata", chatId: sourceId, nodesFound: nodeIds.size });
  emit({ type: "metadata", data: { nodes: [sourceInfo.node], edges: [], scanned: [] } });
  await collectAssociatedChat(client, Api, sourceId, sourceInfo.full, nodes, nodeIds, edges, { signal });
  await collectTelegramLinks(client, Api, sourceId, sourceInfo.node.description || "", nodes, nodeIds, edges, {
    signal,
    evidence: "channel bio t.me link"
  });
  await collectRecommendations(client, Api, sourceId, entity, nodes, nodeIds, edges, { signal });
  if (![...edges.values()].some((edge) => edge.relationship === "recommended")) {
    await collectPeerRecommendations(client, Api, sourceId, nodes, nodeIds, edges, { signal });
  }
  emit({ type: "relationships", data: { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()), scanned: [] } });
  updateScanProgress({ phase: "messages", totalMessages: 0, nodesFound: nodeIds.size });

  let scannedMessages = 0;
  const memberActivity = new Map();
  for await (const message of client.iterMessages(entity, { limit: undefined })) {
    throwIfCancelled(signal);
    scannedMessages += 1;
    const senderKey = peerId(message.fromId);
    if (senderKey && senderKey.startsWith("user:")) {
      const current = memberActivity.get(senderKey) || { count: 0, lastSeenAt: "" };
      const date = isoDate(message.date);
      current.count += 1;
      if (date && (!current.lastSeenAt || date > current.lastSeenAt)) current.lastSeenAt = date;
      memberActivity.set(senderKey, current);
    }
    const origin = await resolveForwardOrigin(client, message);
    throwIfCancelled(signal);
    const publicForwardCount = await collectPublicForwards(client, Api, sourceId, entity, message, nodes, nodeIds, edges, { signal });
    const textLinkCount = await collectTelegramLinks(
      client,
      Api,
      sourceId,
      extractMessageTelegramLinks(message),
      nodes,
      nodeIds,
      edges,
      { signal, evidence: evidenceFor(sourceId, message), timestamp: message.date }
    );
    updateScanProgress({ scannedMessages });
    if (origin?.id) {
      const evidence = evidenceFor(sourceId, message);
      if (!nodeIds.has(origin.id)) {
        const originNode = origin.entity
          ? await nodeForEntity(client, origin.entity, origin.id)
          : { id: origin.id, type: classify(origin.id), label: origin.label || origin.id, name: origin.label || origin.id };
        nodes.set(origin.id, originNode);
        nodeIds.add(origin.id);
      }
      setEdge(edges, origin.id, sourceId, "forward", { evidence, timestamp: message.date });
      emit({
        type: "forward",
        data: {
          nodes: [nodes.get(origin.id)].filter(Boolean),
          edges: [edges.get(`${origin.id}->${sourceId}:forward`)].filter(Boolean),
          scanned: []
        }
      });
    }
    if (textLinkCount) {
      emit({ type: "relationships", data: { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()), scanned: [] } });
    }
    updateScanProgress({
      forwardsFound: scanProgress.forwardsFound + (origin?.id ? 1 : 0) + publicForwardCount + textLinkCount,
      nodesFound: nodeIds.size,
      currentTarget: origin?.id || sourceId
    });
  }

  if (memberActivity.size) {
    const sourceNode = nodes.get(sourceId) || sourceInfo.node;
    const members = new Map((sourceNode.members || []).map((member) => [member.id, member]));
    for (const [id, activity] of memberActivity) {
      const existing = members.get(id) || { id, name: id, role: "member" };
      members.set(id, {
        ...existing,
        activityCount: (existing.activityCount || 0) + activity.count,
        activityLevel: memberActivityLevel((existing.activityCount || 0) + activity.count),
        lastSeenAt: activity.lastSeenAt || existing.lastSeenAt || ""
      });
    }
    sourceNode.members = Array.from(members.values())
      .sort((a, b) => (b.activityCount || 0) - (a.activityCount || 0) || String(a.name || a.id).localeCompare(String(b.name || b.id)));
    sourceNode.memberListCount = sourceNode.members.length;
    sourceNode.messageCount = scannedMessages;
    nodes.set(sourceId, sourceNode);
    emit({ type: "members", data: { nodes: [sourceNode], edges: [], scanned: [] } });
  }

  updateScanProgress({ phase: "recommendations", currentTarget: sourceId });
  throwIfCancelled(signal);
  const recommendationEdgesAdded = await collectMappedRecommendations(client, Api, nodes, nodeIds, edges, new Set([sourceId]), { signal });
  if (recommendationEdgesAdded) {
    emit({ type: "relationships", data: { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()), scanned: [] } });
  }
  updateScanProgress({ running: false, phase: "done", scannedMessages, totalMessages: scannedMessages, nodesFound: nodeIds.size });
  const result = { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()), scanned: [sourceId] };
  emit({ type: "done", data: result });
  return result;
}

function sendNdjson(res, event) {
  res.write(`${JSON.stringify(event)}\n`);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function isLocalRequest(req) {
  const remote = req.socket.remoteAddress || "";
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote);
}

async function shutdownServer(res) {
  sendJson(res, 200, { ok: true, message: "Telerecon local server is shutting down." });
  await cancelAuthFlow();
  await resetTelegramClient();
  setTimeout(() => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  }, 100).unref();
}

async function shutdownIfBrowserClosed() {
  if (!heartbeatStarted || Date.now() - lastHeartbeatAt < heartbeatTimeoutMs) return;
  console.log("No browser heartbeat received; shutting down Telerecon local server.");
  await cancelAuthFlow();
  await resetTelegramClient();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleApi(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/heartbeat") {
    if (!isLocalRequest(req)) {
      sendJson(res, 403, { error: "Heartbeat is only allowed from localhost." });
      return;
    }
    heartbeatStarted = true;
    lastHeartbeatAt = Date.now();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/shutdown") {
    if (!isLocalRequest(req)) {
      sendJson(res, 403, { error: "Shutdown is only allowed from localhost." });
      return;
    }
    await shutdownServer(res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    const status = await telegramConfigStatus();
    const clientReady = Boolean(activeClient);
    const dependencyReady = await fs.access(path.join(__dirname, "node_modules", "telegram")).then(() => true).catch(() => false);
    sendJson(res, 200, {
      ready: clientReady,
      configured: status.configured,
      dependencyReady,
      mode: status.configured ? "telegram" : "manual",
      missing: status.missing,
      reason: !dependencyReady
        ? missingGramJsMessage
        : status.configured
        ? telegramUnavailableReason || (clientReady ? "" : "Telegram credentials are saved. Automation will connect when first used.")
        : `Manual mode. Add ${status.missing.join(", ")} in Settings to enable Telegram automation.`
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/progress") {
    sendJson(res, 200, scanProgress);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/cancel") {
    if (!isLocalRequest(req)) {
      sendJson(res, 403, { error: "Cancellation is only allowed from localhost." });
      return;
    }
    cancelActiveScan();
    sendJson(res, 200, { ok: true, cancelled: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/messages") {
    try {
      const chat = url.searchParams.get("chat") || "";
      const limit = url.searchParams.get("limit") || 20;
      const offsetId = url.searchParams.get("offsetId") || 0;
      sendJson(res, 200, await fetchMessages(chat, { limit, offsetId }));
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/target") {
    const controller = setupScanCancellation(req, res);
    try {
      const body = await readJson(req);
      sendJson(res, 200, await analyzeTargetAcrossDirectory(body, { signal: controller.signal }));
    } catch (error) {
      const cancelled = error.cancelled || error.name === "AbortError" || controller.signal.aborted;
      if (res.destroyed) return;
      sendJson(res, error.status || 500, { error: cancelled ? "Target analysis cancelled." : error.message });
    } finally {
      clearActiveScan(controller);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    const settings = await loadSettings();
    const config = await telegramConfig();
    sendJson(res, 200, {
      hasApiId: Boolean(config.apiId),
      hasApiHash: Boolean(config.apiHash),
      hasSession: Boolean(config.session),
      apiIdPreview: config.apiId ? String(config.apiId) : "",
      sources: config.sources,
      path: settingsPath,
      storedAt: settings.updatedAt || ""
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/settings") {
    try {
      const body = await readJson(req);
      if (body.clear) {
        await clearSettings();
      } else {
        const apiId = String(body.apiId || "").trim();
        const apiHash = String(body.apiHash || "").trim();
        const session = String(body.session || "").trim();
        if (apiId && !/^\d+$/.test(apiId)) {
          sendJson(res, 400, { error: "API ID must be numeric." });
          return;
        }
        await saveSettings({ apiId, apiHash, session });
      }
      await resetTelegramClient();
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/start") {
    try {
      const body = await readJson(req);
      sendJson(res, 200, await startTelegramAuth(body));
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/code") {
    try {
      const body = await readJson(req);
      sendJson(res, 200, await submitTelegramCode(body));
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/password") {
    try {
      const body = await readJson(req);
      sendJson(res, 200, await submitTelegramPassword(body));
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/cancel") {
    await cancelAuthFlow();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/forwards") {
    const controller = setupScanCancellation(req, res);
    try {
      const body = await readJson(req);
      throwIfCancelled(controller.signal);
      if (body.stream) {
        res.writeHead(200, {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff"
        });
        await collectForwards(body.chat, { signal: controller.signal, emit: (event) => sendNdjson(res, event) });
        res.end();
        return;
      }
      const data = await collectForwards(body.chat, { signal: controller.signal });
      sendJson(res, 200, data);
    } catch (error) {
      const cancelled = error.cancelled || error.name === "AbortError" || controller.signal.aborted;
      updateScanProgress({
        running: false,
        phase: cancelled ? "cancelled" : "error",
        currentTarget: "",
        error: cancelled ? "Collection cancelled." : error.message
      });
      if (res.destroyed) return;
      if (!res.headersSent) {
        sendJson(res, error.status || 500, { error: error.message });
      } else if (cancelled) {
        sendNdjson(res, { type: "cancelled", error: "Collection cancelled." });
        res.end();
      } else {
        sendNdjson(res, { type: "error", error: error.message });
        res.end();
      }
    } finally {
      clearActiveScan(controller);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/snowball") {
    const controller = setupScanCancellation(req, res);
    try {
      const body = await readJson(req);
      throwIfCancelled(controller.signal);
      const seed = normalizePeer(body.seed);
      const depth = Math.max(1, Math.min(4, Number(body.depth) || 2));
      const queue = [{ chat: seed, depth: 0 }];
      const seen = new Set();
      const nodes = new Map();
      const edges = new Map();

      while (queue.length && seen.size < 80) {
        throwIfCancelled(controller.signal);
        const item = queue.shift();
        if (!item || seen.has(item.chat) || item.depth >= depth) continue;
        seen.add(item.chat);
        const data = await collectForwards(item.chat, { signal: controller.signal });
        throwIfCancelled(controller.signal);
        for (const node of data.nodes) nodes.set(node.id, { ...nodes.get(node.id), ...node });
        for (const edge of data.edges) {
          const relationship = edge.relationship || "forward";
          const key = `${edge.source}->${edge.target}:${relationship}`;
          const existing = edges.get(key);
          if (existing) {
            existing.weight += edge.weight;
            existing.evidence.push(...(edge.evidence || []));
            const seenTimes = new Set(existing.timestamps || []);
            const nextTimes = (edge.timestamps || []).filter((item) => !seenTimes.has(item));
            if (nextTimes.length) {
              existing.timestamps = [...(existing.timestamps || []), ...nextTimes].sort();
              existing.firstSeenAt = existing.timestamps[0] || existing.firstSeenAt;
              existing.lastSeenAt = existing.timestamps[existing.timestamps.length - 1] || existing.lastSeenAt;
            }
          } else {
            edges.set(key, edge);
          }
          const candidates = relationship === "forward"
            ? [edge.source]
            : ["associated_chat", "telegram_link"].includes(relationship)
              ? [edge.target]
              : [];
          for (const candidate of candidates) {
            const node = nodes.get(candidate);
            const type = node?.type || classify(candidate);
            if (!["channel", "chat"].includes(type)) continue;
            if (!candidate.startsWith("@") && !candidate.startsWith("chat:") && !candidate.startsWith("channel:")) continue;
            if (!seen.has(candidate)) queue.push({ chat: candidate, depth: item.depth + 1 });
          }
        }
      }

      sendJson(res, 200, {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edges.values()),
        scanned: Array.from(seen)
      });
    } catch (error) {
      const cancelled = error.cancelled || error.name === "AbortError" || controller.signal.aborted;
      updateScanProgress({
        running: false,
        phase: cancelled ? "cancelled" : "error",
        currentTarget: "",
        error: cancelled ? "Collection cancelled." : error.message
      });
      if (res.destroyed) return;
      if (!res.headersSent) sendJson(res, error.status || 500, { error: cancelled ? "Collection cancelled." : error.message });
    } finally {
      clearActiveScan(controller);
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

async function serveStatic(req, res, url) {
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(__dirname, requested));
  const relativePath = path.relative(__dirname, filePath);
  const hasHiddenSegment = relativePath.split(path.sep).some((segment) => segment.startsWith("."));
  if (!filePath.startsWith(__dirname) || hasHiddenSegment) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }
  await serveStatic(req, res, url);
});

function shouldOpenBrowser() {
  const value = String(process.env.OPEN_BROWSER ?? "1").toLowerCase();
  return !["0", "false", "no", "off"].includes(value);
}

function openBrowser(url) {
  if (!shouldOpenBrowser()) return;

  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });

  child.on("error", () => {
    console.log(`Could not open a browser automatically. Open ${url} manually.`);
  });
  child.unref();
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use on ${host}. Close the existing Telerecon window or run with a different port:`);
    console.error(`  PORT=${port + 1} python3 telerecon.py`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`Telerecon browser mapper running at ${url}`);
  setInterval(shutdownIfBrowserClosed, 5000).unref();
  openBrowser(url);
});

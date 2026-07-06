const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const UserBlock = require("../models/UserBlock");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitToUser } = require("../socket");

// === GET /api/messages/conversations ===
// Conversations are keyed by the OTHER participant (user pair), not by task,
// so multiple tasks between the same two people collapse into a single chat.
exports.listConversations = async (req, res) => {
  const list = await Conversation.find({ participants: req.user._id })
    .populate("participants", "firstName lastName email profilePicture")
    .populate("task", "title image")
    .sort("-lastAt");

  // ~ Dedupe by other-participant id, keeping the most recent convo ~
  const seen = new Map();
  for (const c of list) {
    const other = c.participants.find((p) => String(p._id) !== String(req.user._id));
    if (!other) continue;
    const key = String(other._id);
    if (!seen.has(key)) seen.set(key, c);
  }
  const blocks = await UserBlock.find({ blocker: req.user._id }).select("blocked");
  const blockedByMe = new Set(blocks.map((b) => String(b.blocked)));
  const blockedMeRows = await UserBlock.find({ blocked: req.user._id }).select("blocker");
  const blockedMe = new Set(blockedMeRows.map((b) => String(b.blocker)));

  const conversations = [...seen.values()].map((c) => {
    const other = c.participants.find((p) => String(p._id) !== String(req.user._id));
    const id = String(other?._id || "");
    const obj = c.toObject();
    obj.blockedByMe = blockedByMe.has(id);
    obj.blockedMe = blockedMe.has(id);
    obj.isBlocked = obj.blockedByMe || obj.blockedMe;
    return obj;
  });
  res.json({ conversations });
};

// === GET /api/messages/:conversationId ===
exports.listMessages = async (req, res) => {
  const c = await Conversation.findById(req.params.conversationId);
  if (!c) return res.status(404).json({ message: "Not found" });
  if (!c.participants.some((p) => String(p) === String(req.user._id)))
    return res.status(403).json({ message: "Forbidden" });
  const messages = await Message.find({ conversation: c._id }).sort("createdAt");
  res.json({ messages });
};

// === POST /api/messages/:conversationId ===
exports.send = async (req, res) => {
  const c = await Conversation.findById(req.params.conversationId);
  if (!c) return res.status(404).json({ message: "Not found" });
  if (!c.participants.some((p) => String(p) === String(req.user._id)))
    return res.status(403).json({ message: "Forbidden" });

  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ message: "Empty" });
  const other = c.participants.find((p) => String(p) !== String(req.user._id));
  const blocked = await UserBlock.findOne({
    $or: [
      { blocker: req.user._id, blocked: other },
      { blocker: other, blocked: req.user._id },
    ],
  });
  if (blocked) {
    return res.status(403).json({ code: "CHAT_BLOCKED", message: "Messaging is disabled until the block is removed." });
  }

  const m = await Message.create({ conversation: c._id, sender: req.user._id, text });
  c.lastMessage = text;
  c.lastAt = new Date();
  await c.save();

  // ~ realtime message fan-out + a persistent notification for the bell ~
  const sender = await User.findById(req.user._id).select("firstName lastName");
  const preview = text.length > 80 ? text.slice(0, 77) + "…" : text;
  for (const p of c.participants) {
    if (String(p) === String(req.user._id)) continue;
    emitToUser(p, "message:new", { conversationId: c._id, message: m });
    const note = await Notification.create({
      user: p,
      body: `💬 ${sender?.firstName || "Someone"}: ${preview}`,
    });
    emitToUser(p, "notification:new", note);
  }
  res.status(201).json({ message: m });
};

// === DELETE /api/messages/:conversationId ===
// Deletes the conversation + its messages (only participants can).
exports.remove = async (req, res) => {
  const c = await Conversation.findById(req.params.conversationId);
  if (!c) return res.status(404).json({ message: "Not found" });
  if (!c.participants.some((p) => String(p) === String(req.user._id)))
    return res.status(403).json({ message: "Forbidden" });
  await Message.deleteMany({ conversation: c._id });
  await c.deleteOne();
  res.json({ ok: true });
};

// === POST /api/messages/block/:userId ===
exports.block = async (req, res) => {
  if (String(req.params.userId) === String(req.user._id))
    return res.status(400).json({ message: "Cannot block yourself" });
  await UserBlock.updateOne(
    { blocker: req.user._id, blocked: req.params.userId },
    { $setOnInsert: { blocker: req.user._id, blocked: req.params.userId } },
    { upsert: true }
  );
  emitToUser(req.params.userId, "chat:block-updated", { userId: req.user._id, blocked: true });
  emitToUser(req.user._id, "chat:block-updated", { userId: req.params.userId, blocked: true });
  res.json({ ok: true });
};

// === DELETE /api/messages/block/:userId ===
exports.unblock = async (req, res) => {
  await UserBlock.deleteOne({ blocker: req.user._id, blocked: req.params.userId });
  emitToUser(req.params.userId, "chat:block-updated", { userId: req.user._id, blocked: false });
  emitToUser(req.user._id, "chat:block-updated", { userId: req.params.userId, blocked: false });
  res.json({ ok: true });
};

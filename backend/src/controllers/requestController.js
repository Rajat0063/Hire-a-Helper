const Request = require("../models/Request");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Conversation = require("../models/Conversation");
const { emitToUser } = require("../socket");

exports.received = async (req, res) => {
  const myTasks = await Task.find({ user: req.user._id }).select("_id");
  const ids = myTasks.map((t) => t._id);
  const requests = await Request.find({ task: { $in: ids } })
    .populate("task")
    .populate("requester", "firstName lastName email profilePicture")
    .sort("-createdAt");
  res.json({ requests });
};

exports.sent = async (req, res) => {
  const requests = await Request.find({ requester: req.user._id })
    .populate({ path: "task", populate: { path: "user", select: "firstName lastName profilePicture" } })
    .sort("-createdAt");
  res.json({ requests });
};

// === PATCH /api/requests/:id ===
// On "accepted" we auto-create a Conversation so the Messages page can pick it
// up, then emit realtime events to both parties.
exports.update = async (req, res) => {
  const { status } = req.body;
  const r = await Request.findById(req.params.id).populate("task");
  if (!r) return res.status(404).json({ message: "Not found" });
  if (String(r.task.user) !== String(req.user._id))
    return res.status(403).json({ message: "Forbidden" });

  r.status = status;

  if (status === "accepted" && !r.conversation) {
    // ~ Reuse existing conversation between this owner+requester pair so
    //   multiple accepted tasks between the same people share one thread ~
    let convo = await Conversation.findOne({
      participants: { $all: [r.task.user, r.requester], $size: 2 },
    });
    if (!convo) {
      convo = await Conversation.create({
        participants: [r.task.user, r.requester],
        task: r.task._id,
        request: r._id,
        lastMessage: "",
        lastAt: new Date(),
      });
    } else {
      convo.lastAt = new Date();
      await convo.save();
    }
    r.conversation = convo._id;
  }
  await r.save();

  const note = await Notification.create({
    user: r.requester,
    body: `Your request for "${r.task.title}" was ${status}`,
  });
  emitToUser(r.requester, "notification:new", note);
  emitToUser(r.requester, "request:status", { requestId: r._id, status, conversationId: r.conversation });
  emitToUser(r.task.user, "request:status", { requestId: r._id, status });

  res.json({ request: r });
};

// Haversine (km)
function distanceKm(aLat, aLng, bLat, bLng) {
  if ([aLat, aLng, bLat, bLng].some((v) => v == null || Number.isNaN(v))) return null;
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// === POST /api/requests/:id/progress ===
// Worker taps "Start work" — sends { lat, lng } from browser geolocation.
// If the task has coords and the worker is >0.5 km away we flag offSite and
// alert the owner so they can cancel or wait.
exports.checkin = async (req, res) => {
  const r = await Request.findById(req.params.id).populate("task");
  if (!r) return res.status(404).json({ message: "Not found" });
  if (String(r.requester) !== String(req.user._id))
    return res.status(403).json({ message: "Only the assigned helper can check in." });
  if (r.status !== "accepted" && r.status !== "in_progress")
    return res.status(400).json({ message: "Request must be accepted first." });

  const { lat, lng } = req.body || {};
  r.workerLat = lat ?? null;
  r.workerLng = lng ?? null;
  r.checkinAt = new Date();
  r.status = "in_progress";

  let dist = null, offSite = false;
  if (r.task.lat != null && r.task.lng != null && lat != null && lng != null) {
    dist = distanceKm(Number(lat), Number(lng), r.task.lat, r.task.lng);
    if (dist != null) {
      r.distanceKm = Math.round(dist * 100) / 100;
      offSite = dist > 0.5; // 500 m tolerance
    }
  } else if (lat == null || lng == null) {
    offSite = true; // no location shared at all
  }
  r.offSite = offSite;
  await r.save();
  await Task.findByIdAndUpdate(r.task._id, { status: "in_progress" });

  const body = offSite
    ? `⚠️ ${req.user.firstName} started "${r.task.title}" but appears to be off-site${dist != null ? ` (~${r.distanceKm} km away)` : " (no location shared)"}.`
    : `✅ ${req.user.firstName} has arrived and started "${r.task.title}".`;
  const note = await Notification.create({ user: r.task.user, body });
  emitToUser(r.task.user, "notification:new", note);
  emitToUser(r.task.user, "request:status", { requestId: r._id, status: "in_progress", offSite, distanceKm: r.distanceKm });
  res.json({ request: r });
};

// === POST /api/requests/:id/complete === (worker)
exports.complete = async (req, res) => {
  const r = await Request.findById(req.params.id).populate("task");
  if (!r) return res.status(404).json({ message: "Not found" });
  if (String(r.requester) !== String(req.user._id))
    return res.status(403).json({ message: "Only the assigned helper can complete." });
  if (!["accepted", "in_progress"].includes(r.status))
    return res.status(400).json({ message: "Request not in progress." });

  r.status = "completed";
  r.completedAt = new Date();
  await r.save();

  const note = await Notification.create({
    user: r.task.user,
    body: `🎉 ${req.user.firstName} marked "${r.task.title}" complete. Please pay ${r.task.currency || "INR"} ${r.task.paymentAmount || 0}.`,
  });
  emitToUser(r.task.user, "notification:new", note);
  emitToUser(r.task.user, "request:status", { requestId: r._id, status: "completed" });
  emitToUser(r.requester, "request:status", { requestId: r._id, status: "completed" });
  res.json({ request: r });
};

// === POST /api/requests/:id/cancel === (owner or worker)
exports.cancel = async (req, res) => {
  const r = await Request.findById(req.params.id).populate("task");
  if (!r) return res.status(404).json({ message: "Not found" });
  const isOwner = String(r.task.user) === String(req.user._id);
  const isWorker = String(r.requester) === String(req.user._id);
  if (!isOwner && !isWorker) return res.status(403).json({ message: "Forbidden" });
  if (r.paymentStatus === "paid") return res.status(400).json({ message: "Already paid — cannot cancel." });

  r.status = "cancelled";
  await r.save();
  await Task.findByIdAndUpdate(r.task._id, { status: "open" });

  const other = isOwner ? r.requester : r.task.user;
  const note = await Notification.create({
    user: other,
    body: `Request for "${r.task.title}" was cancelled by the ${isOwner ? "task owner" : "helper"}.`,
  });
  emitToUser(other, "notification:new", note);
  emitToUser(other, "request:status", { requestId: r._id, status: "cancelled" });
  res.json({ request: r });
};

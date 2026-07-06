const Task = require("../models/Task");
const Request = require("../models/Request");
const Notification = require("../models/Notification");
const Settings = require("../models/Settings");
const { emitToUser } = require("../socket");

// === GET /api/tasks ===
exports.feed = async (req, res) => {
  const q = (req.query.q || "").trim();
  const base = { status: "open" };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    base.$or = [{ title: rx }, { description: rx }, { location: rx }, { category: rx }];
  }
  const tasks = await Task.find(base)
    .populate("user", "firstName lastName profilePicture")
    .sort("-createdAt");
  res.json({ tasks });
};

// === GET /api/tasks/mine ===
exports.mine = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort("-createdAt");
  res.json({ tasks });
};

// === GET /api/tasks/:id ===
exports.getOne = async (req, res) => {
  const t = await Task.findById(req.params.id).populate("user", "firstName lastName profilePicture");
  if (!t) return res.status(404).json({ message: "Not found" });
  res.json({ task: t });
};

// === POST /api/tasks ===
exports.create = async (req, res) => {
  const {
    title, description, location, category,
    startTime, endTime, image, paymentAmount, currency, lat, lng,
  } = req.body;
  if (!image) return res.status(400).json({ message: "Task image is required" });

  const task = await Task.create({
    user: req.user._id,
    title, description, location,
    category: category || "Other",
    startTime, endTime,
    image,
    paymentAmount: Number(paymentAmount) || 0,
    currency: currency || "INR",
    lat: lat ?? null, lng: lng ?? null,
  });
  res.status(201).json({ task });
};

// === PATCH /api/tasks/:id  (owner-only) ===
exports.update = async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ message: "Not found" });
  if (String(t.user) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
  const settings = await Settings.findOne({ key: "platform" });
  if (settings && settings.allowTaskEditing === false)
    return res.status(403).json({ message: "Task editing is disabled by the platform administrator." });
  if ("image" in req.body && !req.body.image)
    return res.status(400).json({ message: "Task image is required" });

  const allowed = ["title", "description", "endTime", "paymentAmount", "image", "category", "location", "status", "lat", "lng"];
  for (const k of allowed) if (k in req.body) t[k] = req.body[k];
  await t.save();
  res.json({ task: t });
};

// === DELETE /api/tasks/:id (owner-only) ===
exports.remove = async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ message: "Not found" });
  if (String(t.user) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
  const settings = await Settings.findOne({ key: "platform" });
  if (settings && settings.allowTaskEditing === false)
    return res.status(403).json({ message: "Task editing/deletion is disabled by the platform administrator." });
  await Task.deleteOne({ _id: t._id });
  await Request.deleteMany({ task: t._id });
  res.json({ ok: true });
};

// === POST /api/tasks/:id/request ===
exports.requestTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (String(task.user) === String(req.user._id))
    return res.status(400).json({ message: "Cannot request your own task" });

  const text = (req.body?.message || "").toString().slice(0, 1000) ||
    `Hi, I'd like to help with "${task.title}".`;

  try {
    const r = await Request.create({ task: task._id, requester: req.user._id, message: text });
    const settings = await Settings.findOne({ key: "platform" });
    if (!settings || settings.pushNotifications !== false) {
      const note = await Notification.create({
        user: task.user,
        body: `${req.user.firstName} requested to help with "${task.title}"`,
      });
      emitToUser(task.user, "notification:new", note);
    }
    emitToUser(task.user, "request:new", { request: r });
    res.status(201).json({ request: r });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Already requested" });
    throw e;
  }
};

// === GET /api/tasks/nearby?lat=&lng=&radiusKm= ===
// Haversine in JS (small dataset OK). Falls back to all open tasks if no
// coords supplied. Tasks without lat/lng are excluded from the radius result.
exports.nearby = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm || "25");

  const all = await Task.find({ status: "open" })
    .populate("user", "firstName lastName profilePicture")
    .sort("-createdAt");

  if (Number.isNaN(lat) || Number.isNaN(lng)) return res.json({ tasks: all, radiusKm });

  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const withDist = all
    .filter((t) => t.lat != null && t.lng != null)
    .map((t) => {
      const dLat = toRad(t.lat - lat);
      const dLng = toRad(t.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) * Math.cos(toRad(t.lat)) * Math.sin(dLng / 2) ** 2;
      const distance = 2 * R * Math.asin(Math.sqrt(a));
      return { ...t.toObject(), distanceKm: Math.round(distance * 10) / 10 };
    })
    .filter((t) => t.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ tasks: withDist, radiusKm });
};

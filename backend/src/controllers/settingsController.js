const Settings = require("../models/Settings");
const { emitToUser, broadcastAll } = require("../socket");


async function getOrCreate() {
  let s = await Settings.findOne({ key: "platform" });
  if (!s) s = await Settings.create({ key: "platform" });
  return s;
}

// === GET /api/settings === (public — categories drive Add Task & Feed)
exports.getPublic = async (_req, res) => {
  const s = await getOrCreate();
  res.json({
    categories: s.categories,
    enableRegistrations: s.enableRegistrations,
    maintenanceMode: s.maintenanceMode,
    allowTaskEditing: s.allowTaskEditing,
    pushNotifications: s.pushNotifications,
  });
};

// === GET /api/admin/settings === (admin)
exports.getAll = async (_req, res) => {
  const s = await getOrCreate();
  res.json({ settings: s });
};

// === PATCH /api/admin/settings === (admin)
exports.update = async (req, res) => {
  const allowed = [
    "enableRegistrations", "requireEmailVerification", "allowTaskEditing",
    "pushNotifications", "maintenanceMode", "categories",
  ];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
  const before = await Settings.findOne({ key: "platform" });
  const s = await Settings.findOneAndUpdate({ key: "platform" }, patch, { new: true, upsert: true });
  // ! Log admin settings mutations to the audit trail
  try {
    const { afterSettingsUpdate } = require("./adminController");
    await afterSettingsUpdate(req, patch);
  } catch { /* non-fatal */ }
  // Maintenance mode broadcast — force all non-admin users out with a friendly
  // "we'll be right back" message.
  if (patch.maintenanceMode === true && (!before || before.maintenanceMode !== true)) {
    broadcastAll("maintenance:on", {
      message: "We're performing scheduled maintenance to improve your experience. Please check back shortly — we'll be right back!",
    });
  }
  if (patch.maintenanceMode === false && before?.maintenanceMode === true) {
    broadcastAll("maintenance:off", { message: "We're back online. Thanks for your patience!" });
  }
  emitToUser(req.user._id, "settings:updated", { settings: s });
  res.json({ settings: s });
};

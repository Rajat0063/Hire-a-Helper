const Search = require("../models/Search");
const User = require("../models/User");

// === POST /api/search/log === body: { query }
exports.log = async (req, res) => {
  const query = String(req.body?.query || "").trim().slice(0, 200);
  if (!query) return res.json({ ok: true });
  await Search.create({ user: req.user._id, query });
  await User.updateOne(
    { _id: req.user._id },
    { $inc: { "stats.searches": 1, "stats.totalActions": 1 } }
  );
  res.json({ ok: true });
};

// === GET /api/search/recent ===
exports.recent = async (req, res) => {
  const rows = await Search.find({ user: req.user._id }).sort("-createdAt").limit(20);
  res.json({ searches: rows });
};

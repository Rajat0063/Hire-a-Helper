const AssistantMessage = require("../models/AssistantMessage");
const Task = require("../models/Task");
const Request = require("../models/Request");

// === Rule-based intent matcher ===
// Kept intentionally simple — an ordered list of {intent, keywords, reply}.
// First match wins. Replies can be a string OR an async function that
// receives the requesting user and can look things up in the database, so
// answers are personalized (e.g. "You have 3 pending requests").
const INTENTS = [
  {
    intent: "greeting",
    keywords: ["hi", "hello", "hey", "yo", "namaste", "hola"],
    reply: (u) =>
      `Hi ${u.firstName}! 👋 I'm your Hire-a-Helper assistant. Ask me about posting tasks, requests, payments, messaging, notifications, or your profile.`,
  },
  {
    intent: "post_task",
    keywords: ["post task", "add task", "create task", "new task", "post a task", "how to post"],
    reply:
      "To post a task: open **Add Task** from the sidebar → fill in title, description, category, location, budget (INR) and a photo (photo is required) → click *Post Task*. Helpers nearby will see it instantly on the Feed.",
  },
  {
    intent: "find_helper",
    keywords: ["find helper", "hire", "who will help", "nearby", "find people", "find worker"],
    reply:
      "Open **Nearby Tasks** to see helpers around you on a live map, or the **Feed** to browse all open tasks. When someone requests your task, you'll get a realtime notification.",
  },
  {
    intent: "requests_status",
    keywords: ["my request", "request status", "pending", "requests", "accepted"],
    reply: async (u) => {
      const myTaskIds = (await Task.find({ user: u._id }).select("_id")).map((t) => t._id);
      const [pending, accepted, sent] = await Promise.all([
        Request.countDocuments({ task: { $in: myTaskIds }, status: "pending" }),
        Request.countDocuments({ task: { $in: myTaskIds }, status: "accepted" }),
        Request.countDocuments({ requester: u._id }),
      ]);
      return `You have **${pending} pending** and **${accepted} accepted** helper requests on your tasks, and you've sent **${sent}** requests to others. Manage them from the **Requests** and **My Requests** pages.`;
    },
  },
  {
    intent: "messages",
    keywords: ["message", "chat", "talk", "conversation"],
    reply:
      "Messaging opens automatically once a request is accepted. Go to **Messages** to chat, share details, or block/unblock a user from the right-side header menu.",
  },
  {
    intent: "payment",
    keywords: ["pay", "payment", "money", "charge", "razorpay", "upi", "invoice", "receipt"],
    reply:
      "Payments in Hire-a-Helper are in **Indian Rupees (₹)**. When a worker marks a task complete, the owner will get a *Pay* button that opens a secure Razorpay checkout. Once paid, both sides see a receipt in *Payments*.",
  },
  {
    intent: "notifications",
    keywords: ["notification", "bell", "alert"],
    reply:
      "Every request, message, review and payment update lands in your bell 🔔 at the top-right. Click it to see everything in one place — unread items are marked in red.",
  },
  {
    intent: "profile",
    keywords: ["profile", "picture", "cover", "avatar", "update profile", "edit profile"],
    reply:
      "Open **Settings → Profile** to update your photo (with the built-in cropper), cover image, phone and bio. Your public profile is what other users see when they view your card.",
  },
  {
    intent: "review",
    keywords: ["review", "rating", "rate", "stars", "feedback on user"],
    reply:
      "You can rate someone after any task is accepted between you. Click their profile from a request or message and use *Leave a review*.",
  },
  {
    intent: "otp",
    keywords: ["otp", "verify", "verification", "code"],
    reply:
      "OTPs are sent to your phone via SMS. If it doesn't arrive within 60 seconds, tap *Resend*. Make sure the number includes the country code (e.g. +91).",
  },
  {
    intent: "password",
    keywords: ["password", "forgot", "reset", "change password"],
    reply:
      "You can change your password anytime from **Settings → Security → Change Password**, or use *Forgot password* on the sign-in screen to reset it via email.",
  },
  {
    intent: "block_unblock",
    keywords: ["block", "unblock", "report"],
    reply:
      "From any chat, open the ⋮ menu on the right-side header → *Block user*. Blocking is instant and both sides can't message until you unblock again.",
  },
  {
    intent: "feedback",
    keywords: ["feedback", "complaint", "bug", "issue", "problem", "suggestion"],
    reply:
      "Use the 💬 *Send feedback* button (bottom-right of any dashboard page) to send us feedback, complaints or bug reports. Admins reply within 24h.",
  },
  {
    intent: "delete_account",
    keywords: ["delete account", "close account", "remove me", "deactivate"],
    reply:
      "You can delete your account from **Settings → Danger Zone → Delete account**. This removes your tasks, requests and messages permanently.",
  },
  {
    intent: "categories",
    keywords: ["categories", "category", "types", "kind of task"],
    reply:
      "We support 20+ categories including Cleaning, Plumbing, Electrical, Delivery, Tutoring, Photography, Repairs, Moving, Pet Care, Cooking, Gardening and more — pick one when posting a task.",
  },
  {
    intent: "thanks",
    keywords: ["thank", "thanks", "ty", "cheers"],
    reply: "You're welcome! 😊 Anything else I can help with?",
  },
];

function match(text) {
  const t = text.toLowerCase();
  for (const rule of INTENTS) {
    if (rule.keywords.some((k) => t.includes(k))) return rule;
  }
  return null;
}

const FALLBACK =
  "I'm not 100% sure I understood that. Try asking about: *posting tasks*, *requests*, *payments*, *messaging*, *notifications*, *profile*, *reviews*, *OTP*, or *feedback*. You can also use the 💬 *Send feedback* button to reach a human.";

// === GET /api/assistant/history ===
exports.history = async (req, res) => {
  const messages = await AssistantMessage.find({ user: req.user._id })
    .sort("createdAt")
    .limit(200);
  res.json({ messages });
};

// === POST /api/assistant/message  { text } ===
exports.chat = async (req, res) => {
  const text = (req.body?.text || "").toString().trim().slice(0, 1000);
  if (!text) return res.status(400).json({ message: "Empty message" });

  const userMsg = await AssistantMessage.create({
    user: req.user._id,
    role: "user",
    text,
  });

  const rule = match(text);
  let reply = FALLBACK;
  let intent = null;
  if (rule) {
    intent = rule.intent;
    reply = typeof rule.reply === "function" ? await rule.reply(req.user) : rule.reply;
  }

  const botMsg = await AssistantMessage.create({
    user: req.user._id,
    role: "assistant",
    text: reply,
    matchedIntent: intent,
  });

  res.json({ userMessage: userMsg, reply: botMsg });
};

// === DELETE /api/assistant/history ===
exports.clear = async (req, res) => {
  await AssistantMessage.deleteMany({ user: req.user._id });
  res.json({ ok: true });
};

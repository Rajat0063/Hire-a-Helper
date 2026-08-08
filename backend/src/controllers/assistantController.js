const AssistantMessage = require("../models/AssistantMessage");
const Task = require("../models/Task");
const Request = require("../models/Request");
const User = require("../models/User");
const Feedback = require("../models/Feedback");

// === Comprehensive Knowledge Base & Intent Engine ===
const INTENTS = [
  {
    intent: "greeting",
    keywords: ["hi", "hello", "hey", "yo", "namaste", "hola", "greetings", "good morning", "good evening", "who are you", "what can you do"],
    reply: (u) =>
      `Hi ${u.firstName || "there"}! 👋 I'm **HireHelper Assistant**, your interactive AI guide for the Hire-a-Helper platform.\n\nI can answer questions about:\n• **Posting & Finding Tasks** (categories, required fields, GPS location)\n• **Requests & Approvals** (how to accept/decline requests)\n• **Realtime Messaging** (chatting, blocking/unblocking)\n• **Payments** (Razorpay, currencies, receipts)\n• **Reviews & Ratings** (leaving feedback for helpers)\n• **Account & Security** (password rules, OTP, profile edit)\n• **Admin Dashboard** (user management, feedback monitoring)\n\nWhat would you like help with today?`,
  },
  {
    intent: "post_task",
    keywords: [
      "post task", "add task", "create task", "new task", "post a task", "how to post", "add a task",
      "create a task", "task posting", "publish task", "posting task"
    ],
    reply:
      "To post a task on **Hire-a-Helper**:\n\n1. Click **+ Add Task** from the sidebar/navigation.\n2. Enter the **Title** and detailed **Description** of what you need help with.\n3. Enter the **Location** (or tap *Use My GPS* for instant location).\n4. Select **Start Date & Time** (Optional: End Date & Time).\n5. Choose a **Category** (*Mandatory* - e.g. Cleaning, Plumbing, Tutoring).\n6. Set the **Payment Amount** and **Currency** (*Mandatory* - e.g. 500 INR).\n7. Upload a clear **Task Image** (*Mandatory*).\n8. Tap **Post Task** — nearby helpers will immediately see it on their Feed!",
  },
  {
    intent: "task_requirements",
    keywords: [
      "mandatory", "required fields", "image required", "category required", "payment required",
      "currency required", "what is required"
    ],
    reply:
      "When creating a task, the following fields are **strictly mandatory**:\n\n• **Title & Description**\n• **Location** (manual text or GPS auto-fill)\n• **Start Date & Start Time**\n• **Category** (e.g. Repairs, Gardening, Delivery)\n• **Payment Amount** (must be > 0)\n• **Currency** (e.g. INR ₹, USD $, EUR €, GBP £)\n• **Task Image** (JPEG, PNG, WebP up to 10MB)",
  },
  {
    intent: "find_helper",
    keywords: ["find helper", "hire", "who will help", "nearby", "find people", "find worker", "browse tasks", "feed", "search task"],
    reply:
      "You can find help or tasks in two ways:\n\n• **Feed**: Browse all active tasks posted by community members, filtered by search query or category.\n• **Nearby Tasks**: View interactive map markers showing tasks and helpers near your current GPS location.\n\nWhen you see a task you'd like to do, click **Request to Help** to notify the task creator!",
  },
  {
    intent: "requests_status",
    keywords: [
      "my request", "request status", "pending", "requests", "accepted", "declined", "incoming request", "approve request"
    ],
    reply: async (u) => {
      const myTaskIds = (await Task.find({ user: u._id }).select("_id")).map((t) => t._id);
      const [pending, accepted, sent] = await Promise.all([
        Request.countDocuments({ task: { $in: myTaskIds }, status: "pending" }),
        Request.countDocuments({ task: { $in: myTaskIds }, status: "accepted" }),
        Request.countDocuments({ requester: u._id }),
      ]);
      return `Here is your current request summary:\n\n• **Pending Requests on Your Tasks:** ${pending}\n• **Accepted Helpers:** ${accepted}\n• **Requests Sent by You:** ${sent}\n\nYou can manage incoming requests on the **Requests** tab and track your sent requests on the **My Requests** tab.`;
    },
  },
  {
    intent: "messages",
    keywords: ["message", "chat", "talk", "conversation", "send message", "chatting", "contact helper"],
    reply:
      "Messaging becomes available as soon as a helper's request is **Accepted** by the task owner.\n\n• Open **Messages** from the sidebar to chat in real-time.\n• Share specific timing, addresses, or additional task photos.\n• You can also block/unblock users directly from the top menu of any chat conversation.",
  },
  {
    intent: "payment",
    keywords: ["pay", "payment", "money", "charge", "razorpay", "upi", "invoice", "receipt", "billing", "currency", "inr"],
    reply:
      "How payments work in Hire-a-Helper:\n\n1. Task creator sets a **Payment Amount** and **Currency** (e.g., INR ₹) when posting.\n2. Once the task is finished, the owner clicks **Pay Now** on the task or payments page.\n3. Checkout opens securely via **Razorpay** (supports UPI, Google Pay, PhonePe, Cards, Net Banking).\n4. After payment, a downloadable receipt is saved in **Payments**.",
  },
  {
    intent: "notifications",
    keywords: ["notification", "bell", "alert", "unread", "updates"],
    reply:
      "Look for the bell icon 🔔 at the top-right header.\n\nYou receive instant alerts when:\n• Someone requests to help on your task.\n• A task owner accepts or declines your request.\n• You receive a new chat message.\n• A payment or review is completed.",
  },
  {
    intent: "profile",
    keywords: ["profile", "picture", "cover", "avatar", "update profile", "edit profile", "phone number", "bio"],
    reply:
      "Go to **Settings → Profile** to:\n\n• Change your **Avatar / Profile Picture** (includes image cropper).\n• Update your **Cover Photo** and **Bio**.\n• Add or edit your **Phone Number**.\n• View your public profile as seen by other users.",
  },
  {
    intent: "review",
    keywords: ["review", "rating", "rate", "stars", "feedback on user", "leave review", "recommend"],
    reply:
      "After an accepted task is completed:\n\n1. Open the user's **Public Profile** (accessible from requests or messages).\n2. Click **Leave a Review**.\n3. Choose 1 to 5 stars and write a short summary.\n4. Their overall rating average updates automatically!",
  },
  {
    intent: "security_password",
    keywords: [
      "password", "forgot", "reset", "change password", "strong password", "eye", "show password",
      "password strength", "password requirements"
    ],
    reply:
      "Password & Security Features:\n\n• **Signup Password Generator**: Tap *Suggest Strong* on the signup form to auto-generate a secure high-entropy password.\n• **Password Eye Toggle**: Tap the eye icon 👁️ in any password field to show/hide text.\n• **Change Password**: Go to **Settings → Security** while logged in to update your password.",
  },
  {
    intent: "phone_and_otp",
    keywords: ["phone", "phone number", "otp", "verify", "verification", "sms", "country code"],
    reply:
      "Phone numbers can be entered during signup or under **Settings → Profile**. For SMS verification, ensure you include your full international format (e.g., +91 for India, +1 for US).",
  },
  {
    intent: "block_unblock",
    keywords: ["block", "unblock", "report", "spam", "harassment"],
    reply:
      "To block someone:\n1. Open the chat conversation in **Messages**.\n2. Click the three dots ⋮ in the top right header.\n3. Select **Block User**.\n\nBlocked users cannot message you or request your tasks. You can unblock them anytime from the same menu.",
  },
  {
    intent: "feedback",
    keywords: ["feedback", "complaint", "bug", "issue", "problem", "suggestion", "praise", "widget", "send feedback"],
    reply:
      "You can send feedback anytime using the floating **Feedback** widget in the corner of your screen!\n\n• Choose a category (*Bug, Suggestion, Praise, Complaint, Other*).\n• Write your message and optional 1-5 star rating.\n• Submissions are monitored live by administrators on the Admin Dashboard.",
  },
  {
    intent: "admin_mode",
    keywords: ["admin", "admin dashboard", "moderation", "manage users", "feedback monitoring", "platform settings"],
    reply: async (u) => {
      if (u.role === "admin") {
        const [totalUsers, totalTasks, totalFb, newFb] = await Promise.all([
          User.countDocuments(),
          Task.countDocuments(),
          Feedback.countDocuments(),
          Feedback.countDocuments({ $or: [{ status: "new" }, { status: { $exists: false } }] }),
        ]);
        return `Hello **Admin ${u.firstName}**! 🛡️\n\nYour Admin Dashboard status:\n• **Total Registered Users:** ${totalUsers}\n• **Total Tasks:** ${totalTasks}\n• **User Feedbacks:** ${totalFb} (${newFb} unreviewed)\n\nUse the **Admin** link in the sidebar to block/unblock users, moderate tasks, review feedback with admin notes, and configure platform settings.`;
      }
      return "The **Admin Dashboard** is reserved for platform administrators to moderate tasks, manage user accounts, inspect feedback submissions, and configure platform settings.";
    },
  },
  {
    intent: "delete_account",
    keywords: ["delete account", "close account", "remove me", "deactivate"],
    reply:
      "To permanently delete your account:\nGo to **Settings → Danger Zone → Delete Account**.\n\n*Warning*: This permanently deletes your profile, posted tasks, sent requests, and chat history.",
  },
  {
    intent: "categories",
    keywords: ["categories", "category", "types", "kind of task", "services"],
    reply:
      "Hire-a-Helper supports a wide array of task categories:\n\n• Cleaning & Housework\n• Plumbing & Repairs\n• Electrical\n• Gardening & Lawn Care\n• Delivery & Errands\n• Tutoring & Lessons\n• Moving & Heavy Lifting\n• Photography & Video\n• Cooking & Catering\n• Pet Care\n• Electronics & Tech Support\n• Other Custom Tasks",
  },
  {
    intent: "thanks",
    keywords: ["thank", "thanks", "ty", "cheers", "awesome", "great", "helpful"],
    reply: "You're very welcome! 😊 Feel free to minimize or dock me in the corner whenever you don't need me.",
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
  "I'm here to answer any questions about **Hire-a-Helper**!\n\nYou can ask me about:\n• *How to post a task with mandatory fields*\n• *Finding helpers & browsing the Feed*\n• *Accepting or declining requests*\n• *Realtime chat & blocking users*\n• *Razorpay payments & receipts*\n• *Password generator & eye toggle*\n• *Sending feedback & bug reports*\n• *Admin moderation*\n\nHow can I assist you?";

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

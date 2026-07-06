// === Razorpay checkout loader ===
// Loads the Razorpay Checkout script on demand and opens the pay dialog.
// Backend returns { simulated, keyId, order } from POST /api/payments/order.
import api from "../services/api";
import toast from "react-hot-toast";

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export async function payWithRazorpay({ request, user, onSuccess }) {
  try {
    const { data } = await api.post("/payments/order", { requestId: request._id });

    // Dev fallback — no keys configured, just simulate the success round-trip.
    if (data.simulated) {
      await api.post("/payments/verify", { requestId: request._id });
      toast.success("Payment simulated (dev mode) — task marked paid.");
      onSuccess?.();
      return;
    }

    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) return toast.error("Couldn't load Razorpay. Check your connection.");

    const rz = new window.Razorpay({
      key: data.keyId,
      amount: data.order.amount,
      currency: data.order.currency,
      order_id: data.order.id,
      name: "HireHelper",
      description: request.task?.title || "Task payment",
      prefill: {
        name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        email: user?.email || "",
      },
      theme: { color: "#2563eb" },
      handler: async (resp) => {
        try {
          await api.post("/payments/verify", { requestId: request._id, ...resp });
          toast.success("Payment successful! 🎉");
          onSuccess?.();
        } catch (e) {
          toast.error(e.response?.data?.message || "Payment verification failed");
        }
      },
      modal: {
        ondismiss: () => toast("Payment cancelled", { icon: "ℹ️" }),
      },
    });
    rz.open();
  } catch (e) {
    toast.error(e.response?.data?.message || "Couldn't start payment");
  }
}

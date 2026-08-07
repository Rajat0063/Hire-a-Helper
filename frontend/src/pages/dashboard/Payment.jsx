import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2,
  AlertCircle, DollarSign, Wallet, ShieldCheck, Download, RefreshCw,
  Sparkles, ExternalLink, Receipt, Eye
} from "lucide-react";
import api from "../../services/api";
import { payWithRazorpay } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../../components/Avatar";

export default function Payments() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // 'all' | 'made' | 'earned' | 'pending'
  const [payingId, setPayingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/payments/history")
      .then(({ data }) => setData(data))
      .catch(() => toast.error("Failed to load payment history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handlePay = async (request) => {
    setPayingId(request._id);
    try {
      await payWithRazorpay({
        request,
        user,
        onSuccess: () => {
          load();
        },
      });
    } catch {
      toast.error("Payment attempt failed");
    } finally {
      setPayingId(null);
    }
  };

  const stats = data?.stats || { totalPaid: 0, pendingToPay: 0, totalEarned: 0, pendingToReceive: 0 };
  const paymentsMade = data?.paymentsMade || [];
  const earnings = data?.earnings || [];
  const config = data?.config || { isLive: false, currency: "INR" };

  // Combine into unified transaction list for "all" tab
  const allTransactions = [
    ...paymentsMade.map((p) => ({
      ...p,
      type: "outflow", // Paid or to pay
      otherUser: p.requester,
      otherRole: "Helper",
    })),
    ...earnings.map((e) => ({
      ...e,
      type: "inflow", // Earned or to receive
      otherUser: e.task?.user,
      otherRole: "Task Owner",
    })),
  ].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const filtered = allTransactions.filter((item) => {
    if (tab === "made") return item.type === "outflow";
    if (tab === "earned") return item.type === "inflow";
    if (tab === "pending") return item.paymentStatus !== "paid" && item.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="text-brand-600 dark:text-brand-400" size={28} />
            Payments & Earnings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track payments for completed tasks, worker payouts, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
            config.isLive
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300"
          }`}>
            <span className={`h-2 w-2 rounded-full ${config.isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {config.isLive ? "Razorpay Live Mode" : "Simulated Dev Mode"}
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
            title="Refresh payments"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 grid place-items-center shrink-0">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Earned</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              ₹{Number(stats.totalEarned || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              From completed tasks
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 grid place-items-center shrink-0">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Paid</div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              ₹{Number(stats.totalPaid || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">
              Disbursed to helpers
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 grid place-items-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payouts</div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              ₹{Number(stats.pendingToPay || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Awaiting your payment
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 grid place-items-center shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Inflow</div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
              ₹{Number(stats.pendingToReceive || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Earned, awaiting release
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: "all", label: "All Transactions", count: allTransactions.length },
          { id: "made", label: "Payments Made", count: paymentsMade.length },
          { id: "earned", label: "Earnings Received", count: earnings.length },
          { id: "pending", label: "Pending Dues", count: allTransactions.filter((i) => i.paymentStatus !== "paid" && i.status === "completed").length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-brand-400"
            }`}
          >
            {t.label}
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${tab === t.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 animate-pulse flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 grid place-items-center mx-auto">
            <Receipt size={24} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No payment records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tab === "pending"
              ? "All your completed tasks are fully paid up! No pending dues."
              : "Payments and earnings are generated when tasks are accepted and marked completed."}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link to="/dashboard/feed" className="btn-primary text-xs py-1.5 px-3">Browse Feed</Link>
            <Link to="/dashboard/requests" className="btn-ghost text-xs py-1.5 px-3">View Requests</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isOutflow = item.type === "outflow";
            const isPaid = item.paymentStatus === "paid";
            const isCompleted = item.status === "completed";
            const canPay = isOutflow && isCompleted && !isPaid;
            const amount = Number(item.task?.paymentAmount || 0);
            const other = item.otherUser;
            const otherName = other ? `${other.firstName} ${other.lastName}` : (isOutflow ? "Helper" : "Task Owner");
            const otherInitials = other ? `${other.firstName?.[0] || ""}${other.lastName?.[0] || ""}`.toUpperCase() : "U";

            return (
              <div
                key={item._id}
                className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-soft transition"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className={`h-11 w-11 rounded-2xl grid place-items-center shrink-0 ${
                    isPaid
                      ? isOutflow
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {isPaid ? (
                      isOutflow ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />
                    ) : (
                      <Clock size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {item.task?.title || "Task Payment"}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : isCompleted
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {isPaid ? "Paid & Settled" : isCompleted ? "Payment Pending" : "In Progress"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <b>{item.otherRole}:</b> {otherName}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.paidAt || item.updatedAt || item.createdAt).toLocaleDateString([], {
                        month: "short", day: "numeric", year: "numeric"
                      })}</span>
                      {item.razorpayPaymentId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Ref: {item.razorpayPaymentId.slice(-8)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <div className={`text-base sm:text-lg font-extrabold ${
                      isPaid
                        ? isOutflow ? "text-slate-900 dark:text-white" : "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {isOutflow ? "-" : "+"}₹{amount.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isOutflow ? "Payout" : "Earnings"} ({item.task?.currency || "INR"})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canPay ? (
                      <button
                        onClick={() => handlePay(item)}
                        disabled={payingId === item._id}
                        className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <CreditCard size={14} />
                        {payingId === item._id ? "Processing..." : `Pay ₹${amount}`}
                      </button>
                    ) : isPaid ? (
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="btn-ghost text-xs py-1.5 px-2.5 inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 font-semibold"
                        title="View Receipt"
                      >
                        <Receipt size={13} /> Receipt
                      </button>
                    ) : (
                      <Link
                        to={isOutflow ? "/dashboard/requests" : "/dashboard/my-requests"}
                        className="btn-ghost text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 grid place-items-center font-bold">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Payment Receipt</h3>
                  <p className="text-[11px] text-slate-400">Hire-a-Helper Official Confirmation</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Task:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                  {selectedReceipt.task?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Paid & Completed
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  ₹{Number(selectedReceipt.task?.paymentAmount || 0).toFixed(2)} {selectedReceipt.task?.currency || "INR"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedReceipt.razorpayPaymentId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedReceipt.paidAt || selectedReceipt.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn-ghost text-xs py-2 px-3 inline-flex items-center gap-1.5"
              >
                <Download size={14} /> Print / Save
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

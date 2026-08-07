// === Payments page ===
// One place for every money movement in the app:
//   "To pay"   -> requests on tasks I posted, where the helper finished the job
//   "Earnings" -> jobs I did for someone else and what they paid me
// Paying opens Razorpay Checkout (or the dev simulation when keys are absent).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CreditCard, IndianRupee, Wallet, Clock, CheckCircle2, AlertCircle, ArrowUpRight,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { payWithRazorpay } from "../../services/razorpay";

const money = (r) => `${r?.task?.currency || "INR"} ${Number(r?.task?.paymentAmount || 0).toLocaleString("en-IN")}`;

export default function Payments() {
  const { user } = useAuth();
  const [tab, setTab] = useState("payable");
  const [data, setData] = useState({ payable: [], earnings: [], totals: {}, live: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const { data: d } = await api.get("/payments/history");
      // ! defensive shape — a partial response must never crash the page
      setData({
        live: !!d?.live,
        payable: Array.isArray(d?.payable) ? d.payable : [],
        earnings: Array.isArray(d?.earnings) ? d.earnings : [],
        totals: d?.totals || {},
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Couldn't load payments");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pay = async (r) => {
    setBusy(r._id);
    try { await payWithRazorpay({ request: r, user, onSuccess: load }); }
    finally { setBusy(""); }
  };

  const rows = (tab === "payable" ? data.payable : data.earnings) || [];


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard size={22} className="text-brand-500" /> Payments
        </h1>
        <p className="text-sm text-slate-500">
          Secure payouts for finished tasks{data.live ? "" : " · running in test mode until Razorpay keys are added"}.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Total icon={Clock} label="Due now" value={data.totals?.duePayable ?? 0} gradient="from-amber-400 to-orange-500" />
        <Total icon={Wallet} label="Total paid out" value={data.totals?.paidOut ?? 0} gradient="from-brand-500 to-brand-700" />
        <Total icon={IndianRupee} label="Total earned" value={data.totals?.earned ?? 0} gradient="from-emerald-400 to-teal-600" />
      </div>

      <div className="card p-1.5 inline-flex">
        {[["payable", "To pay"], ["earnings", "Earnings"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === k ? "bg-brand-500 text-white shadow-soft"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-2">💸</div>
          <p className="font-semibold text-slate-800 dark:text-white">Nothing here yet</p>
          <p className="text-sm text-slate-500">
            {tab === "payable" ? "Payments appear once a helper marks your task complete." : "Finish a task to start earning."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const other = tab === "payable" ? r.requester : r.task?.user;
            const paid = r.paymentStatus === "paid";
            const canPay = tab === "payable" && r.status === "completed" && !paid;
            return (
              <div key={r._id} className="card p-4 flex flex-wrap items-center gap-4">
                {r.task?.image
                  ? <img src={r.task.image} alt={r.task?.title} className="h-16 w-16 rounded-xl object-cover" />
                  : <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />}
                <div className="flex-1 min-w-[180px]">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{r.task?.title}</div>
                  <div className="text-xs text-slate-500">
                    {tab === "payable" ? "Helper: " : "Owner: "}
                    {other ? (
                      <Link to={`/dashboard/profile/${other._id}`} className="text-brand-600 dark:text-brand-300 hover:underline">
                        {other.firstName} {other.lastName}
                      </Link>
                    ) : "—"}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge paid={paid} status={r.status} />
                    {r.paidAt && <span className="text-[11px] text-slate-400">{new Date(r.paidAt).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-lg text-slate-900 dark:text-white">{money(r)}</div>
                  {r.razorpayPaymentId && <div className="text-[10px] text-slate-400">#{r.razorpayPaymentId}</div>}
                </div>
                {canPay && (
                  <button disabled={busy === r._id} onClick={() => pay(r)}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                    <CreditCard size={15} /> {busy === r._id ? "Processing…" : "Pay now"}
                  </button>
                )}
                {tab === "payable" && !paid && !canPay && (
                  <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                    <AlertCircle size={13} /> Waiting for completion
                  </span>
                )}
                <Link to={tab === "payable" ? "/dashboard/requests" : "/dashboard/my-requests"}
                  className="text-xs text-slate-500 hover:text-brand-600 inline-flex items-center gap-1">
                  Details <ArrowUpRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Total({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-soft`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-90">{label}</span>
        <Icon size={18} className="opacity-80" />
      </div>
      <div className="text-2xl font-extrabold mt-2">₹ {Number(value).toLocaleString("en-IN")}</div>
    </div>
  );
}

function Badge({ paid, status }) {
  if (paid) return <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 size={12} /> Paid</span>;
  if (status === "completed") return <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock size={12} /> Payment due</span>;
  return <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{String(status || "pending").replace("_", " ")}</span>;
}

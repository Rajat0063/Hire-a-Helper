import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, ListChecks, Inbox, LogOut, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("users");
  const [stats, setStats] = useState({ users:0, tasks:0, requests:0 });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const load = async () => {
    const [s,u,t] = await Promise.all([
      api.get("/admin/stats"), api.get("/admin/users"), api.get("/admin/tasks"),
    ]);
    setStats(s.data); setUsers(u.data.users); setTasks(t.data.tasks);
  };
  useEffect(()=>{ load().catch(()=>toast.error("Failed to load")); },[]);

  const delUser = async (id) => { if(!confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`); toast.success("Deleted"); load(); };
  const delTask = async (id) => { if(!confirm("Delete this task?")) return;
    await api.delete(`/admin/tasks/${id}`); toast.success("Deleted"); load(); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-extrabold text-xl">HireHelper <span className="text-brand-400">Admin</span></div>
          <button onClick={()=>{logout(); nav("/admin/login");}}
            className="flex items-center gap-2 text-sm font-semibold hover:text-brand-300"><LogOut size={16}/> Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Stat icon={Users} label="Users" value={stats.users}/>
          <Stat icon={ListChecks} label="Tasks" value={stats.tasks}/>
          <Stat icon={Inbox} label="Requests" value={stats.requests}/>
        </div>

        <div className="mt-8 flex gap-2">
          {["users","tasks"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab===t?"bg-brand-600 text-white":"bg-white border border-slate-200 text-slate-600"}`}>
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className="card mt-4 overflow-hidden">
          {tab==="users" ? (
            <Table head={["Name","Email","Role","Verified",""]} rows={users.map(u=>[
              `${u.firstName} ${u.lastName}`, u.email, u.role, u.isVerified?"Yes":"No",
              <button key="d" onClick={()=>delUser(u._id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={16}/></button>
            ])}/>
          ) : (
            <Table head={["Title","By","Location","Status",""]} rows={tasks.map(t=>[
              t.title, `${t.user?.firstName||"—"} ${t.user?.lastName||""}`, t.location, t.status,
              <button key="d" onClick={()=>delTask(t._id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={16}/></button>
            ])}/>
          )}
        </div>
      </main>
    </div>
  );
}

const Stat = ({ icon:Icon, label, value }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 grid place-items-center"><Icon/></div>
    <div><div className="text-sm text-slate-500">{label}</div><div className="text-2xl font-extrabold">{value}</div></div>
  </div>
);

const Table = ({ head, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-600">
        <tr>{head.map((h,i)=><th key={i} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} className="border-t border-slate-100">
            {r.map((c,j)=><td key={j} className="px-4 py-3">{c}</td>)}
          </tr>
        ))}
        {rows.length===0 && <tr><td colSpan={head.length} className="text-center text-slate-500 py-8">Nothing here yet</td></tr>}
      </tbody>
    </table>
  </div>
);

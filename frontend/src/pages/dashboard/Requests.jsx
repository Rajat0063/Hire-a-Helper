import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function Requests() {
  const [list, setList] = useState([]);
  const load = ()=>api.get("/requests/received").then(({data})=>setList(data.requests));
  useEffect(()=>{ load(); },[]);

  const decide = async (id, status) => {
    try { await api.patch(`/requests/${id}`, { status }); toast.success(status); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Requests</h1>
      <p className="text-slate-600">People who want to help with your tasks.</p>
      <div className="mt-6 space-y-3">
        {list.map(r=>(
          <div key={r._id} className="card p-5 flex flex-wrap items-center gap-4 justify-between">
            <div className="min-w-0">
              <div className="font-semibold">{r.requester?.firstName} {r.requester?.lastName}</div>
              <div className="text-sm text-slate-600">wants to help with <b>{r.task?.title}</b></div>
              <div className="text-xs text-slate-500">{r.requester?.email}</div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full font-semibold">{r.status}</span>
              {r.status==="pending" && <>
                <button onClick={()=>decide(r._id,"accepted")} className="btn-primary text-sm py-2">Accept</button>
                <button onClick={()=>decide(r._id,"rejected")} className="btn-ghost text-sm py-2">Reject</button>
              </>}
            </div>
          </div>
        ))}
        {list.length===0 && <p className="text-slate-500">No requests yet.</p>}
      </div>
    </div>
  );
}

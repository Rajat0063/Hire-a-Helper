import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MyRequests() {
  const [list, setList] = useState([]);
  useEffect(()=>{ api.get("/requests/sent").then(({data})=>setList(data.requests)); },[]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold">My Requests</h1>
      <div className="mt-6 space-y-3">
        {list.map(r=>(
          <div key={r._id} className="card p-5 flex flex-wrap items-center gap-4 justify-between">
            <div>
              <div className="font-semibold">{r.task?.title}</div>
              <div className="text-sm text-slate-600">Posted by {r.task?.user?.firstName} {r.task?.user?.lastName}</div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-brand-50 text-brand-700">{r.status}</span>
          </div>
        ))}
        {list.length===0 && <p className="text-slate-500">You haven't requested any tasks yet.</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  useEffect(()=>{ api.get("/tasks/mine").then(({data})=>setTasks(data.tasks)); },[]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold">My Tasks</h1>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {tasks.map(t=>(
          <div key={t._id} className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{t.title}</h3>
              <span className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-full font-semibold">{t.status}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{t.description}</p>
            <p className="text-xs text-slate-500 mt-2">{t.location} · {new Date(t.startTime).toLocaleString()}</p>
          </div>
        ))}
        {tasks.length===0 && <p className="text-slate-500">You haven't posted any tasks yet.</p>}
      </div>
    </div>
  );
}

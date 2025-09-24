import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const MyTasksContent = () => {
  const { user } = useOutletContext();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // Handler to move task to inProgress
  const handleMoveToInProgress = async (taskId) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/mytasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inProgress' }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      // Refresh tasks
      const updated = await res.json();
      setMyTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch {
      alert('Could not move task.');
    }
    setUpdating(false);
  };

  // Handler to move task to done
  const handleMoveToDone = async (taskId) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/mytasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      // Refresh tasks
      const updated = await res.json();
      setMyTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch {
      alert('Could not move task.');
    }
    setUpdating(false);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/mytasks/${user._id}`)
      .then(res => res.json())
      .then(data => {
        setMyTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div>Loading...</div>;

  // Group tasks by status
  const grouped = {
    todo: myTasks.filter(t => t.status === 'assigned' || t.status === 'todo'),
    inProgress: myTasks.filter(t => t.status === 'inProgress'),
    done: myTasks.filter(t => t.status === 'done' || t.status === 'completed'),
  };

  const columns = [
    { key: 'todo', title: 'To do', color: '#6366f1' },
    { key: 'inProgress', title: 'In progress', color: '#f59e42' },
    { key: 'done', title: 'Done', color: '#22c55e' },
  ];

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-zinc-800">My Tasks</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.key} className="p-4 rounded-xl shadow-lg bg-white">
            <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: col.color }}>
              <h3 className="text-xl font-bold text-zinc-800">{col.title}</h3>
            </div>
            <div className="space-y-4">
              {grouped[col.key].length === 0 ? (
                <div className="text-zinc-400 text-center">No tasks</div>
              ) : (
                grouped[col.key].map(task => (
                  <div key={task._id} className="bg-zinc-100 rounded-lg p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-800">{task.taskTitle}</span>
                      <span className="text-xs text-zinc-500 mb-1">{task.description}</span>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 w-fit mt-1">{task.status}</span>
                      {col.key === 'todo' && (
                        <button
                          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs self-end disabled:opacity-50"
                          onClick={() => handleMoveToInProgress(task._id)}
                          disabled={updating}
                        >
                          Mark as In Progress
                        </button>
                      )}
                      {col.key === 'inProgress' && (
                        <button
                          className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs self-end disabled:opacity-50"
                          onClick={() => handleMoveToDone(task._id)}
                          disabled={updating}
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default MyTasksContent;

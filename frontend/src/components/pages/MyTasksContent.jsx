import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SkeletonLoader from '../ui/SkeletonLoader';

// Custom skeleton for MyTasks columns and cards
const MyTasksSkeleton = () => {
  const columns = [
    { key: 'todo', title: 'To do', color: '#6366f1' },
    { key: 'inProgress', title: 'In progress', color: '#f59e42' },
    { key: 'done', title: 'Done', color: '#22c55e' },
  ];
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.key} className="p-4 rounded-xl shadow-lg bg-white">
            <div className="flex justify-between items-center mb-4 border-b-2 pb-2" style={{ borderColor: col.color }}>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="bg-zinc-100 rounded-lg p-3">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-indigo-100 rounded-full animate-pulse" />
                    <div className="h-7 w-28 bg-blue-200 rounded self-end animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
import { useOutletContext } from 'react-router-dom';

const MyTasksContent = () => {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  // Fetch tasks with React Query
  const { data: myTasks = [], isLoading: loading } = useQuery({
    queryKey: ['mytasks', user?._id],
    queryFn: async () => {
      if (!user) return [];
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mytasks/${user._id}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });
  // Handler to move task to inProgress
  // Mutations for updating task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      setUpdating(true);
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/mytasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mytasks', user?._id]);
      setUpdating(false);
    },
    onError: () => {
      alert('Could not update task.');
      setUpdating(false);
    },
  });

  const handleMoveToInProgress = (taskId) => {
    updateTaskMutation.mutate({ taskId, status: 'inProgress' });
  };
  const handleMoveToDone = (taskId) => {
    updateTaskMutation.mutate({ taskId, status: 'done' });
  };



  if (loading) return <MyTasksSkeleton />;

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
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit mt-1">{task.status}</span>
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

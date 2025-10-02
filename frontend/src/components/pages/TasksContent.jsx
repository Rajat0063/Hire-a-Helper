// src/components/pages/TasksContent.jsx

import { useOutletContext } from 'react-router-dom'; // 1. Import the hook

const TasksContent = () => {
    // 2. Get the data and functions from the context
    const { tasksData, handleMoveTask } = useOutletContext();
    
    // The nested Column component and the JSX below require no changes
    const Column = ({ title, tasks, color, columnId }) => (
      <div className={`p-4 rounded-xl shadow-lg bg-white`}>
        <div className={`flex justify-between items-center mb-4 border-b-2 pb-2`} style={{ borderColor: color }}>
          <h3 className="text-xl font-bold text-zinc-800">{title}</h3>
        </div>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-zinc-100 rounded-lg p-3 group">
              <div className="flex items-start">
                <img src={task.userImage} alt="User" className="h-8 w-8 rounded-full flex-shrink-0" />
                <p className="text-sm text-zinc-700 ml-3">{task.text}</p>
              </div>
               <div className="mt-2 pt-2 border-t border-zinc-200 flex justify-end space-x-2 text-xs">
                {columnId === 'todo' && (
                    <button onClick={() => handleMoveTask(task.id, 'todo', 'inProgress')} className="font-semibold text-blue-600 hover:text-blue-800">Start Task &rarr;</button>
                )}
                {columnId === 'inProgress' && (
                    <button onClick={() => handleMoveTask(task.id, 'inProgress', 'done')} className="font-semibold text-green-600 hover:text-green-800">Mark as Done ✓</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  
    // Professional skeleton for Tasks page
    const TasksSkeleton = () => {
      const columns = [
        { key: 'todo', title: 'To do', color: '#818cf8' },
        { key: 'inProgress', title: 'In progress', color: '#fcd34d' },
        { key: 'done', title: 'Done', color: '#4ade80' },
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

  if (!tasksData || !tasksData.todo || !tasksData.inProgress || !tasksData.done) return <TasksSkeleton />;
  if (
    (!tasksData.todo || tasksData.todo.length === 0) &&
    (!tasksData.inProgress || tasksData.inProgress.length === 0) &&
    (!tasksData.done || tasksData.done.length === 0)
  ) {
    return (
      <main className="flex-1 flex items-center justify-center bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <Icon className="mx-auto mb-4 h-12 w-12 text-zinc-400" path="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
          <h2 className="text-2xl font-bold text-zinc-700 mb-2">No tasks found</h2>
          <p className="text-zinc-500">There are currently no tasks assigned to you.</p>
        </div>
      </main>
    );
  }
  return (
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-100 p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-800">My Tasks</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Column title="To do" tasks={tasksData.todo} color="#818cf8" columnId="todo" />
          <Column title="In progress" tasks={tasksData.inProgress} color="#fcd34d" columnId="inProgress" />
          <Column title="Done" tasks={tasksData.done} color="#4ade80" columnId="done" />
        </div>
      </main>
    );
};

export default TasksContent;
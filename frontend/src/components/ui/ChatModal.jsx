import TaskChat from './TaskChat';

const ChatModal = ({ isOpen, onClose, task, currentUser, otherUser }) => {
  if (!isOpen || !task) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-2xl m-4 overflow-hidden animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-zinc-400 hover:text-zinc-700 text-3xl font-bold focus:outline-none z-20"
          aria-label="Close"
        >
          &times;
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Chat about: {task.title}</h2>
          <TaskChat taskId={task._id} currentUser={currentUser} otherUser={otherUser} />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;

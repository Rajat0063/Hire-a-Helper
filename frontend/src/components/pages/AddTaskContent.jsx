// src/pages/AddTaskContent.jsx

import { useState } from 'react';
import PageHeader from '../ui/PageHeader';
import { useOutletContext } from 'react-router-dom'; // 1. Import the hook

const AddTaskContent = () => {
    // 2. Get the handleAddTask function from the context
    const { handleAddTask } = useOutletContext();

    const [task, setTask] = useState({
        title: '',
        description: '',
        type: 'other',
        location: '',
        startTime: '',
        endTime: '',
        image: '', 
    });
    const [isDragging, setIsDragging] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTask(prev => ({ ...prev, [name]: value }));
    };

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTask(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleImageChange = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };

    const handleRemoveImage = () => {
        setTask(prev => ({ ...prev, image: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 3. Call handleAddTask (from context) instead of onAddTask (from props)
        handleAddTask(task);
        // Reset form after submission
        setTask({ title: '', description: '', type: 'other', location: '', startTime: '', endTime: '', image: '' });
    };

    // The entire JSX return block below requires no changes.
    return (
        <main className="flex-1 overflow-y-auto bg-zinc-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <PageHeader title="Post a New Task" />
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">Task Title</label>
                        <input type="text" name="title" id="title" value={task.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">Description</label>
                        <textarea name="description" id="description" rows="4" value={task.description} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-700">Task Image (Optional)</label>
                        {task.image ? (
                            <div className="mt-2 relative">
                                <img src={task.image} alt="Task preview" className="w-full rounded-lg object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm rounded-full p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <label
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                htmlFor="image-upload"
                                className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 pt-10 pb-10 cursor-pointer transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-zinc-300 hover:border-zinc-400'}`}
                            >
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-zinc-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M28 8l4.586-4.586a2 2 0 012.828 0L42 10M28 8l14 14M12 36h24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="mt-4 flex text-sm leading-6 text-zinc-600">
                                        <span className="font-semibold text-indigo-600">Upload a file</span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-zinc-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                                <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-zinc-700">Category</label>
                            <select name="type" id="type" value={task.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="other">Other</option>
                                <option value="gardening">Gardening</option>
                                <option value="moving">Moving</option>
                                <option value="painting">Painting</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="repairs">Repairs</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-zinc-700">Location</label>
                            <input type="text" name="location" id="location" value={task.location} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-zinc-700">Start Time</label>
                            <input type="datetime-local" name="startTime" id="startTime" value={task.startTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-zinc-700">End Time (Optional)</label>
                            <input type="datetime-local" name="endTime" id="endTime" value={task.endTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm disabled:bg-indigo-300"
                         disabled={!task.title || !task.description || !task.location}
                        >
                            Post Task
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default AddTaskContent;
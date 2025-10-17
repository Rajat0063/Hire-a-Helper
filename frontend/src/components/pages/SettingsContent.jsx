import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../ui/PageHeader';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import Modal from '@mui/material/Modal';
import getCroppedImg from '../../utils/cropImage';
import { useOutletContext } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import Avatar from '../ui/Avatar'; // 1. Import the new Avatar component

const SettingsContent = () => {
    const { user, handleUserUpdate } = useOutletContext();

    const [formData, setFormData] = useState({
        name: '', email: '', phoneNumber: '', bio: '', image: '',
    });
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await handleUserUpdate(formData);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (err) {
            // handleUserUpdate sets toasts, but also reject so we can show inline error
            setErrorMsg(err?.message || 'Failed to update profile');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            const croppedImg = await getCroppedImg(selectedImage, croppedAreaPixels);
            setFormData(prev => ({ ...prev, image: croppedImg }));
            setCropModalOpen(false);
            setSelectedImage(null);
        } catch (err) {
            console.error('Crop failed:', err);
            alert('Failed to crop image');
        }
    };

    if (!formData) {
        return <div>Loading settings...</div>;
    }

    return (
        <>
        <PageHeader title="Settings" />
        <Modal open={cropModalOpen} onClose={() => setCropModalOpen(false)}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 8, outline: 'none', width: 350 }}>
                <div style={{ position: 'relative', width: 300, height: 300, background: '#333' }}>
                    <Cropper
                        image={selectedImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div style={{ margin: '16px 0' }}>
                    <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e, z) => setZoom(z)}
                    />
                </div>
                <button onClick={handleCropSave} className="px-4 py-2 bg-indigo-600 text-white rounded mr-2">Save</button>
                <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 bg-zinc-300 rounded">Cancel</button>
            </div>
        </Modal>
        <main className="flex-1 overflow-y-auto bg-zinc-100 p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-zinc-800 mb-8">Profile Settings</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center space-x-6">
                            
                            {/* 2. Replace the old <img> tag with the Avatar component */}
                            <Avatar user={formData} className="h-24 w-24 text-4xl" />

                            <div>
                                <label htmlFor="image-upload" className="cursor-pointer px-4 py-2 bg-zinc-200 text-zinc-800 text-sm font-semibold rounded-lg hover:bg-zinc-300 transition-colors">
                                    Change Photo
                                </label>
                                <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                {/* Cropping modal handled above */}
                                <p className="text-xs text-zinc-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Full Name</label>
                                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700">Phone Number</label>
                                <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email Address</label>
                            <input type="email" name="email" id="email" value={formData.email || ''} disabled className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm bg-zinc-100 text-zinc-400 cursor-not-allowed focus:outline-none sm:text-sm" />
                        </div>
                        
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-zinc-700">Bio</label>
                            <textarea name="bio" id="bio" rows="3" value={formData.bio || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Tell us a little about yourself..."></textarea>
                        </div>
                        
                        <div className="flex justify-end items-center space-x-4 pt-4">
                            {errorMsg && (
                                <div className="text-sm text-red-600 mr-4">{errorMsg}</div>
                            )}
                            {showSuccess && (
                                <div className="flex items-center text-sm text-green-600">
                                    <Icon path="M22 11.08V12a10 10 0 1 1-5.93-9.14" className="h-5 w-5 mr-2"/>
                                    <span>Profile saved successfully!</span>
                                </div>
                            )}
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
        </>
    );
};

export default SettingsContent;
import React, { useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';

const Settings: React.FC = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        profileImage: ''
    });

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        repeatNewPassword: ''
    });

    const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData({
            ...userData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/api/user/update', userData);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.repeatNewPassword) {
            alert('New passwords do not match!');
            return;
        }
        try {
            await api.put('/api/user/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                repeatNewPassword: ''
            });
            alert('Password updated successfully!');
        } catch (error) {
            console.error('Error updating password:', error);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
                <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
                    <h1 className="font-bold text-center text-2xl mb-5">Settings</h1>
                    <div className="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
                        <div className="px-5 py-7">
                            <form onSubmit={handleSaveChanges}>
                                <div className="mb-5 text-center">
                                    {userData.profileImage ? (
                                        <img
                                            src={userData.profileImage}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full mx-auto mb-2"
                                        />
                                    ) : (
                                        <svg className="w-32 h-32 rounded-full mx-auto mb-2 text-gray-300 bg-gray-100" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="text-sm text-gray-500"
                                    />
                                </div>
                                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={userData.email}
                                    onChange={handleUserDataChange}
                                    disabled
                                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                                /> 
                                
                                <label className="font-semibold text-sm text-gray-600 pb-1 block">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={userData.username}
                                    onChange={handleUserDataChange}
                                    className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                />
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(true)}
                                        className="transition duration-200 bg-gray-500 hover:bg-gray-600 focus:bg-gray-700 focus:shadow-sm focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        type="submit"
                                        className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Password Change Modal */}
                    {showPasswordModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                                <form onSubmit={handlePasswordUpdate}>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        placeholder="Current Password"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                    />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        placeholder="New Password"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                    />
                                    <input
                                        type="password"
                                        name="repeatNewPassword"
                                        placeholder="Repeat New Password"
                                        value={passwordData.repeatNewPassword}
                                        onChange={handlePasswordChange}
                                        className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordModal(false)}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg w-1/2"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Don’t forget to export the component
export default Settings;

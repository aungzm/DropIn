import React, { useEffect, useState } from 'react';
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

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data and profile picture on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch user info
                const userInfoResponse = await api.get('/users/');
                const user = userInfoResponse.data.user;

                setUserData((prevState) => ({
                    ...prevState,
                    username: user.username,
                    email: user.email
                }));

                // Fetch profile picture
                try {
                    const profilePicResponse = await api.get('/users/profile', {
                        responseType: 'blob' // To handle binary image data
                    });
                    const imageUrl = URL.createObjectURL(profilePicResponse.data);
                    setUserData((prevState) => ({
                        ...prevState,
                        profileImage: imageUrl
                    }));
                } catch (profileError: any) {
                    if (profileError.response?.data?.error === 'Profile picture not found') {
                        console.log('No profile picture found, using placeholder.');
                    } else {
                        console.error('Error fetching profile picture:', profileError);
                    }
                }
            } catch (userError: any) {
                console.error('Error fetching user info:', userError);
                setError('Failed to load user data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);
    
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
            // Update user data (if any changes like username)
            await api.put('/users/update', {
                username: userData.username, // Send user data if necessary
            });
    
            // Update profile picture if a new one is selected
            const profileImageInput = document.getElementById('profileImageInput') as HTMLInputElement;
            if (profileImageInput?.files && profileImageInput.files[0]) {
                const formData = new FormData();
                formData.append('profilePic', profileImageInput.files[0]); 
    
                await api.put('/users/profile', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Explicitly setting Content-Type
                    },
                });
            }
    
            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error); // Show specific backend error for debugging
            } else {
                alert('An unexpected error occurred while updating your profile.');
            }
        }
    };
    


    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (passwordData.newPassword !== passwordData.repeatNewPassword) {
            alert('New passwords do not match!');
            return;
        }
    
        try {
            const response = await api.put('/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                repeatPassword: passwordData.repeatNewPassword,
            });
    
            // Success response
            alert(response.data.message || 'Password reset successfully!');
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                repeatNewPassword: '',
            });
        } catch (error: any) {
            // Handle error responses
            if (error.response?.data?.error) {
                alert(error.response.data.error); // Display error message from backend
            } else {
                console.error('Error updating password:', error);
                alert('An unexpected error occurred while resetting your password.');
            }
        }
    };
    

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

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
                                    <svg
                                        className="w-32 h-32 rounded-full mx-auto mb-2 text-gray-300 bg-gray-100"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                )}
                                <div className="relative">
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="profileImageInput"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];

                                                    // Update profileImage preview
                                                    const previewUrl = URL.createObjectURL(file);
                                                    setUserData((prevState) => ({
                                                        ...prevState,
                                                        profileImage: previewUrl
                                                    }));

                                                    // Truncate the filename and display it
                                                    const fileName = file.name;
                                                    const truncatedName =
                                                        fileName.length > 30
                                                            ? `${fileName.substring(0, 15)}...${fileName.slice(-10)}`
                                                            : fileName;
                                                    document.getElementById('fileNameDisplay')!.textContent = truncatedName;
                                                }
                                            }}
                                        />
                                        <div className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center cursor-pointer">
                                            <span>Browse...</span>
                                        </div>
                                    </label>
                                    <p
                                        id="fileNameDisplay"
                                        className="text-sm text-gray-600 mt-2 truncate max-w-xs"
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        No file selected
                                    </p>
                                </div>
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
                                            onClick={handlePasswordUpdate}
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

export default Settings;

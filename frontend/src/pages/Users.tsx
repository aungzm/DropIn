import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import UserBox from '../components/UserBox';
import api from '../api/api';

interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    profileImageUrl: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admins/users'); // Fetch all users
                const usersWithProfile = await Promise.all(
                    response.data.users.map(async (user: any) => {
                        // Fetch profile image binary for each user
                        try {
                            const profileImageResponse = await api.get(`admins/users/${user.id}/profile`, {
                                responseType: 'blob', // Fetch binary data
                            });
                            console.log(profileImageResponse);
                            const profileImageUrl = URL.createObjectURL(profileImageResponse.data); // Create a temporary URL
                            console.log(profileImageUrl);
                            return { ...user, profileImageUrl };
                        } catch {
                            // Use default image if profile image is not found
                            return {
                                ...user,
                                profileImageUrl:
                                    'https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg',
                            };
                        }
                    })
                );
                setUsers(usersWithProfile);
                setError(null); // Clear any existing errors
            } catch (err: any) {
                if (err.response?.data?.error) {
                    setError(err.response.data.error); // Set error from backend
                } else {
                    setError('An unexpected error occurred.'); // Fallback error message
                }
            } finally {
                setLoading(false); // Stop loading indicator
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="min-h-screen bg-white-100">
            <Navbar />
            <div className="pt-24 px-8 flex flex-wrap items-center gap-8">
                {users.map((user: any) => (
                    <UserBox
                        key={user.id}
                        profilePic={user.profileImageUrl} // Use dynamically fetched profile image or default
                        userId={user.id}
                        email={user.email}
                        userName={user.username}
                        role={user.role}
                    />
                ))}
            </div>
        </div>
    );
};

export default Users;

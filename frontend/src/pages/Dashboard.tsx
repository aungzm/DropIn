import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Space from '../components/Space';
import AddSpace from '../components/AddSpace';
import api from '../api/api'; // Assuming you have a configured Axios instance

const Dashboard = () => {
    const [spaces, setSpaces] = useState<any[]>([]); // State to store spaces
    const [loading, setLoading] = useState<boolean>(true); // Loading state
    const [error, setError] = useState<string | null>(null); // Error state

    // Fetch spaces from the API
    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const response = await api.get('/users/spaces');
                if (response.data?.spaces) {
                    setSpaces(response.data.spaces);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load spaces');
            } finally {
                setLoading(false);
            }
        };

        fetchSpaces();
    }, []);

    return (
        <div className="min-h-screen bg-white-100">
            <Navbar />
            <div className="pt-24 px-8 flex flex-wrap items-center gap-8">
                {loading && <p>Loading spaces...</p>}
                {!loading && error && <p className="text-red-500">{error}</p>}
                {!loading && !error && spaces.length === 0 && <p>No spaces available.</p>}
                {!loading &&
                    !error &&
                    spaces.map((space) => (
                        <Space
                            key={space.id}
                            spaceName={space.name}
                            creator={space.createdBy.username}
                            onDelete={() => console.log(`Delete clicked for ${space.name}`)}
                            onRename={(newName) => console.log(`Rename clicked for ${space.name}: ${newName}`)}
                        />
                    ))}
                <AddSpace />
            </div>
        </div>
    );
};

export default Dashboard;

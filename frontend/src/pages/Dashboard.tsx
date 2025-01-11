import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Space from '../components/Space';
import AddSpace from '../components/AddSpace';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; 

const Dashboard = () => {
    const navigate = useNavigate(); 
    const [spaces, setSpaces] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null); 

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

    const handleAddSpace = (newSpace: any) => {
        setSpaces((prevSpaces) => [...prevSpaces, newSpace]);
    };

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
                            spaceId={space.id}
                            spaceName={space.name}
                            onClickSpace={() => navigate(`/upload/${space.id}`)}
                            creator={space.createdBy.username}
                            onDeleteSpaceSucess={() => {
                                    setSpaces((prevSpaces) =>
                                        prevSpaces.filter((s) => s.id !== space.id)
                                    );
                                }}
                            onRenameSuccess={(newName) => {
                                setSpaces((prevSpaces) =>
                                  prevSpaces.map((s) =>
                                    s.id === space.id ? { ...s, name: newName } : s
                                  )
                                );
                              }}
                        />
                    ))}
                <AddSpace onSpaceAdded={handleAddSpace}/>
            </div>
        </div>
    );
};

export default Dashboard;

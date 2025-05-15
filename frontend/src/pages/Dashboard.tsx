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
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Spaces</h1>
        <div className="flex flex-wrap items-start gap-6">
          {loading && <p className="text-gray-600">Loading spaces...</p>}
          {!loading && error && <p className="text-red-600 font-medium">{error}</p>}
          {!loading && !error && spaces.length === 0 && <p className="text-gray-500">No spaces available. Create one to get started!</p>}
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
          {!loading && !error && <AddSpace onSpaceAdded={handleAddSpace} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
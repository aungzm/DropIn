import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import getFileIcon from '../utils/getFileIcon';
import FileCard from '../components/File';

interface SpaceInfo {
  id: string;
  name: string;
  passwordNeeded: boolean;
}

interface SpaceFile {
  id: string;
  name: string;
  password?: string | null;
}

interface SpaceData {
  id: string;
  name: string;
  files: SpaceFile[];
}

function SpaceSharePage() {
  const navigate = useNavigate();
  const { shareSecret } = useParams();

  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [spacePassword, setSpacePassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // This state holds the *full* space data (including files)
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  // A boolean to track if we've actually fetched the full space
  const [spaceState, setSpaceState] = useState(false);

  useEffect(() => {
    // Minimal "verify" step
    api
      .get(`/shares/space/verify?shareSecret=${shareSecret}`)
      .then((res) => {
        setSpaceInfo(res.data);
        setNeedsPassword(res.data.passwordNeeded);
      })
      .catch(() => setError('Invalid or expired space share link.'))
      .finally(() => setIsLoading(false));
  }, [shareSecret]);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!spaceInfo) {
    navigate('/login');
    return null;
  }

  // 1) If we've already fetched the *full* space data, render it
  if (spaceState && spaceData) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold">
          Welcome to {spaceData.name}
        </h1>

        {/* If there are files, map over them and show <FileCard /> */}
        {spaceData.files.length ? (
          <div className="mt-4 grid gap-4">
            {spaceData.files.map((file) => (
              <FileCard
                key={file.id}
                fileId={file.id}
                fileName={file.name}
                locked={Boolean(file.password)}
                progress={100}
                onRenameSucess={() => {}}
                onDeleteSuccess={() => {}}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-gray-600">No files in this space.</p>
        )}
      </div>
    );
  }

  //If no password is needed, show a button to fetch (access) the *full* space
  if (!needsPassword) {
    spaceAccess(spaceInfo.id);
  }

  // Otherwise, show password prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto text-center justify-center">
        <div>
          <div className="w-20 h-24 mx-auto mb-2 relative">
            <img
              src={getFileIcon('default')}
              alt="space"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-gray-600 text-2xl font-normal mb-4">
            {spaceInfo.name}
          </h2>
        </div>
        <input
          type="password"
          value={spacePassword}
          onChange={(e) => setSpacePassword(e.target.value)}
          placeholder="Enter space password"
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 text-center"
        />

        <button
          onClick={() => handleProtectedSpaceAccess(spaceInfo.id, spacePassword)}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Access
        </button>
      </div>
    </div>
  );

  async function spaceAccess(spaceId: string) {
    try {
      const response = await api.get(`/shares/space/${spaceId}/access`);
      setSpaceData(response.data.space);
      setSpaceState(true);
    } catch (err) {
      alert('Failed to open space.');
    }
  }

  async function handleProtectedSpaceAccess(spaceId: string, password: string) {
    try {
      const response = await api.get(`/shares/space/${spaceId}/access?spacePassword=${password}`);
      setSpaceData(response.data.space);
      setSpaceState(true);
    } catch (err) {
      alert('Invalid password.');
    }
  }
}

export default SpaceSharePage;

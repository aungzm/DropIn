import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import getFileIcon from '../utils/getFileIcon';
import { Download } from 'lucide-react';
import GuestFileComponnent from '../components/GuestFile';

interface SpaceInfo {
  id: string;
  name: string;
  passwordNeeded: boolean;
}

interface SpaceFile {
  id: string;
  name: string;
  locked: boolean;
  url: string;
  expiresAt: Date | null;
  downloadsRemaining: number | null;
}

interface SpaceData {
  id: string;
  name: string;
  createdby: string;
  locked: boolean;
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

  const handleDownloadAll = async () => {
    try {
      const response = await api.get(`/shares/space/${spaceInfo.id}/downloadAll?shareSecret=${shareSecret}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${spaceInfo.name}.zip`);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Error during downloading:', error);
      alert('Failed to download the space. Please try again.');
    }
  };

  if (spaceState && spaceData) {
    return (
      <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="mt-20 flex items-center gap-2 px-6 py-4 shadow-sm">
        {/* Space name */}
        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          {spaceData.name}
        </h1>
        {/* Download */}
        <button
          className="text-blue-700 hover:text-blue-800"
          title="Download"
          onClick={handleDownloadAll}
        >
          <Download />
        </button>
      </div>

      {/* Main area */}
    <div className="flex flex-row items-start gap-8 px-6 py-6">

      {/* Center area: Uploaded files */}
      <div className="w-1/2 aspect-square bg-gray-200 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Uploaded Files
          </h2>
          <div className="flex-1 overflow-y-auto">
            {spaceData.files.map((file) => (
              <GuestFileComponnent
                key={file.id}
                fileId={file.id}
                fileName={file.name}
                locked={file.locked}
              />
            ))}
          </div>
        </div>
    </div>
    </div>
    );
  }

  //If no password is needed, show a button to fetch (access) the *full* space
  if (!needsPassword) {
    spaceAccess(spaceInfo.id);
  } else {
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
  }

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

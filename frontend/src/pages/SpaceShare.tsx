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
  createdBy: string;
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

  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [spaceState, setSpaceState] = useState(false);

  useEffect(() => {
    // Fetch minimal "verify" data
    api
      .get(`/shares/space/verify?shareSecret=${shareSecret}`)
      .then((res) => {
        setSpaceInfo(res.data);
        setNeedsPassword(res.data.passwordNeeded);
      })
      .catch(() => setError('Invalid or expired space share link.'))
      .finally(() => setIsLoading(false));
  }, [shareSecret]);

  useEffect(() => {
    // Automatically fetch full space if no password is needed
    if (!needsPassword && spaceInfo && !spaceState) {
      spaceAccess(spaceInfo.id);
    }
  }, [needsPassword, spaceInfo, spaceState]);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!spaceInfo) {
    navigate('/login');
    return null;
  }

  const handleDownloadAll = async () => {
    try {
      const response = await api.get(
        `/shares/space/${spaceInfo.id}/downloadAll?shareSecret=${shareSecret}`,
        { responseType: 'blob' }
      );

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

  async function spaceAccess(spaceId: string) {
    try {
      console.log("space id is:", spaceId);
      const response = await api.get(`/shares/space/${spaceId}/access?shareSecret=${shareSecret}`);
      console.log("Accessed space data:", response.data);
      setSpaceData(response.data);
      setSpaceState(true);
    } catch (err) {
      alert('Failed to open space.');
    }
  }

  async function handleProtectedSpaceAccess(spaceId: string, password: string) {
    try {
      const response = await api.get(`/shares/space/${spaceId}/access?spacePassword=${password}`);
      setSpaceData(response.data);
      setSpaceState(true);
    } catch (err) {
      alert('Invalid password.');
    }
  }

  // Render the fully fetched space
  if (spaceState && spaceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg my-8">
          {/* Header with back button */}
          <div className="p-4 flex items-center gap-2 border-b">
            <h1 className="text-lg font-large font-bold flex-1 ml-2">
              {spaceData.name}
            </h1>
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadAll}
                className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-lg text-center font-bold font-large text-gray-800 mb-4">
              Uploaded Files
            </h2>       
            <div className="w-full bg-gray-100 p-4 rounded-lg">
                {spaceData.files.map((file) => (
                  <GuestFileComponnent 
                    key={file.id}
                    fileId={file.id}
                    fileName={file.name}
                    locked={file.locked}
                    fileUrl={file.url}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render password prompt if needed
  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto text-center">
          <input
            type="password"
            value={spacePassword}
            onChange={(e) => setSpacePassword(e.target.value)}
            placeholder="Enter space password"
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-600 text-center"
          />
          <button
            onClick={() => handleProtectedSpaceAccess(spaceInfo.id, spacePassword)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Access
          </button>
        </div>
      </div>
    );
  }

  return null; // Default fallback
}

export default SpaceSharePage;

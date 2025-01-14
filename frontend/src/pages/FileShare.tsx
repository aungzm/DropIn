import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import getFileIcon from '../utils/getFileIcon';

interface FileInfo {
  id: string;
  name: string;
  passwordNeeded: boolean;
}

function FileSharePage() {
  const navigate = useNavigate();
  const { shareSecret } = useParams();
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [filePassword, setFilePassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false); // Prevent repeated triggers of download
  

  useEffect(() => {
    // Verify the file share
    api.get(`/shares/file/verify?shareSecret=${shareSecret}`)
      .then((res) => {
        setFileInfo(res.data);
        setNeedsPassword(res.data.passwordNeeded);
      })
      .catch(() => setError('Invalid or expired file share link.'))
      .finally(() => setIsLoading(false));
  }, [shareSecret]);

  // Auto-download if no password is needed 
  useEffect(() => {
    if (!isLoading && fileInfo && !needsPassword && !downloadStarted) {
      setDownloadStarted(true); 
      downloadFile(fileInfo);
    }
  }, [isLoading, fileInfo, needsPassword, downloadStarted]);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!fileInfo) {
    navigate('/login');
    return null;
  }

 // If no password is needed, show a message while preparing download
  if (!needsPassword) {
    return (
      <div>
        <h2>Preparing your download…</h2>
      </div>
    );
  }

// Otherwise, prompt user for password
return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto text-center justify-center">
      <div>
        <div className="w-20 h-24 mx-auto mb-2 relative">
          <img src={getFileIcon(fileInfo.name.split(".").pop() || 'default')} alt="file" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-gray-600 text-2xl font-normal mb-4">{fileInfo.name}</h2>
      </div>
      <input
        type="password"
        value={filePassword}
        onChange={(e) => setFilePassword(e.target.value)}
        placeholder="Enter password to download the file"
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 text-center"
      />
     
      <button
        onClick={() => handleProtectedDownload(fileInfo.id, filePassword)}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        Download
      </button>
    </div>
  </div>
 );
}

// For no-password case: direct download
async function downloadFile(fileInfo: FileInfo) {
  try {
    const response = await api.get(`/shares/file/${fileInfo.id}/download`, {
      responseType: 'blob',
    });
    // Trigger the actual file download in browser:
    triggerFileDownload(response.data, fileInfo.name);
  } catch (err) {
    alert('Failed to download file.');
  }
}

// For password-protected case
async function handleProtectedDownload(fileId: string, filePassword: string) {
  try {
    const response = await api.get(
      `/shares/file/${fileId}/download?filePassword=${filePassword}`,
      { responseType: 'blob' },
    );
    // Use the filename from the server if needed, or a fallback
    triggerFileDownload(response.data, 'downloaded-file');
  } catch (err) {
    alert('Invalid password or file locked.');
  }
}

// Helper to create download from blob
function triggerFileDownload(blobData: Blob, filename: string) {
  const url = window.URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename); 
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default FileSharePage;

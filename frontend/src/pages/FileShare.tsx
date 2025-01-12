import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1) Verify the file share
    api.get(`/shares/file/verify?shareSecret=${shareSecret}`)
      .then((res) => {
        setFileInfo(res.data);
        setNeedsPassword(res.data.passwordNeeded);
      })
      .catch(() => setError('Invalid or expired file share link.'))
      .finally(() => setIsLoading(false));
  }, [shareSecret]);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!fileInfo) {
    navigate('/login');
    return null;
  }

  // If no password needed, show direct download option
  if (!needsPassword) {
    return (
      <div>
        <h1>{fileInfo.name}</h1>
        <button onClick={() => downloadFile(fileInfo)}>Download</button>
      </div>
    );
  }

  // Otherwise, prompt user for password
  return (
    <div>
      <h2>This file is password-protected</h2>
      <input
        type="password"
        placeholder="Enter file password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => handleProtectedDownload(fileInfo.id, password)}>
        Download
      </button>
    </div>
  );
}

// For no-password case: direct download
async function downloadFile(fileInfo: FileInfo) {
  try {
    // Typically GET /file/:id/download
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
async function handleProtectedDownload(fileId: string, password: string) {
  try {
    const response = await api.post(
      `/shares/file/${fileId}/download`,
      { password },
      { responseType: 'blob' },
    );
    triggerFileDownload(response.data, response.data.name);
  } catch (err) {
    alert('Invalid password or file locked.');
  }
}

// 7) Helper to create download from blob
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

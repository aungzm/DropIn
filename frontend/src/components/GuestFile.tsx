import React from 'react';
import { useState } from 'react';
import api from '../api/api';
import "react-datepicker/dist/react-datepicker.css";
import getFileIcon from '../utils/getFileIcon';
import { LockKeyhole, LockKeyholeOpen, Download } from 'lucide-react';

interface GuestFileCardProps {
  fileId: string;
  className?: string;
  fileName: string;
  locked: boolean;
}

interface FileShareData {
  url: string;
  expiresAt: Date | null;
  notes: string;
  maxDownloads?: number;
  remainingDownloads?: number;
}


const FileCard: React.FC<GuestFileCardProps> = ({
  fileId,
  fileName,
  locked,
}) => {
  const [isFileLocked, setIsFileLocked] = useState(locked);
  const fileExtension = fileName.split('.').pop() || ''; // File extension
  
  // "lock" or "unlock"
  const fileIcon = getFileIcon(fileExtension);
  const onDownloadClick = async () => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob', // Ensure response is treated as binary data
      });
  
      // Create a download link and trigger a click
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); 
      document.body.appendChild(link);
      link.click();
  
      // Clean up the URL object and link element
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Error during downloading:', error);
      alert('Failed to download the file. Please try again.');
    }
  };

  return (
    <div className="relative w-full p-3 bg-white rounded-lg shadow-sm">
      {/* Action Icons in top-right */}
      <div className="absolute top-6 right-5 flex items-center space-x-3 ">
        {/* Unlock SVG */}
        { isFileLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Unlock"
        >
          < LockKeyholeOpen size={20} />
        </button>)}
        {/* Lock SVG */}
        { !isFileLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Lock"
        >
          <LockKeyhole size={20} />
        </button>)}

        {/* Download */}
        <button
          onClick={onDownloadClick}
          className="text-blue-700 hover:text-blue-800"
          title="Download"
        >
          <Download size={20} />
        </button>

      {/* File icon, name, and status */}
      <div className="flex items-center gap-4">
        {/* Left: File icon */}
        <img
          src={fileIcon}
          alt="File icon"
          className="w-16 h-16 object-contain"
        />

        {/* Middle: File info and status */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">{fileName}</h2>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FileCard;

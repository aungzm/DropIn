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
  fileUrl: string;
}

const FileCard: React.FC<GuestFileCardProps> = ({
  fileId,
  fileName,
  locked,
  fileUrl,
}) => {
  const [isFileLocked, setIsFileLocked] = useState(locked);
  const fileExtension = fileName.split('.').pop() || ''; // File extension
  
  // "lock" or "unlock"
  const fileIcon = getFileIcon(fileExtension);
  const onDownloadClick = async () => {
    if (!fileUrl) {
      console.error('fileUrl is undefined or null.');
      alert('Unable to download the file because the URL is missing.');
      return;
    }
    const shareSecret = fileUrl.split('/').pop();
      try {
        const response = await api.get(`/shares/file/${fileId}/download?shareSecret=${shareSecret}`, {
          responseType: 'blob', // Ensure response is treated as binary data
        });
    
        // Create a download link and trigger a click
        const localUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = localUrl;
        link.setAttribute('download', fileName); 
        document.body.appendChild(link);
        link.click();
    
        // Clean up the URL object and link element
        window.URL.revokeObjectURL(localUrl);
        link.remove();
      } catch (error) {
        console.error('Error during downloading:', error);
        alert('Failed to download the file. Please try again.');
      }
  };

  return (
    <div className="relative w-full flex-row p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Action Icons in top-right */}
      <div className="absolute right-5 top-1 bottom-1 flex items-center">
        {/* Unlock SVG */}
        {isFileLocked && (
          <button className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50" title="Unlocked">
            <LockKeyholeOpen size={20} />
          </button>
        )}
        {/* Lock SVG */}
        {!isFileLocked && (
          <button className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50" title="Locked">
            <LockKeyhole size={20} />
          </button>
        )}
        {/* Download */}
        <button
          onClick={onDownloadClick}
          className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50" title="Download">
          <Download size={20} />
        </button>
      </div>
  
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
  );
  
};

export default FileCard;

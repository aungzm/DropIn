import React from 'react';
import { useState } from 'react';
import Modal from './Modal';
import api from '../api/api';
import { useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import getFileIcon from '../utils/getFileIcon';
import ShareModal from './ShareModal';
import { Share2, LockKeyhole, LockKeyholeOpen, Trash2, Download, Pencil, Link } from 'lucide-react';
import LinkModal from './LinkModal';

interface FileCardProps {
  className?: string;
  fileId: string;
  fileName: string;
  locked: boolean;
  progress: number;
  onRenameSucess: (newName: string) => void;
  onDeleteSuccess: (deletedFileId: string) => void;
}

interface FileShareData {
  url: string;
  expiresAt: Date | null;
  maxDownloads?: number | string;
  remainingDownloads?: number | string;
}



const FileCard: React.FC<FileCardProps> = ({
  fileId,
  fileName,
  locked,
  progress, 
  onRenameSucess,
  onDeleteSuccess
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isFileLocked, setIsFileLocked] = useState(locked);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState(fileName.split('.').shift() || ''); // File name without extension
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [fileShareData, setFileShareData] = useState<FileShareData | null >(null);
  const fileExtension = fileName.split('.').pop() || ''; // File extension
  
  // "lock" or "unlock"
  const [modalMode, setModalMode] = useState(locked ? "lock" : "unlock");
  const fileIcon = getFileIcon(fileExtension);

  // Password fields
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  
  // Handler for opening the modal
  const handleUnlockClick = () => {
    setModalMode("unlock");
    setShowModal(true);
  };

    const handleLockClick = () => {
      setModalMode("lock");
      setShowModal(true);
    };
  
    // Handler for closing the modal
    const handleCloseModal = () => {
      setShowModal(false);
      setPassword("");
      setRepeatPassword("");
    };
  
    // Single function to handle "Lock" or "Unlock" based on modalMode
  const handleSubmit = async () => {
    if (password !== repeatPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      if (modalMode === "lock") {
        await api.patch(`/files/${fileId}/lock`, { password, repeatPassword });
        setIsFileLocked(true);
        setModalMode("");
      } else {
        await api.patch(`/files/${fileId}/unlock`, { password, repeatPassword });
        setIsFileLocked(false);
        setModalMode("");
      }
    } catch (error) {
      console.error('Error during ', modalMode, error);
      alert('Failed to update the file lock status. Please try again.');
    }

    // Close modal
    handleCloseModal();
  };

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
  

  const handleRename = (e: React.FormEvent) => {
    setNewFileName(newFileName.trim());
    e.preventDefault();
    try { 
      api.put(`/files/${fileId}`, { newFileName }).then(() => {
        onRenameSucess(newFileName + '.' + fileExtension);
      });
    } catch (error) {
      console.error('Error during renaming:', error);
    }
    setShowRenameModal(false);
  }

  const onDeleteClick = () => {
    try {
      api.delete(`/files/${fileId}`).then(() => {
        onDeleteSuccess(fileId);
      });
    } catch (error) {
      console.error('Error during deletion:', error);
    }
  };
  
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await api.get(`/shares/file/${fileId}`);
        const fileShareLink = response.data
        if (fileShareLink) {
          setFileShareData(fileShareLink);
        } else {
          setFileShareData(null);
        }
      } catch (error) {
        console.error('Error fetching file details:', error);
      }
    };

    fetchFileDetails();
  }, [fileId]);

  // Decide what text to show in the modal:
  const modalTitle = modalMode === "lock" ? "Lock File" : "Unlock File";
  const decisionText = modalMode === "lock" ? "Lock" : "Unlock";
  return (
    <div className="relative w-full p-3 bg-white rounded-lg shadow-sm">
      {/* Action Icons in top-right */}
      <div className="absolute top-6 right-5 flex items-center space-x-3 ">
        {/* Unlock SVG */}
        { isFileLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Unlock"
          onClick={handleUnlockClick}
        >
          < LockKeyholeOpen size={20} />
        </button>)}
        {/* Lock SVG */}
        { !isFileLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Lock"
          onClick={handleLockClick}
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

        {/* Edit */}
        <button
          onClick={() => setShowRenameModal(true)}
          className="text-blue-700 hover:text-blue-800"
          title="Edit"
        >
          <Pencil size={20} />
        </button>

        {/* Share */}
        <button
          onClick={() => setShowShareModal(true)}
          className="text-red-600 hover:text-red-700"
          title="Share" 
        >
          <Share2 size={20} />
        </button>

        {/* Link */}
        <button
          className="hover:text-blue-700"
          title="Link"
          onClick={() => {
            setShowLinkModal(true);
          }}
        >
          <Link size={20}/>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteClick}
          className="text-red-600 hover:text-red-700"
          title="Delete"
        >
          <Trash2 size={20} />
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
          <p className="text-sm text-gray-500">{progress}% Completed</p>
          {/* Progress Bar */}
          <div className="relative w-full h-2 mt-2 bg-gray-200 rounded-full">
            {/* If you want dynamic progress, change w-full to w-[someNumber]% */}
            <div
              className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
         {/* Reusable Modal */}
         <Modal
          title={modalTitle}        // e.g. "Lock Space" or "Unlock Space"
          decisionText={decisionText}   // e.g. "Lock" or "Unlock"
          isOpen={showModal}
          onClose={handleCloseModal}
          >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Repeat Password
            </label>
            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                handleCloseModal();
                setModalMode("");
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {decisionText}
            </button>
          </div>
        </div>
      </Modal>
      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg text-center font-semibold mb-4">Rename Space</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                placeholder="New Space Name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg w-1/2"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {fileId && showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              onDelete={() => setShowShareModal(false)}
              updateShareData={(data) => setFileShareData(data)}
              spaceShareData={fileShareData}
              spaceIdOrFileId={fileId}
              type="file"
            />
          </div>
        )}
      
      {/* Link Modal */}
      {fileId && showLinkModal && fileShareData && (
        <LinkModal
        isOpen={showLinkModal}
        shareUrl={fileShareData.url}
        atExpiry={fileShareData.expiresAt}
        onClose={() => setShowLinkModal(false)}
      />
      )}
    </div>
  );
};

export default FileCard;

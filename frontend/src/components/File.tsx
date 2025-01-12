import React from 'react';
import { useState } from 'react';
import Modal from './Modal';
import api from '../api/api';
import { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { set } from 'react-datepicker/dist/date_utils';

interface FileCardProps {
  className?: string;
  fileId: string;
  fileName: string;
  locked: boolean;
  progress: number;
  onRenameSucess: (newName: string) => void;
  onDeleteSuccess: (deletedFileId: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({
  fileId,
  fileName,
  locked,
  progress, 
  onRenameSucess,
  onDeleteSuccess
}) => {
  // Ext file icon mapping
  const fileIconMap: { [key: string]: string } = {
    'pdf': '/src/assets/pdf.png',
    'doc': '/src/assets/doc.png',
    'xls': '/src/assets/xls.png',
    'jpg': '/src/assets/jpg.png',
    'png': '/src/assets/png.png',
    'default': '/src/assets/file.png',
    'xlsx': '/src/assets/xlsx.png',
    'docx': '/src/assets/docx.png',
    'ppt': '/src/assets/ppt.png',
    'pptx': '/src/assets/pptx.png',
    'txt': '/src/assets/txt.png',
    'gif': '/src/assets/gif.png',
    'jpeg': '/src/assets/jpeg.png',
  };

  

  
  const [showModal, setShowModal] = useState(false);
  const [isFileLocked, setIsFileLocked] = useState(locked);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState(fileName.split('.').shift() || ''); // File name without extension
  const [fileShareurl, setFileShareUrl] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [newExpiry, setNewExpiry] = useState<Date | null>(null);
  const [newMaxDownloads, setNewMaxDownloads] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileExtension = fileName.split('.').pop() || ''; // File extension
  const getFileIcon = () => {
    return fileIconMap[fileExtension] || fileIconMap['default'];
  };
  // "lock" or "unlock"
  const [modalMode, setModalMode] = useState(locked ? "lock" : "unlock");
  const fileIcon = getFileIcon();

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
        const fileShare = response.data
        if (fileShare) {
          setFileShareUrl(fileShare.url);
          setMaxDownloads(fileShare.maxDownloads);
          setExpiry(fileShare.expiresAt);
        }
      } catch (error) {
        console.error('Error fetching file details:', error);
      }
    };

    fetchFileDetails();
  }, [fileId]);

  const handleConfirmShare = async () => {
    try {
      const repsonse = await api.post(`/shares/file/${fileId}`, {
        maxDownloads: newMaxDownloads,
        expiry: newExpiry,
      });
      setMaxDownloads(newMaxDownloads);
      setExpiry(newExpiry);
      setShowShareModal(false);
      setFileShareUrl(repsonse.data.url);
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  }

  const handleDeleteShare = async () => {
    try {
      await api.delete(`/shares/file/${fileId}`);
      setFileShareUrl('');
      setMaxDownloads(null);
      setExpiry(null);
    } catch (error) {
      console.error('Error deleting file share:', error);
    }
  }

  const handleCancelShare = async () => {
    setShowShareModal(false);
    setNewExpiry(null);
    setNewMaxDownloads(null);
  }

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
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L21 21M17 10V8C17 5.23858 14.7614 3 12 3C11.0283 3 10.1213 3.27719 9.35386 3.75681M7.08383 
          7.08338C7.02878 7.38053 7 7.6869 7 8V10.0288M19.5614 19.5618C19.273 20.0348 18.8583 20.4201 18.362 20.673C17.7202 21 
          16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 
          17.8802 4 16.2V14.8C4 13.1198 4 12.2798 4.32698 11.638C4.6146 11.0735 5.07354 10.6146 5.63803 10.327C5.99429 10.1455 
          6.41168 10.0647 7 10.0288M19.9998 14.4023C19.9978 12.9831 19.9731 12.227 19.673 11.638C19.3854 11.0735 18.9265 10.6146 
          18.362 10.327C17.773 10.0269 17.0169 10.0022 15.5977 10.0002M10 10H8.8C8.05259 10 7.47142 10 7 10.0288" 
          stroke="#000000" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>)}
        {/* Lock SVG */}
        { !isFileLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Lock"
          onClick={handleLockClick}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path 
              d="M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 
              10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 
              11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 
              5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 
              21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 
              17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 
              10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 
              5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" 
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>)}

        {/* Download */}
        <button
          onClick={onDownloadClick}
          className="text-blue-700 hover:text-blue-800"
          title="Download"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15M21 15C21 17.8284 
              21 19.2426 20.1213 20.1213C19.8215 20.4211 19.4594 20.6186 19 20.7487"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Edit */}
        <button
          onClick={() => setShowRenameModal(true)}
          className="text-blue-700 hover:text-blue-800"
          title="Edit"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20.1497 7.93997L8.27971 19.81C7.21971 20.88 4.04971 21.3699 3.27971 20.6599C2.50971 
              19.9499 3.06969 16.78 4.12969 15.71L15.9997 3.84C16.5478 3.31801 17.2783 3.03097 
              18.0351 3.04019C18.7919 3.04942 19.5151 3.35418 20.0503 3.88938C20.5855 4.42457 
              20.8903 5.14781 20.8995 5.90463C20.9088 6.66146 20.6217 7.39189 20.0997 
              7.93997H20.1497Z"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21H12"
              stroke="#000"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Share */}
        <button
          onClick={onDeleteClick}
          className="text-red-600 hover:text-red-700"
          title="Share" 
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M23 5.5C23 7.98528 20.9853 10 18.5 10C17.0993 
              10 15.8481 9.36007 15.0228 8.35663L9.87308 10.9315C9.95603 11.2731 10 
              11.63 10 11.9971C10 12.3661 9.9556 12.7247 9.87184 13.0678L15.0228 
              15.6433C15.8482 14.6399 17.0993 14 18.5 14C20.9853 14 23 16.0147 23 
              18.5C23 20.9853 20.9853 23 18.5 23C16.0147 23 14 20.9853 14 18.5C14 
              18.1319 14.0442 17.7742 14.1276 17.4318L8.97554 14.8558C8.1502 15.8581 
              6.89973 16.4971 5.5 16.4971C3.01472 16.4971 1 14.4824 1 11.9971C1 
              9.51185 3.01472 7.49713 5.5 7.49713C6.90161 7.49713 8.15356 8.13793 
              8.97886 9.14254L14.1275 6.5682C14.0442 6.2258 14 5.86806 14 5.5C14 
              3.01472 16.0147 1 18.5 1C20.9853 1 23 3.01472 23 5.5ZM16.0029 5.5C16.0029 
              6.87913 17.1209 7.99713 18.5 7.99713C19.8791 7.99713 20.9971 6.87913 
              20.9971 5.5C20.9971 4.12087 19.8791 3.00287 18.5 3.00287C17.1209 
              3.00287 16.0029 4.12087 16.0029 5.5ZM16.0029 18.5C16.0029 19.8791 
              17.1209 20.9971 18.5 20.9971C19.8791 20.9971 20.9971 19.8791 20.9971 
              18.5C20.9971 17.1209 19.8791 16.0029 18.5 16.0029C17.1209 16.0029 16.0029 
              17.1209 16.0029 18.5ZM5.5 14.4943C4.12087 14.4943 3.00287 13.3763 
              3.00287 11.9971C3.00287 10.618 4.12087 9.5 5.5 9.5C6.87913 9.5 7.99713 
              10.618 7.99713 11.9971C7.99713 13.3763 6.87913 14.4943 5.5 
              14.4943Z"
              fill="#000"
            />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteClick}
          className="text-red-600 hover:text-red-700"
          title="Delete"
        >
            <svg width="20px" height="20px" viewBox="0 -0.5 21 21" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <title>delete [#1487]</title>
                <desc>Created with Sketch.</desc>
                <defs>

            </defs>
                <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g id="Dribbble-Light-Preview" transform="translate(-179.000000, -360.000000)" fill="#FF0000">
                        <g id="icons" transform="translate(56.000000, 160.000000)">
                            <path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M134.55,216 L136.65,216 L136.65,208 L134.55,208 L134.55,216 Z M128.25,218 L138.75,218 
                            L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z 
                            M138.75,204 L138.75,200 L128.25,200 L128.25,204 L123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" id="delete-[#1487]">
                            </path>
                        </g>
                    </g>
                </g>
            </svg>
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
      
      {/* Share Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg text-center font-semibold mb-4">Space Access</h3>
                <form onSubmit={handleConfirmShare}>
                  {/* Max Downloads */}
                  <label className="block font-medium mb-1">Max Downloads</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={maxDownloads ?? "unlimited"}
                    onChange={(e) => setNewMaxDownloads(e.target.value ? parseInt(e.target.value) : null)}
                    className="border rounded-lg px-3 py-2 mb-4 w-full"
                  />

                  {/* Expiry (Using React DatePicker) */}
                  <label className="block font-medium mb-1">Expiry</label>
                  <DatePicker
                    selected={expiry}
                    onChange={(date) => setNewExpiry(date || null)}
                    showTimeSelect            // Allows time selection
                    dateFormat="Pp"          // Formats date and time (e.g. 01/12/2025, 3:42 PM)
                    className="border rounded-lg px-3 py-2 mb-6 w-full"
                    placeholderText="Select date & time"
                  />

                  {/* Buttons */}
                  <div className="flex gap-4 justify-center">
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={handleDeleteShare}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-1/3"
                    >
                      Delete
                    </button>
                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={handleCancelShare}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg w-1/3"
                    >
                      Cancel
                    </button>
                    {/* Confirm */}
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-1/3"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}        
    </div>
  );
};

export default FileCard;

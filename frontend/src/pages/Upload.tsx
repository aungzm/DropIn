import React from "react";
import File from "../components/File";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/api";
import Modal from "../components/Modal";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LinkModal from "../components/LinkModal";
import ShareModal from "../components/ShareModal";

interface SpaceShareData {
  url: string;
  expiresAt: Date | null;
  notes: string;
  maxDownloads?: number;
  remainingDownloads?: number;
}


const Upload = () => {
  const navigate = useNavigate();
  const { spaceId } = useParams<{ spaceId: string }>();
  const [isSpaceLocked, setIsSpaceLocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [spaceName, setSpaceName] = useState("Loading...");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [newExpiry, setNewExpiry] = useState<Date | null>(null);
  const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
  const [newMaxDownloads, setNewMaxDownloads] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [spaceShareData, setSpaceShareData] = useState<SpaceShareData[]>([]);

  // "lock" or "unlock"
  const [modalMode, setModalMode] = useState("lock");

  // Password fields
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  
    // Handler for opening the modal
    useEffect(() => {
      const fetchSpaceDetails = async () => {
        try {
          const spaceInfoResponse = (await api.get(`/spaces/${spaceId}`));
          const spaceLinkResponse = await api.get(`/shares/space/${spaceId}`);
          const spaceLink = spaceLinkResponse.data;
          const space = spaceInfoResponse.data.space;
          setSpaceName(space.name);
          setIsSpaceLocked(space.password === "Yes");
          if (spaceLink && Array.isArray(spaceLink)) {
            setSpaceShareData(spaceLink);
          } else {
              setSpaceShareData([]);
          }
    
          // Add progress: 100 to already uploaded files
          const fetchedFiles = (space.files || []).map((file) => ({
            ...file,
            progress: 100, // Mark fetched files as fully uploaded
          }));
          setFiles(fetchedFiles);
        } catch (error) {
          console.error("Error fetching space details:", error);
          navigate("/dashboard"); // Redirect if space is not found
        }
      };
    
      fetchSpaceDetails();
    }, [spaceId, navigate]);
  

    const handleLockUnlock = async () => {
      if (password !== repeatPassword) {
        alert("Passwords do not match!");
        return;
      }
  
      try {

        if (modalMode === "lock") {
          if (password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
          } else {
            await api.patch(`/spaces/${spaceId}/lock`, {password, repeatPassword});
            setModalMode("unlock");
          }
        } else {
          if (password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
          } else {
            await api.patch(`/spaces/${spaceId}/unlock`, {password, repeatPassword});
            setModalMode("lock");
          }
        }
        setIsSpaceLocked(modalMode === "lock");
        alert(`Space ${modalMode === "lock" ? "locked" : "unlocked"} successfully!`);
        setShowModal(false);
      } catch (error) {
        console.error(`Error ${modalMode === "lock" ? "locking" : "unlocking"} space:`, error);
        console.log(error);
        alert(`Failed to ${modalMode === "lock" ? "lock" : "unlock"} the space.`);
      } finally {
        setPassword("");
        setRepeatPassword("");
        setShowModal(false);
      }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("new space name:", newSpaceName);
    if (newSpaceName.trim()) {
      const response  = api.put(`/spaces/${spaceId}`, { newSpaceName }).then(() => {
        setShowRenameModal(false);
        setSpaceName(newSpaceName);
      });
      console.log(response);
      setNewSpaceName('');
    }
  };  

  const handleDownloadAll = async () => {
    try {
      // Make an API call to get the ZIP file
      const response = await api.get(`/spaces/${spaceId}/downloadAll`, {
        responseType: 'blob', 
      });
  
      // Create a URL for the downloaded blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `space-${spaceId}.zip`); // Set the download file name
      document.body.appendChild(link);
      link.click(); // Trigger the download
      link.remove(); 
      window.URL.revokeObjectURL(url); 
    } catch (error) {
      console.error('Error downloading all files:', error);
      alert('Failed to download all files. Please try again.');
    }
  };

  const handleDeleteSpace = async () => {
    try {
      await api.delete(`/spaces/${spaceId}`);
      alert("Space deleted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting space:", error);
      alert("Failed to delete space. Please try again.");
    }
  }


  const handleUploadFiles = async (fileList: FileList) => {
    if (!fileList) return;
  
    // The same core logic here
    const uploadProgress: { [key: string]: number } = {};
  const lastUpdateTime = {};

  Array.from(fileList).forEach((file) => {
    const formData = new FormData();
    formData.append("file", file);
    if (spaceId) {
      formData.append("spaceId", spaceId);
    } else {
      console.error("spaceId is undefined");
      return;
    }

    // Initialize progress and timestamp
    uploadProgress[file.name] = 0;
    lastUpdateTime[file.name] = Date.now();

    // Temporary file in state
    setFiles((prevFiles) => [
      ...prevFiles,
      { id: `temp-${file.name}`, name: file.name, progress: 0 },
    ]);

    // Upload request
    api
      .post(`/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          // Throttle and update progress
          const total = progressEvent.total || progressEvent.loaded;
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / total
          );

          const now = Date.now();
          if (
            now - lastUpdateTime[file.name] >= 3000 ||
            percentCompleted === 100
          ) {
            lastUpdateTime[file.name] = now;
            uploadProgress[file.name] = percentCompleted;

            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.name === file.name
                  ? { ...f, progress: percentCompleted }
                  : f
              )
            );
          }
        },
      })
      .then((response) => {
        const uploadedFile = response.data.file;
        // Replace temp file
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.name === file.name ? { ...uploadedFile, progress: 100 } : f
          )
        );
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        alert(`Failed to upload file: ${file.name}. Please try again.`);
      });
  });
};

  
  
  
  
  // Decide what text to show in the modal:
  const modalTitle = modalMode === "lock" ? "Lock Space" : "Unlock Space";
  const decisionText = modalMode === "lock" ? "Lock" : "Unlock";
  return (
   
    <div className="min-h-screen bg-white">
        <Navbar/>
      {/* Top bar */}
      <div className="mt-20 flex mitems-center gap-2 px-6 py-4 shadow-sm">
        {/* Back arrow (button) */}
        <button className="text-gray-700 hover:text-gray-900 onCLi" onClick={() => navigate('/dashboard')}>
          {/* Example arrow icon */}
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              d="M9.707 14.707a1 1 0 0 1-1.414 0l-3.999-4a1 1 0 0 1 0-1.414l4-4a1 
               1 0 0 1 1.414 1.414L6.414 9H17a1 1 0 1 1 0 2H6.414l3.293 3.293a1 
               1 0 0 1 0 1.414Z"
            />
          </svg>
        </button>

        {/* Space name */}
        <h1 className="text-xl font-semibold text-gray-800">
          {spaceName}
        </h1>
        {/* Unlock SVG */}
        { isSpaceLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Unlock"
          onClick={() => {
            setModalMode("unlock");
            setShowModal(true);
          }}
        >
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L21 21M17 10V8C17 5.23858 14.7614 3 12 3C11.0283 3 10.1213 3.27719 9.35386 3.75681M7.08383 
          7.08338C7.02878 7.38053 7 7.6869 7 8V10.0288M19.5614 19.5618C19.273 20.0348 18.8583 20.4201 18.362 20.673C17.7202 21 
          16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 
          17.8802 4 16.2V14.8C4 13.1198 4 12.2798 4.32698 11.638C4.6146 11.0735 5.07354 10.6146 5.63803 10.327C5.99429 10.1455 
          6.41168 10.0647 7 10.0288M19.9998 14.4023C19.9978 12.9831 19.9731 12.227 19.673 11.638C19.3854 11.0735 18.9265 10.6146 
          18.362 10.327C17.773 10.0269 17.0169 10.0022 15.5977 10.0002M10 10H8.8C8.05259 10 7.47142 10 7 10.0288" 
          stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>)}
        {/* Lock SVG */}
        { !isSpaceLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Lock"
          onClick={() => {
            setModalMode("lock");
            setShowModal(true);
          }}

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
          className="text-blue-700 hover:text-blue-800"
          title="Download"
          onClick={handleDownloadAll}
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
          onClick={() => {
            setNewSpaceName(spaceName);
            setShowRenameModal(true);
          }}
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

        {/* Share (Example) */}
        <button
          className="text-red-600 hover:text-red-700"
          title="Share" 
          onClick={() => {
            setShowShareModal(true);
          }}
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
          className="text-red-600 hover:text-red-700"
          title="Delete"
          onClick= {() => {handleDeleteSpace()}}
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

      {/* Main area */}
    <div className="flex flex-row items-start gap-8 px-6 py-6">
      {/* Left column: Drag-and-drop area */}
      <div
        className="w-1/2 aspect-square rounded-lg border-2 border-dashed border-blue-600 p-8 flex flex-col items-center justify-center text-center"
        onDragOver={(e) => {
          e.preventDefault();
          // Optionally e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const droppedFiles = e.dataTransfer.files;
          if (droppedFiles && droppedFiles.length > 0) {
            handleUploadFiles(droppedFiles);
          }
        }}
      >
        {/* Upload icon (just an example) */}
        <svg
          className="w-10 h-10 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5m0 0l5 5m-5-5v12" />
        </svg>
        
        {/* Browse button */}
        <input
          type="file"
          multiple
          className="hidden"
          id="fileInput"
          onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        />
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          Browse
        </button>
        
        <p className="mt-2 text-gray-500">OR</p>
        <p className="text-sm text-gray-600">Drag and drop files here</p>
      </div>

      {/* Right column: Uploaded files */}
      <div className="w-1/2 aspect-square bg-gray-200 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Uploaded Files
          </h2>
          <div className="flex-1 overflow-y-auto">
            {files.map((file) => (
              <File
              key={file.id}
              fileName={file.name}
              fileId={file.id}
              locked={file.password === "Yes"}
              progress={file.progress} 
              onDeleteSuccess={(deletedFileId) => {
                const updatedFiles = files.filter((f) => f.id !== deletedFileId);
                setFiles(updatedFiles);
              }} // Remove the file from the map
              onRenameSucess={(newName) => {
                const updatedFiles = files.map((f) => {
                if (f.id === file.id) {
                  return { ...f, name: newName };
                }
                return f;
                });
                setFiles(updatedFiles);
              }} // Edit the name in the map
              />
            ))}
          </div>
        </div>
    </div>
     {/* Reusable Modal */}
      <Modal
        title={modalTitle}        // e.g. "Lock Space" or "Unlock Space"
        decisionText={decisionText}   // e.g. "Lock" or "Unlock"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-lg px-1 py-2 mt-1 mb-5 text-sm w-full"
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
              className="border rounded-lg px-1 py-2 mt-1 mb-5 text-base w-full"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleLockUnlock}
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
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
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
        {spaceId && showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              spaceShareData={spaceShareData}
              spaceIdOrFileId={spaceId}
              type="space"
            />
          </div>
        )}
    </div>
  );
};

export default Upload;

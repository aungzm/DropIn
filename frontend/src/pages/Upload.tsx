import React from "react";
import File from "../components/File";
import Navbar from "../components/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/api";
import Modal from "../components/Modal";
import 'react-datepicker/dist/react-datepicker.css';
import ShareModal from "../components/ShareModal";
import LinkModal from "../components/LinkModal";
import { Share2, LockKeyhole, LockKeyholeOpen, Trash2, Download, Pencil, Upload as UploadIcon, ArrowLeft, Link} from "lucide-react";

interface SpaceShareData {
  url: string;
  expiresAt: Date | null;
  maxDownloads?: number | string;
  remainingDownloads?: number | string;
}

interface SpaceLink {
  url: string;
  expiresAt: Date | null;
  maxDownloads: number;
  remainingDownloads: number;
}


const Upload = () => {
  const navigate = useNavigate();
  const { spaceId } = useParams<{ spaceId: string }>();
  const [isSpaceLocked, setIsSpaceLocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [spaceName, setSpaceName] = useState("Loading...");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [spaceShareData, setSpaceShareData] = useState<SpaceShareData | null>(null);

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
          const spaceLink: SpaceLink = spaceLinkResponse.data;
          const space = spaceInfoResponse.data.space;
          setSpaceName(space.name);
          setIsSpaceLocked(space.password === "Yes");
          if (spaceLink) {
            setSpaceShareData(spaceLink);
          } else {
              setSpaceShareData(null); // clear the state
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
      <div className="mt-20 flex items-center gap-2 px-6 py-4 shadow-sm">
        {/* Back arrow (button) */}
        <button className="text-gray-700 hover:text-gray-900 onCLi" onClick={() => navigate('/dashboard')}>
          {/* Arrow icon */}
          <ArrowLeft size={20}/>
        </button>

        {/* Space name */}
        <h1 className="text-xl font-semibold text-gray-800 mb-1">
          {spaceName}
        </h1>
        {/* Unlock SVG */}
        { !isSpaceLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Unlock"
          onClick={() => {
            setModalMode("unlock");
            setShowModal(true);
          }}
        >
          <LockKeyholeOpen size={20}/>
        </button>)}
        {/* Lock SVG */}
        { isSpaceLocked && (<button
          className="text-blue-700 hover:text-blue-800"
          title="Lock"
          onClick={() => {
            setModalMode("lock");
            setShowModal(true);
          }}
        >
          <LockKeyhole size={20}/>
        </button>)}

        {/* Download */}
        <button
          className="text-blue-700 hover:text-blue-800"
          title="Download"
          onClick={handleDownloadAll}
        >
          <Download />
        </button>

        {/* Edit */}
        <button
          onClick={() => {
            setNewSpaceName(spaceName);
            setShowRenameModal(true);
          }}
        >
          <Pencil  size={20}/>
        </button>

        {/* Share*/}
        <button
          className={`${spaceShareData !== null ? 'text-blue-700' : 'text-gray-500'} hover:text-blue-700`}
          title="Share" 
          onClick={() => {
            setShowShareModal(true);
          }}
        >
          <Share2 size={20}/>
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
          className="text-red-600 hover:text-red-700"
          title="Delete"
          onClick= {() => {handleDeleteSpace()}}
        >
          <Trash2 size={20}/>
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
        {/* Upload icon */}
        <UploadIcon size={48} className="text-blue-600" />
        
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
              spaceShareData={spaceShareData}
              onClose={() => setShowShareModal(false)}
              updateShareData={(data) => setSpaceShareData(data)}
              onDelete={() => {setShowShareModal(false); setSpaceShareData(null);}}
              spaceIdOrFileId={spaceId}
              type="space"
            />
          </div>
        )}
        {spaceShareData && showLinkModal && (
          <LinkModal
            isOpen={showLinkModal}
            shareUrl={spaceShareData.url}
            atExpiry={spaceShareData.expiresAt}
            onClose={() => setShowLinkModal(false)}
          />
        )}
    </div>
  );
};

export default Upload;

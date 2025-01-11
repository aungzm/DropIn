import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

interface SpaceProps {
  spaceId: string;
  spaceName: string;
  creator: string;
  onDeleteSpaceSucess: () => void;
  onClickSpace: () => void;
  onRenameSuccess: (newName: string) => void; // New callback prop
}

const Space: React.FC<SpaceProps> = ({ spaceId, spaceName, creator, onDeleteSpaceSucess, onClickSpace, onRenameSuccess }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
  };

  const onRenameSpace = (newName: string) => {
    api.put(`/spaces/${spaceId}`, { newSpaceName: newName });
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      api.put(`/spaces/${spaceId}`, { newSpaceName }).then(() => {
        setShowRenameModal(false);
        onRenameSuccess(newSpaceName); // Notify parent about the updated name
      });
      setNewSpaceName('');
    }
  };

  const handleUploadPage = () => {
    onClickSpace();
  }

  const handlDelete = () => {
    api.delete(`/spaces/${spaceId}`).then(() => {
      onDeleteSpaceSucess();
      setShowDeleteModal(false);
    });
  }

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="relative w-64 h-64 bg-white border border-gray-200 rounded-lg shadow">
      {/* Existing space content */}
      <div className="flex justify-end px-4 pt-4">
        <button
          onClick={handleDropdownToggle}
          className="inline-block text-gray-500 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg text-sm p-1.5"
          type="button"
        >
          <span className="sr-only">Open dropdown</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 16 3"
          >
            <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
          </svg>
        </button>
        <div
          ref={dropdownRef}
          className={`absolute right-4 top-12 z-10 ${dropdownOpen ? '' : 'hidden'} text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow w-44`}
        >
          <ul className="py-2" aria-labelledby="dropdownButton">
            <li>
              <button
                onClick={() => {
                  setShowRenameModal(true);
                  setDropdownOpen(false);
                }}
                className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Space Name
              </button>
            </li>
            <li>
              <button
                onClick={
                  () => {
                    setShowDeleteModal(true);
                    setDropdownOpen(false);
                }}
                className="block w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="p-14 w-64 h-64 justify-center text-center cursor-pointer" onClick={handleUploadPage} >
        <h5 className="mb-1 text-xl font-medium text-gray-900 text-center">{spaceName}</h5>
        <span className="text-sm text-gray-500 text-center">{creator}</span>
      </div>

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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-semibold mb-4 text-center">Delete Space</h3>
            <h4 className="text-sm text-gray-500 mb-5 text-center">Are you sure you want to delete {spaceName}?</h4>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-1/2"
                  onClick={handlDelete}
                >
                  Delete
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Space;

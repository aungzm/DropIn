import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';

interface SpaceProps {
  profilePic: string;
  userId: string;
  email: string;
  userName: string;
  role: string;
}

const Space: React.FC<SpaceProps> = ({ profilePic, userId, email, userName, role, }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [AreYouSureModal, setAreYouSureModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [dialogueText, setDialogueText] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDropdownToggle = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        }
    };

    const handleConfirmButton = async () => {
        setAreYouSureModal(false);
        if (dialogueText.includes('delete')) {
            await handleDeleteUser();
            setDialogueText('');
        } else if (dialogueText.includes('promote')) {
            await handlePromoteUser();
            setDialogueText('');
        } else if (dialogueText.includes('demote')) {
            await handleDemoteUser();
            setDialogueText('');
        } else {
            console.error('Invalid action');
        }
    };

    const handleDeleteUser = async () => {
        // Call the API to delete the user
        try {
            await api.delete(`/admins/users/${userId}`);
            // Reload the page
            window.location.reload();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }

    };

    const handleDemoteUser = async () => {
        // Call the API to demote the user
        try {
            await api.put(`/admins/users/${userId}/demote`);
            // Reload the page
            window.location.reload();
        } catch (error) {
            console.error('Error demoting user:', error);
            alert('Failed to demote user');
        }
    };
    
    const handlePromoteUser = async () => {
        // Call the API to promote the user
        try {
            await api.put(`/admins/users/${userId}/promote`);
            // Reload the page
            window.location.reload();
        } catch (error) {
            console.error('Error promoting user:', error);
            alert('Failed to promote user');
        }
    };


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
                        setAreYouSureModal(true);
                        setDropdownOpen(false);
                        setDialogueText(
                            role === 'user' 
                                ? `Are you sure you want to promote ${userName}?`
                                : `Are you sure you want to demote ${userName}?`
                        );
                    }}
                    className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    {role === 'user' ? 'Promote User' : 'Demote User'}
                </button>
                </li>
                <li>
                <button
                    onClick={() => {
                    setAreYouSureModal(true);
                    setDropdownOpen(false);
                    setDialogueText(`Are you sure you want to delete ${userName}?`);
                    }}
                    className="block w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                    Delete User
                </button>
                </li>
            </ul>
            </div>
        </div>
        <div className="p-8 w-64 h-64 justify-center text-center cursor-pointer">
            <img src={profilePic} alt={`${userName}'s profile`} className="w-20 h-20 rounded-full mx-auto mb-2" />
            <h5 className="mb-1 text-xl font-medium text-gray-900 text-center">{email}</h5>
            <span className="text-sm text-gray-500 text-center">{userName}</span><br/>
            <span className="text-sm text-gray-500 text-center">{role}</span>
        </div>

        {/* Rename Modal */}
        {AreYouSureModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-semibold mb-4 text-center">Caution</h3>
                <form>
                <h5 className='text-center mb-4'>{dialogueText}</h5>
                <div className="flex gap-4">
                    <button
                    type="button"
                    onClick={() =>{setAreYouSureModal(false)} }
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2"
                    >
                    Cancel
                    </button>
                    <button
                    type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg w-1/2"
                    onClick={() => { setAreYouSureModal(false); handleConfirmButton();}}
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

export default Space;

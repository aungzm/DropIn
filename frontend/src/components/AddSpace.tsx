import React from 'react';
import { useState } from 'react';
import api from '../api/api';


interface AddSpaceProps {
    onSpaceAdded: (newSpace: any) => void;
}

const AddSpace: React.FC<AddSpaceProps> = ({ onSpaceAdded }) => {
    const [showModal, setShowModal] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');


    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSpaceName.trim()) {
            try {
                const response = await api.post('/spaces/', { spaceName: newSpaceName });
                const createdSpace = response.data.space;
                onSpaceAdded(createdSpace);
            } catch (error) {
                console.error(error);
            }
            setShowModal(false);
            setNewSpaceName('');
        }
    };

    return (
        <div 
            onClick = {() => setShowModal(true)}
            className="w-64 h-64 border-2 border-dashed border-gray-400 rounded-lg flex flex-col justify-center items-center cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-gray-500">Add new space</span>
            {/* Rename Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <h3 className="text-lg font-semibold mb-4">Create New Space</h3>
                    <form onSubmit={handleCreateSpace}>
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
                        onClick={() => setShowModal(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2"
                        >
                        Cancel
                        </button>
                        <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg w-1/2"
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

export default AddSpace;

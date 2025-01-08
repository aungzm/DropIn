import React from 'react';

const AddSpace: React.FC = () => {
    return (
        <div
            className="w-64 h-64 border-2 border-dashed border-gray-400 rounded-lg flex flex-col justify-center items-center cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-gray-500">Add new space</span>
        </div>
    );
};

export default AddSpace;
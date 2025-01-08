// Modal.js
import React from "react";

const Modal = ({ isOpen, onClose, decisionText ,title, children }) => {
  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="relative w-full max-w-md p-6 bg-white shadow-lg rounded-md">
        {/* Close Button (optional) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}

        {/* Actual modal content (your form, etc.) */}
        {children}
      </div>
    </div>
  );
};

export default Modal;

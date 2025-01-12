import React from 'react';
import QRCode from 'react-qr-code';

function LinkModal({ showLinkModal, shareUrl, onClose }) {
  // If not visible, render nothing.
  if (!showLinkModal) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex 
                 items-center justify-center"
      onClick={onClose} // Click outside to close
    >
      {/* Prevent clicks inside modal from closing */}
      <div
        className="relative p-5 border w-96 shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl text-center font-semibold mb-4 text-blue-700">
          Share via url:
        </h3>

        <p className="text-center text-sm text-gray-800 mb-8">
          {shareUrl}
        </p>

        <h3 className="text-xl text-center font-semibold mb-4 text-blue-700">
          Or QR image:
        </h3>

        {/* QR Code */}
        <div className="flex justify-center mb-8">
          <QRCode value={shareUrl} />
        </div>

        <button
          onClick={onClose}
          className="block mx-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default LinkModal;

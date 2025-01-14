import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Check } from 'lucide-react';

function LinkModal({ showLinkModal, shareUrl, onClose }) {
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!showLinkModal) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex
                 items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative p-5 border w-96 shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl text-center font-semibold mb-4 text-blue-700">
          Share via url:
        </h3>
        <div 
          className="relative group"
          onMouseEnter={() => setShowCopy(true)}
          onMouseLeave={() => setShowCopy(false)}
        >
          <p className="text-center text-sm text-gray-800 mb-8 break-all">
            {shareUrl}
          </p>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="absolute -right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 
                       hover:bg-gray-200 rounded-full transition-all duration-200"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
        <h3 className="text-xl text-center font-semibold mb-4 text-blue-700">
          Or QR image:
        </h3>
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
import React, { useState, FormEvent } from 'react';
import { QrCode, Edit, Trash } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api/api';
import QRCode from 'react-qr-code';

interface SpaceShareData {
  url: string;
  expiresAt: Date | null;
  notes: string;
  maxDownloads?: number | string;
  remainingDownloads?: number | string;
}

interface ShareManagementProps {
  spaceIdOrFileId: string;
  isOpen: boolean;
  spaceShareData: SpaceShareData[];
  type: 'space' | 'file';
  onClose: () => void;
}

const ShareManagement: React.FC<ShareManagementProps> = ({
  spaceIdOrFileId,
  isOpen,
  spaceShareData,
  type,
  onClose
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingShare, setEditingShare] = useState<SpaceShareData | null>(null);
  const [maxDownloads, setMaxDownloads] = useState('');
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [qrModal, setQrModal] = useState<string | null>(null);

  if (!isOpen) return null;

  const addNewShare = async (maxDownloads: number | string, expiresAt: string | null, notes: string) => {
    try {
      const endpoint = type === 'space' ? `/shares/space/${spaceIdOrFileId}` : `/shares/file/${spaceIdOrFileId}`;
      const response = await api.post(endpoint, { maxDownloads, expiresAt, notes });
      if (response.status === 201) {
        spaceShareData.push(response.data);
      } else {
        alert('Failed to create share');
      }
    } catch (error) {
      console.error('Error creating share:', error);
    }
  };

  const modifyShare = async (url: string, newMaxDownloads: number | string, newExpiry: Date | null, newNotes: string) => {
    try {
      const shareSecret = url.split('/').pop();
      const endpoint = type === 'space' ? `/shares/space/${spaceIdOrFileId}/${shareSecret}` : `/shares/file/${spaceIdOrFileId}/${shareSecret}`;
      const response = await api.patch(endpoint, {
        maxDownloads: newMaxDownloads,
        expiresAt: newExpiry ? newExpiry.toISOString() : null,
        notes: newNotes
      });

      if (response.status === 200) {
        const index = spaceShareData.findIndex((share) => share.url === url);
        spaceShareData[index] = {
          ...spaceShareData[index],
          maxDownloads: newMaxDownloads,
          expiresAt: newExpiry,
          notes: newNotes
        };
      } else {
        alert('Failed to modify share');
      }
    } catch (error) {
      console.error('Error modifying share:', error);
    }
  };

  const handleDeleteShare = async (url: string) => {
    try {
      const shareSecret = url.split('/').pop();
      const endpoint = type === 'space' ? `/shares/space/${spaceIdOrFileId}/${shareSecret}` : `/shares/file/${spaceIdOrFileId}/${shareSecret}`;
      const response = await api.delete(endpoint);

      if (response.status === 204) {
        const updatedData = spaceShareData.filter((share) => share.url !== url);
        spaceShareData.length = 0;
        spaceShareData.push(...updatedData);
      } else {
        alert('Failed to delete share');
      }
    } catch (error) {
      console.error('Error deleting share:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingShare) {
      await modifyShare(editingShare.url, maxDownloads || 'unlimited', expiry, notes);
    } else {
      await addNewShare(maxDownloads || 'unlimited', expiry ? expiry.toISOString() : null, notes);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingShare(null);
    setMaxDownloads('');
    setExpiry(null);
    setNotes('');
    setQrModal(null);
  };

  const openEditModal = (share: SpaceShareData) => {
    setEditingShare(share);
    setMaxDownloads(share.maxDownloads as string);
    setExpiry(share.expiresAt ? new Date(share.expiresAt) : null);
    setNotes(share.notes);
    setShowModal(true);
  };

  const openQrModal = (url: string) => {
    setQrModal(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-3 mb-6">
        {spaceShareData.map((share) => (
          <div key={share.url} className="flex items-center gap-4">
            <div className="w-1/4 p-2 bg-[#1a4d6d] text-white rounded truncate">
              {share.notes}
            </div>
            <div className="flex-1 p-2 bg-[#1a4d6d] text-white rounded truncate">
              {share.url}
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => openQrModal(share.url)}
              >
                <QrCode size={20} />
              </button>
              <button
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => openEditModal(share)}
              >
                <Edit size={20} />
              </button>
              <button
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDeleteShare(share.url)}
              >
                <Trash size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onClose}
          className="w-24 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="w-24 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">
              {editingShare ? 'Edit Share' : 'Create New Share'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name/Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter name or notes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Downloads</label>
                <input
                  type="number"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expiry</label>
                <DatePicker
                  selected={expiry}
                  onChange={setExpiry}
                  showTimeSelect
                  dateFormat="Pp"
                  className="w-full p-2 border rounded"
                  placeholderText="Select date and time"
                />
              </div>

              <div className="flex justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-32 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-32 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingShare ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {qrModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQrModal(null);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl text-center">
            <h3 className="text-xl font-semibold mb-4">QR Code</h3>
            <div className="flex justify-center">
              <QRCode value={qrModal} size={256} />
            </div>
            <button
              onClick={() => setQrModal(null)}
              className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareManagement;

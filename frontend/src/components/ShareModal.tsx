import React, { useState, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../api/api';

interface SpaceShareData {
  url: string;
  expiresAt: Date | null;
  maxDownloads?: number | string;
  remainingDownloads?: number | string;
}

interface ShareManagementProps {
  spaceIdOrFileId: string;
  isOpen: boolean;
  spaceShareData: SpaceShareData | null;
  type: 'space' | 'file';
  onClose: () => void;
  onDelete: () => void;
  updateShareData: (data: SpaceShareData | null) => void;
}

const ShareManagement: React.FC<ShareManagementProps> = ({
  spaceIdOrFileId,
  isOpen,
  spaceShareData,
  type,
  updateShareData,
  onDelete,
  onClose,
}) => {
  const [maxDownloads, setMaxDownloads] = useState('');
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [editingShare, setEditingShare] = useState<boolean>(!!spaceShareData);

  if (!isOpen) return null;
  console.log("is it editing", editingShare);

  const addNewShare = async (maxDownloads: number | null, expiresAt: string | null) => {
    try {
      const endpoint =
        type === 'space'
          ? `/shares/space/${spaceIdOrFileId}`
          : `/shares/file/${spaceIdOrFileId}`;
      const response = await api.post(endpoint, { maxDownloads, expiresAt });
      if (response.status === 201) {
        const newShareData: SpaceShareData = response.data;
        updateShareData(newShareData);
      } else {
        alert('Failed to create share');
      }
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Error creating share. Please try again.');
    }
  };

  const modifyShare = async (url: string, newMaxDownloads: number | null, newExpiry: Date | null) => {
    try {
      const shareSecret = url.split('/').pop();
      const endpoint =
        type === 'space'
          ? `/shares/space/${spaceIdOrFileId}/${shareSecret}`
          : `/shares/file/${spaceIdOrFileId}/${shareSecret}`;
      const response = await api.patch(endpoint, {
        maxDownloads: newMaxDownloads,
        expiresAt: newExpiry ? newExpiry.toISOString() : null,
      });

      if (response.status === 200) {
        const newShareData: SpaceShareData = response.data;
        updateShareData(newShareData);
      } else {
        alert('Failed to modify share');
      }
    } catch (error) {
      console.error('Error modifying share:', error);
      alert('Error modifying share. Please try again.');
    }
  };

  const handleDeleteShare = async () => {
    if (!spaceShareData) return;
    try {
      const shareSecret = spaceShareData.url.split('/').pop();
      const endpoint =
        type === 'space'
          ? `/shares/space/${spaceIdOrFileId}/${shareSecret}`
          : `/shares/file/${spaceIdOrFileId}/${shareSecret}`;
      const response = await api.delete(endpoint);

      if (response.status === 204) {
        updateShareData(null);
        onDelete();
      } else {
        alert('Failed to delete share');
      }
    } catch (error) {
      console.error('Error deleting share:', error);
      alert('Error deleting share. Please try again.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formattedMaxDownloads = maxDownloads ? parseInt(maxDownloads) : null;
    if (editingShare && spaceShareData) {
      await modifyShare(spaceShareData.url, formattedMaxDownloads, expiry);
    } else {
      await addNewShare(formattedMaxDownloads, expiry ? expiry.toISOString() : null);
    }
    resetForm();
  };

  const resetForm = () => {
    onClose();
    setEditingShare(false);
    setMaxDownloads('');
    setExpiry(null);
  };

  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
          <h3 className="text-xl font-semibold mb-4">
            {editingShare ? 'Edit Share' : 'Create New Share'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                onClick={handleDeleteShare}
                className="w-32 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
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
    </div>
  );
};

export default ShareManagement;

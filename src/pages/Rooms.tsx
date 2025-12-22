import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, ArrowLeft, DoorOpen, Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import Modal from '../components/Modal';
import type { Room } from '../types';

const Rooms = () => {
  const { selectedHotel } = useHotel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [newRoom, setNewRoom] = useState({ 
    number: '', 
    type: 'standard', 
    price: 0, 
    floor_no: 1, 
    status: 'available' 
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedHotel) {
      fetchRooms();
    }
  }, [selectedHotel]);

  const fetchRooms = async () => {
    if (!selectedHotel) return;
    try {
      setLoading(true);
      const response = await api.get(`/rooms?hotel_id=${selectedHotel.ID}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return alert('Please select a hotel first');
    
    setSubmitting(true);
    try {
      await api.post('/rooms', {
        ...newRoom,
        hotel_id: selectedHotel.ID,
        price: Number(newRoom.price),
        floor_no: Number(newRoom.floor_no)
      });
      setNewRoom({ number: '', type: 'standard', price: 0, floor_no: 1, status: 'available' });
      setView('list');
      fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error);
      alert('Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    
    setSubmitting(true);
    try {
      await api.put(`/rooms/${editingRoom.ID}`, {
        number: editingRoom.number,
        type: editingRoom.type,
        price: Number(editingRoom.price),
        floor_no: Number(editingRoom.floor_no),
        status: editingRoom.status
      });
      setEditingRoom(null);
      setView('list');
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Failed to update room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    
    try {
      await api.delete(`/rooms/${deletingRoom.ID}`);
      setShowDeleteModal(false);
      setDeletingRoom(null);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `number,type,price,floor_no,status
101,standard,500000,1,available
102,standard,500000,1,available
201,deluxe,750000,2,available
202,deluxe,750000,2,available
301,suite,1200000,3,available
302,suite,1200000,3,available`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rooms_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }
      setUploadFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedHotel) {
      setUploadError('Please select a hotel first');
      return;
    }

    if (!uploadFile) {
      setUploadError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await api.post(`/rooms/bulk-upload?hotel_id=${selectedHotel.ID}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadSuccess(`Successfully created ${response.data.count} rooms`);
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchRooms();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowBulkUploadModal(false);
        setUploadSuccess(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading rooms:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setUploadError(`Upload failed:\n${errors.join('\n')}`);
      } else {
        setUploadError(error.response?.data?.error || 'Failed to upload rooms. Please check your CSV file format.');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetBulkUpload = () => {
    setUploadFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- CREATE VIEW ---
  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create New Room</h1>
            <p className="text-gray-500 text-sm">Add a new room to this hotel</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleAddRoom} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input 
                  type="text" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({...newRoom, number: e.target.value})}
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">Rp</span>
                  <input 
                    type="number" 
                    required
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                    value={newRoom.price}
                    onChange={(e) => setNewRoom({...newRoom, price: Number(e.target.value)})}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input 
                  type="number" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newRoom.floor_no}
                  onChange={(e) => setNewRoom({...newRoom, floor_no: Number(e.target.value)})}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                value={newRoom.status}
                onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
              <button 
                type="button" 
                onClick={() => setView('list')}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium shadow-md shadow-gray-200 disabled:opacity-70 transition-all"
              >
                {submitting ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- EDIT VIEW ---
  if (view === 'edit' && editingRoom) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              setView('list');
              setEditingRoom(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Room</h1>
            <p className="text-gray-500 text-sm">Update room details</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleUpdateRoom} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input 
                  type="text" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={editingRoom.number}
                  onChange={(e) => setEditingRoom({...editingRoom, number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                  value={editingRoom.type}
                  onChange={(e) => setEditingRoom({...editingRoom, type: e.target.value})}
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">Rp</span>
                  <input 
                    type="number" 
                    required
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                    value={editingRoom.price}
                    onChange={(e) => setEditingRoom({...editingRoom, price: Number(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input 
                  type="number" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={editingRoom.floor_no}
                  onChange={(e) => setEditingRoom({...editingRoom, floor_no: Number(e.target.value)})}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                value={editingRoom.status}
                onChange={(e) => setEditingRoom({...editingRoom, status: e.target.value})}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
              <button 
                type="button" 
                onClick={() => {
                  setView('list');
                  setEditingRoom(null);
                }}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium shadow-md shadow-gray-200 disabled:opacity-70 transition-all"
              >
                {submitting ? 'Updating...' : 'Update Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Room Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage hotel rooms and availability</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              resetBulkUpload();
              setShowBulkUploadModal(true);
            }}
            disabled={!selectedHotel}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={20} />
            Bulk Upload
          </button>
          <button 
            onClick={() => setView('create')}
            disabled={!selectedHotel}
            className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Add Room
          </button>
        </div>
      </div>

      {!selectedHotel && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">Please select a hotel first to manage rooms.</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <DoorOpen className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No rooms found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first room</p>
          <button 
            onClick={() => setView('create')}
            disabled={!selectedHotel}
            className="bg-[#008491] text-white px-5 py-2.5 rounded-lg hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Room
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.ID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DoorOpen size={18} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{room.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 capitalize">{room.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{room.floor_no}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Rp {(room.price || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingRoom(room);
                            setView('edit');
                          }}
                          className="text-[#008491] hover:text-[#006a76] p-1"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingRoom(room);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingRoom(null);
        }}
        title="Delete Room"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete room <strong>{deletingRoom?.number}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingRoom(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRoom}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => {
          setShowBulkUploadModal(false);
          resetBulkUpload();
        }}
        title="Bulk Upload Rooms"
      >
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Upload a CSV file to create multiple rooms at once. The CSV file should include the following columns:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li><strong>number</strong> - Room number (required)</li>
                <li><strong>type</strong> - Room type: standard, deluxe, suite, or presidential (required)</li>
                <li><strong>price</strong> - Price per night in IDR (required)</li>
                <li><strong>floor_no</strong> - Floor number (required)</li>
                <li><strong>status</strong> - Status: available, occupied, or maintenance (required)</li>
              </ul>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="text-[#008491] hover:text-[#006a76] flex items-center gap-2 text-sm font-medium"
            >
              <Download size={16} />
              Download CSV Template
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#008491] file:text-white hover:file:bg-[#006a76] file:cursor-pointer"
            />
            {uploadFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span>Selected: {uploadFile.name}</span>
                <button
                  onClick={() => {
                    setUploadFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Upload Error</p>
                <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{uploadError}</pre>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">Success!</p>
                <p className="text-xs text-green-700 mt-1">{uploadSuccess}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setShowBulkUploadModal(false);
                resetBulkUpload();
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={!uploadFile || uploading}
              className="px-4 py-2 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Rooms
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rooms;

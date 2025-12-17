import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, ArrowLeft, DoorOpen } from 'lucide-react';
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
        <button 
          onClick={() => setView('create')}
          disabled={!selectedHotel}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Add Room
        </button>
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
    </div>
  );
};

export default Rooms;

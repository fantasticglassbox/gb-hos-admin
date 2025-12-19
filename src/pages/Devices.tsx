import { useState, useEffect } from 'react';
import api from '../services/api';
import { Monitor, Plus, Trash2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import Modal from '../components/Modal';
import type { Device, Room } from '../types';

const Devices = () => {
  const { selectedHotel, hotels } = useHotel();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingDevices, setPendingDevices] = useState<Device[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', room_id: 0 });
  const [selectedPendingDevice, setSelectedPendingDevice] = useState<Device | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignHotelId, setAssignHotelId] = useState<number | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchPendingDevices();
    if (selectedHotel) {
      fetchRooms(selectedHotel.ID);
    }
  }, [selectedHotel]);

  // Fetch rooms when assignHotelId changes (for assign modal without selectedHotel)
  useEffect(() => {
    if (assignHotelId && !selectedHotel) {
      fetchRooms(assignHotelId);
    }
  }, [assignHotelId]);

  const fetchRooms = async (hotelId: number) => {
    try {
      const response = await api.get(`/rooms?hotel_id=${hotelId}`);
      setRooms(response.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      if (selectedHotel) {
        // Fetch devices for selected hotel
        const response = await api.get(`/devices?hotel_id=${selectedHotel.ID}`);
        setDevices(response.data);
      } else {
        // Fetch all devices when no hotel is selected (for admin/internal users)
        const response = await api.get('/devices');
        // Filter to show only assigned devices (hotel_id > 0)
        const assignedDevices = response.data.filter((d: Device) => d.hotel_id > 0);
        setDevices(assignedDevices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDevices = async () => {
    try {
      if (selectedHotel) {
        // When a hotel is selected, don't show pending devices (they're not relevant)
        setPendingDevices([]);
      } else {
        // When no hotel is selected, fetch all devices and filter for unassigned (hotel_id = 0)
        const response = await api.get('/devices');
        const unassignedDevices = response.data.filter((d: Device) => d.hotel_id === 0);
        setPendingDevices(unassignedDevices);
      }
    } catch (error) {
      console.error('Error fetching pending devices:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.name || !newDevice.room_id) return;
    if (!selectedHotel) {
      alert('Please select a hotel to create a device');
      return;
    }

    setCreating(true);
    try {
      await api.post('/devices', {
        hotel_id: selectedHotel.ID,
        room_id: newDevice.room_id,
        name: newDevice.name
      });
      setNewDevice({ name: '', room_id: 0 });
      setShowModal(false);
      fetchDevices();
    } catch (error) {
      console.error('Error creating device:', error);
      alert('Failed to register device');
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendingDevice || !newDevice.name || !newDevice.room_id) return;
    
    const hotelIdToUse = selectedHotel?.ID || assignHotelId;
    if (!hotelIdToUse) {
      alert('Please select a hotel to assign the device');
      return;
    }

    setCreating(true);
    try {
      await api.put(`/devices/${selectedPendingDevice.ID}`, {
        hotel_id: hotelIdToUse,
        name: newDevice.name,
        room_id: newDevice.room_id,
        status: 'Active'
      });
      setNewDevice({ name: '', room_id: 0 });
      setSelectedPendingDevice(null);
      setAssignHotelId(null);
      setShowAssignModal(false);
      fetchDevices();
      fetchPendingDevices();
    } catch (error) {
      console.error('Error assigning device:', error);
      alert('Failed to assign device');
    } finally {
      setCreating(false);
    }
  };

  const openAssignModal = (device: Device) => {
    setSelectedPendingDevice(device);
    setNewDevice({ name: device.name || 'New Device', room_id: 0 });
    setAssignHotelId(selectedHotel?.ID || null);
    setShowAssignModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this device? It will be logged out.')) return;
    try {
      await api.delete(`/devices/${id}`);
      setDevices(devices.filter(d => d.ID !== id));
      setPendingDevices(pendingDevices.filter(d => d.ID !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Device Management Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Monitor className="text-[#008491]" />
              Device Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Register tablets for room access</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            disabled={!selectedHotel}
            className="bg-[#008491] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Manually Add
          </button>
        </div>

        {!selectedHotel && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Viewing all hotels:</strong> Showing all assigned devices across all hotels. Unassigned devices are shown below.
            </p>
          </div>
        )}

        {/* Pending Devices Section */}
        {pendingDevices.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2 mb-4">
              <AlertCircle size={24} />
              Unassigned Devices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingDevices.map((device) => (
                <div key={device.ID} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="font-mono text-xs text-gray-500 mb-1">UUID: {device.uuid?.substring(0, 8)}...</div>
                    <h3 className="font-bold text-gray-800">{device.name || 'Unknown Device'}</h3>
                    <span className="inline-block px-2 py-0.5 mt-2 rounded text-xs font-medium bg-orange-100 text-orange-700">
                      Needs Setup
                    </span>
                  </div>
                  <button 
                    onClick={() => openAssignModal(device)}
                    className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Assign to Hotel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <Smartphone className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">
              {selectedHotel ? 'No Active Devices' : 'No Assigned Devices'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedHotel 
                ? 'Connect a tablet to wifi and open the app to see it here.'
                : 'No devices are currently assigned to any hotel. Unassigned devices will appear above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div key={device.ID} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Smartphone className="text-[#008491]" size={24} />
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle size={10} /> Active
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg">{device.name}</h3>
                <p className="text-gray-500 text-sm mb-4">Room {device.room?.number || 'N/A'}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400">UUID:</span>
                  <span className="text-xs text-gray-500 font-mono">{device.uuid ? device.uuid.substring(0, 8) + '...' : 'N/A'}</span>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-50">
                  <button 
                    onClick={() => handleDelete(device.ID)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove Device"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register New Device">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Room 101 Tablet"
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              value={newDevice.name}
              onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Room</label>
            <select
              required
              value={newDevice.room_id || ''}
              onChange={(e) => setNewDevice({...newDevice, room_id: Number(e.target.value)})}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
            >
              <option value="">-- Select a room --</option>
              {rooms.map((room) => (
                <option key={room.ID} value={room.ID}>
                  Room {room.number} ({room.type})
                </option>
              ))}
            </select>
            {rooms.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No rooms available. Create rooms first.</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={creating || rooms.length === 0}
              className="px-6 py-2 bg-[#008491] text-white rounded-lg hover:bg-[#006a76] disabled:opacity-50"
            >
              {creating ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Device">
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-gray-600">
            Assigning device <span className="font-mono font-bold">{selectedPendingDevice?.uuid?.substring(0,8)}</span>
            {selectedHotel ? ` to ` : ''}
            {selectedHotel && <strong>{selectedHotel.name}</strong>}
            .
          </p>
          
          {!selectedHotel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Hotel</label>
              <select
                required
                value={assignHotelId || ''}
                onChange={(e) => {
                  const hotelId = Number(e.target.value);
                  setAssignHotelId(hotelId);
                  setNewDevice({...newDevice, room_id: 0}); // Reset room selection
                }}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              >
                <option value="">-- Select a hotel --</option>
                {hotels.map((hotel) => (
                  <option key={hotel.ID} value={hotel.ID}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Room 101 Tablet"
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              value={newDevice.name}
              onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Room</label>
            <select
              required
              value={newDevice.room_id || ''}
              onChange={(e) => setNewDevice({...newDevice, room_id: Number(e.target.value)})}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              disabled={!selectedHotel && !assignHotelId}
            >
              <option value="">-- Select a room --</option>
              {rooms.map((room) => (
                <option key={room.ID} value={room.ID}>
                  Room {room.number} ({room.type})
                </option>
              ))}
            </select>
            {(selectedHotel || assignHotelId) && rooms.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No rooms available. Create rooms first.</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={creating || (!selectedHotel && !assignHotelId) || !newDevice.room_id}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Devices;

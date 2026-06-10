import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Monitor, Trash2, Smartphone, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';
import type { Device, Room } from '../types';

type DeviceTab = 'assigned' | 'unassigned';

const Devices = () => {
  const { selectedHotel, hotels } = useHotel();
  const [activeTab, setActiveTab] = useState<DeviceTab>('assigned');
  const [rooms, setRooms] = useState<Room[]>([]);

  // Assign-flow modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', room_id: 0 });
  const [selectedPendingDevice, setSelectedPendingDevice] = useState<Device | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignHotelId, setAssignHotelId] = useState<number | null>(null);

  // Assigned-tab params: filter by selected hotel, or show every hotel's
  // assigned devices (hotel_id > 0) when the super-admin hasn't picked one.
  const assignedExtraParams = useMemo(
    () => (selectedHotel ? { hotel_id: selectedHotel.ID } : { assigned: 'true' }),
    [selectedHotel],
  );

  // Unassigned tab: hotel_id = 0 (pending registration). Only meaningful when
  // no hotel is selected; with a hotel selected this query yields nothing.
  const unassignedExtraParams = useMemo(() => ({ assigned: 'false' }), []);

  const assignedList = useServerPagination<Device>({
    endpoint: '/devices',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams: assignedExtraParams,
  });

  const unassignedList = useServerPagination<Device>({
    endpoint: '/devices',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams: unassignedExtraParams,
  });

  const list = activeTab === 'assigned' ? assignedList : unassignedList;

  // When the selected hotel changes, force the user back to the relevant tab.
  // Unassigned devices belong to no hotel, so it's noise when one is selected.
  useEffect(() => {
    if (selectedHotel) setActiveTab('assigned');
  }, [selectedHotel]);

  const fetchRooms = async (hotelId: number, availableForDevice = false) => {
    try {
      const params = new URLSearchParams({ hotel_id: hotelId.toString() });
      if (availableForDevice) params.append('available_for_device', 'true');
      const res = await api.get(`/rooms?${params.toString()}`);
      setRooms(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
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
        status: 'Active',
      });
      setNewDevice({ name: '', room_id: 0 });
      setSelectedPendingDevice(null);
      setAssignHotelId(null);
      setShowAssignModal(false);
      // After assigning, both lists may change (device moves from unassigned
      // to that hotel's assigned set), so refresh whichever could be visible.
      assignedList.refresh();
      unassignedList.refresh();
    } catch (err) {
      console.error('Error assigning device:', err);
      alert('Failed to assign device');
    } finally {
      setCreating(false);
    }
  };

  const openAssignModal = async (device: Device) => {
    setSelectedPendingDevice(device);
    setNewDevice({ name: device.name || 'New Device', room_id: 0 });
    const hotelIdToUse = selectedHotel?.ID || null;
    setAssignHotelId(hotelIdToUse);
    if (hotelIdToUse) await fetchRooms(hotelIdToUse, true);
    setShowAssignModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this device? It will be logged out.')) return;
    try {
      await api.delete(`/devices/${id}`);
      list.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const assignedColumns: Column<Device>[] = [
    {
      key: 'icon',
      header: '',
      width: 'w-12',
      render: () => (
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
          <Smartphone className="text-[#008491]" size={18} />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (d) => (
        <div>
          <div className="font-semibold text-gray-900">{d.name || 'Unnamed'}</div>
          {(d.manufacturer || d.model) && (
            <div className="text-xs text-gray-500">
              {[d.manufacturer, d.model].filter(Boolean).join(' ')}
              {d.device_type && <span className="ml-1 text-gray-400">({d.device_type})</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (d) => <span className="text-gray-700">{d.room?.number ? `Room ${d.room.number}` : 'N/A'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      render: (d) => {
        const isActive = d.status === 'Active';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {isActive && <CheckCircle size={10} />}
            {d.status || 'Unknown'}
          </span>
        );
      },
    },
    {
      key: 'uuid',
      header: 'UUID',
      render: (d) => (
        <span className="font-mono text-xs text-gray-500">
          {d.uuid ? `${d.uuid.substring(0, 8)}…` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-20',
      align: 'right',
      render: (d) => (
        <button
          onClick={() => handleDelete(d.ID)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove device"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  const unassignedColumns: Column<Device>[] = [
    {
      key: 'icon',
      header: '',
      width: 'w-12',
      render: () => (
        <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
          <AlertCircle className="text-orange-500" size={18} />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (d) => (
        <div>
          <div className="font-semibold text-gray-900">{d.name || 'Unknown Device'}</div>
          {(d.manufacturer || d.model) && (
            <div className="text-xs text-gray-500">
              {[d.manufacturer, d.model].filter(Boolean).join(' ')}
              {d.device_type && <span className="ml-1 text-gray-400">({d.device_type})</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'uuid',
      header: 'UUID',
      render: (d) => (
        <span className="font-mono text-xs text-gray-500">
          {d.uuid ? `${d.uuid.substring(0, 8)}…` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
          Needs setup
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-44',
      align: 'right',
      render: (d) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => openAssignModal(d)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Assign to Hotel
          </button>
          <button
            onClick={() => handleDelete(d.ID)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove device"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const columns = activeTab === 'assigned' ? assignedColumns : unassignedColumns;

  // When a hotel is selected the "Unassigned" tab is meaningless (those rows
  // by definition aren't bound to any hotel); hide it to reduce noise.
  const showUnassignedTab = !selectedHotel;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Monitor className="text-[#008491]" size={32} />
            Device Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Register tablets for room access</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2.5 -mb-px border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assigned'
                ? 'border-[#008491] text-[#008491]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assigned
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'assigned' ? 'bg-[#e0fbfc] text-[#008491]' : 'bg-gray-100 text-gray-500'}`}>
              {assignedList.meta.total}
            </span>
          </button>
          {showUnassignedTab && (
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-4 py-2.5 -mb-px border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'unassigned'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Unassigned
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'unassigned'
                  ? 'bg-orange-50 text-orange-600'
                  : unassignedList.meta.total > 0
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {unassignedList.meta.total}
              </span>
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'assigned' && !selectedHotel && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Viewing all hotels:</strong> showing assigned devices across every hotel.
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder="Search by name, UUID, model..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {list.error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{list.error}</div>
      )}

      <DataTable
        columns={columns}
        rows={list.data}
        loading={list.loading}
        rowKey={(d) => d.ID}
        sort={list.sort}
        order={list.order}
        onSortChange={list.toggleSort}
        emptyMessage={
          list.search
            ? `No devices match "${list.search}"`
            : activeTab === 'unassigned'
            ? 'No unassigned devices'
            : selectedHotel
            ? 'No active devices for this hotel'
            : 'No assigned devices yet'
        }
      />

      <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Device">
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-gray-600">
            Assigning device <span className="font-mono font-bold">{selectedPendingDevice?.uuid?.substring(0, 8)}</span>
            {selectedHotel ? ' to ' : ''}
            {selectedHotel && <strong>{selectedHotel.name}</strong>}.
          </p>

          {!selectedHotel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Hotel</label>
              <select
                required
                value={assignHotelId || ''}
                onChange={async (e) => {
                  const hotelId = Number(e.target.value);
                  setAssignHotelId(hotelId);
                  setNewDevice({ ...newDevice, room_id: 0 });
                  if (hotelId) await fetchRooms(hotelId, true);
                  else setRooms([]);
                }}
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              >
                <option value="">-- Select a hotel --</option>
                {hotels.map((h) => (
                  <option key={h.ID} value={h.ID}>{h.name}</option>
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
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Room</label>
            <select
              required
              value={newDevice.room_id || ''}
              onChange={(e) => setNewDevice({ ...newDevice, room_id: Number(e.target.value) })}
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
              <p className="text-xs text-gray-500 mt-1">
                No rooms available for device assignment. All rooms may already have devices assigned, or you need to create rooms first.
              </p>
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

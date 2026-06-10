import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Edit2, Trash2, ArrowLeft, Settings, Utensils, Search } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import ImageUpload from '../components/ImageUpload';
import Modal from '../components/Modal';
import DataTable, { type Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';

interface Service {
  ID: number;
  name: string;
  type: string;
  sort_order: number;
  allow_order: number;
  price: number;
  description: string;
  image_url?: string;
}

const emptyForm = { name: '', type: 'food', sort_order: 0, allow_order: 1, price: 0, description: '', image_url: '' };

const Services = () => {
  const navigate = useNavigate();
  const { selectedHotel, hotels, setSelectedHotel } = useHotel();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newService, setNewService] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const urlHotelId = searchParams.get('hotel_id');
  const hotelId = selectedHotel?.ID ?? (urlHotelId ? Number(urlHotelId) : null);

  useEffect(() => {
    if (urlHotelId && hotels.length > 0 && !selectedHotel) {
      const h = hotels.find((x) => x.ID === Number(urlHotelId));
      if (h) setSelectedHotel(h);
    }
  }, [urlHotelId, hotels, selectedHotel, setSelectedHotel]);

  const extraParams = useMemo(
    () => (hotelId ? { hotel_id: hotelId } : {}),
    [hotelId],
  );

  const list = useServerPagination<Service>({
    endpoint: '/services',
    initialSort: 'sort_order',
    initialOrder: 'ASC',
    extraParams,
  });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return alert('Please select a hotel first');
    setSubmitting(true);
    try {
      await api.post('/services', {
        ...newService,
        sort_order: Number(newService.sort_order) || 0,
        allow_order: newService.allow_order === 0 ? 0 : 1,
        price: Number(newService.price),
        hotel_id: hotelId,
      });
      setNewService(emptyForm);
      setView('list');
      list.refresh();
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditFormData({
      name: service.name,
      type: service.type,
      sort_order: service.sort_order || 0,
      allow_order: service.allow_order === 0 ? 0 : 1,
      price: service.price,
      description: service.description,
      image_url: service.image_url || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSavingEdit(true);
    try {
      await api.put(`/services/${editingService.ID}`, {
        ...editFormData,
        sort_order: Number(editFormData.sort_order) || 0,
        allow_order: editFormData.allow_order === 0 ? 0 : 1,
        price: Number(editFormData.price),
      });
      setEditingService(null);
      list.refresh();
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Are you sure you want to delete this service? This will also delete all menu items and categories.')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      list.refresh();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  // --- CREATE VIEW (unchanged) ---
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
            <h1 className="text-2xl font-bold text-gray-800">Create New Service</h1>
            <p className="text-gray-500 text-sm">Define a new service offering for this hotel</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleAddService} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g. In-Room Dining"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                  value={newService.type}
                  onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                >
                  <option value="food">Food & Drink</option>
                  <option value="massage">Massage & Spa</option>
                  <option value="laundry">Laundry</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="loss_breakage">Loss & Breakage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Position</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newService.sort_order}
                  onChange={(e) => setNewService({ ...newService, sort_order: Number(e.target.value) })}
                  placeholder="0 = auto append"
                />
                <p className="text-xs text-gray-500 mt-1">Lower number appears first. Use 0 to auto-append.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allow Order</label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#008491] focus:ring-[#008491]"
                    checked={newService.allow_order === 1}
                    onChange={(e) => setNewService({ ...newService, allow_order: e.target.checked ? 1 : 0 })}
                  />
                  Guests can add items from this service menu
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                rows={3}
                placeholder="Description of service availability, hours, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
              {newService.image_url && (
                <div className="mb-3 relative">
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img src={newService.image_url} alt="Service preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewService({ ...newService, image_url: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ImageUpload
                  value={newService.image_url}
                  onChange={(url) => setNewService({ ...newService, image_url: url })}
                  label={newService.image_url ? 'Change Image' : 'Upload Service Image'}
                  accept="image/png,image/jpeg,image/jpg"
                  allowedTypes={['png', 'jpeg', 'jpg']}
                  maxSizeMB={2}
                />
              </div>
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
                {submitting ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  const columns: Column<Service>[] = [
    {
      key: 'image',
      header: '',
      width: 'w-16',
      render: (s) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
          {s.image_url ? (
            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#008491] to-[#006a76] flex items-center justify-center text-white font-bold text-xs">
              {s.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (s) => <span className="font-semibold text-gray-900">{s.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortKey: 'type',
      render: (s) => (
        <span className="px-2 py-0.5 bg-[#e0fbfc] text-[#006a76] rounded-full text-xs font-bold uppercase tracking-wide">
          {s.type}
        </span>
      ),
    },
    {
      key: 'sort_order',
      header: 'Position',
      sortKey: 'sort_order',
      align: 'center',
      render: (s) => <span className="font-semibold text-gray-700">{s.sort_order ?? 0}</span>,
    },
    {
      key: 'allow_order',
      header: 'Allow order',
      render: (s) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          s.allow_order !== 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {s.allow_order !== 0 ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (s) => <span className="text-gray-500 text-sm line-clamp-2 max-w-sm inline-block">{s.description || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-32',
      align: 'right',
      render: (s) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => handleEditService(s)}
            className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => navigate(`/services/${s.ID}`)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Manage menu"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => handleDeleteService(s.ID)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Utensils className="text-[#008491]" size={32} />
            Services
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage guest services and menus</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {!hotelId ? (
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
          Select a hotel from the sidebar to view its services.
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                placeholder="Search by name, type, description..."
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
            rowKey={(s) => s.ID}
            sort={list.sort}
            order={list.order}
            onSortChange={list.toggleSort}
            emptyMessage={list.search ? `No services match "${list.search}"` : 'No services yet'}
          />

          <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
        </>
      )}

      <Modal isOpen={!!editingService} onClose={() => setEditingService(null)} title="Edit Service">
        <form onSubmit={handleSaveEdit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                type="text"
                required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                value={editFormData.type}
                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
              >
                <option value="food">Food & Drink</option>
                <option value="massage">Massage & Spa</option>
                <option value="laundry">Laundry</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Position</label>
              <input
                type="number"
                min={0}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={editFormData.sort_order}
                onChange={(e) => setEditFormData({ ...editFormData, sort_order: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allow Order</label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#008491] focus:ring-[#008491]"
                  checked={editFormData.allow_order === 1}
                  onChange={(e) => setEditFormData({ ...editFormData, allow_order: e.target.checked ? 1 : 0 })}
                />
                Guests can add items from this service menu
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
            {editFormData.image_url && (
              <div className="mb-3 relative">
                <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img src={editFormData.image_url} alt="Service preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, image_url: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <ImageUpload
                value={editFormData.image_url}
                onChange={(url) => setEditFormData({ ...editFormData, image_url: url })}
                label={editFormData.image_url ? 'Change Image' : 'Upload Service Image'}
                accept="image/png,image/jpeg,image/jpg"
                allowedTypes={['png', 'jpeg', 'jpg']}
                maxSizeMB={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingService(null)}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-6 py-2.5 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium shadow-md shadow-gray-200 disabled:opacity-70 transition-all"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Services;

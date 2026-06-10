import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Edit2, X, Clock, Dumbbell, Search } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';
import DataTable, { type Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';
import type { Facility } from '../types';

const emptyForm = { name: '', image_url: '', image_urls: [] as string[], opening_time: '', closing_time: '', description: '' };

const Facilities = () => {
  const { selectedHotel, hotels, setSelectedHotel } = useHotel();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // IDs of facility rows whose description is currently expanded.
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const list = useServerPagination<Facility>({
    endpoint: '/facilities',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams,
  });

  const parseImages = (f: Facility): string[] => {
    if (Array.isArray(f.image_urls) && f.image_urls.length > 0) return f.image_urls;
    if (typeof f.image_urls === 'string') {
      try {
        const parsed = JSON.parse(f.image_urls);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return f.image_url ? [f.image_url] : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Please enter a facility name');
    if (!hotelId && !editingId) return alert('Please select a hotel first');

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : (formData.image_url ? [formData.image_url] : []),
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        description: formData.description,
      };
      if (!editingId && hotelId) payload.hotel_id = hotelId;

      if (editingId) await api.put(`/facilities/${editingId}`, payload);
      else await api.post('/facilities', payload);

      setFormData(emptyForm);
      setEditingId(null);
      setView('list');
      list.refresh();
    } catch (error: unknown) {
      console.error('Error saving facility:', error);
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? 'Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    const imageUrls = parseImages(facility);
    setFormData({
      name: facility.name,
      image_url: facility.image_url || '',
      image_urls: imageUrls,
      opening_time: facility.opening_time || '',
      closing_time: facility.closing_time || '',
      description: facility.description || '',
    });
    setEditingId(facility.ID);
    setView('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;
    try {
      await api.delete(`/facilities/${id}`);
      list.refresh();
    } catch (error) {
      console.error('Error deleting facility:', error);
      alert('Failed to delete facility');
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => { setView('list'); setFormData(emptyForm); setEditingId(null); }}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{view === 'edit' ? 'Edit Facility' : 'Add New Facility'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facility Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gym, Pool, Spa"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images (Multiple)</label>
              <div className="space-y-3">
                {formData.image_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_urls: formData.image_urls.filter((_, i) => i !== index) })}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                  <ImageUpload
                    value=""
                    onChange={(url) => setFormData({ ...formData, image_urls: [...formData.image_urls, url] })}
                    label="Add Image"
                    accept="image/png,image/jpeg,image/jpg"
                    allowedTypes={['png', 'jpeg', 'jpg']}
                    maxSizeMB={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#008491] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving...' : view === 'edit' ? 'Update Facility' : 'Create Facility'}
              </button>
              <button
                type="button"
                onClick={() => { setView('list'); setFormData(emptyForm); setEditingId(null); }}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  const columns: Column<Facility>[] = [
    {
      key: 'image',
      header: '',
      width: 'w-16',
      render: (f) => {
        const images = parseImages(f);
        return (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {images[0] ? (
              <img src={images[0]} alt={f.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={18} className="text-gray-400" />
            )}
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (f) => <span className="font-semibold text-gray-900">{f.name}</span>,
    },
    {
      key: 'hours',
      header: 'Hours',
      sortKey: 'opening_time',
      render: (f) => {
        // No opening or closing hours configured → facility is open 24 hours.
        if (!f.opening_time && !f.closing_time) {
          return (
            <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
              <Clock size={12} className="text-gray-400" />
              24 hours
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
            <Clock size={12} className="text-gray-400" />
            {f.opening_time || '--'} – {f.closing_time || '--'}
          </span>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (f) => {
        const text = f.description || '';
        if (!text) return <span className="text-gray-400">—</span>;
        const isExpanded = expandedIds.has(f.ID);
        // Heuristic: if the description fits in roughly two lines (~120 chars
        // at our column width) we skip the toggle to avoid UI noise.
        const isLong = text.length > 120;
        return (
          <div className="max-w-md">
            <p className={`text-gray-500 text-sm whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
              {text}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => toggleExpanded(f.ID)}
                className="mt-1 text-xs font-medium text-[#008491] hover:text-[#006a76]"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      align: 'right',
      render: (f) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => handleEdit(f)}
            className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(f.ID)}
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
            <Dumbbell className="text-[#008491]" size={32} />
            Facilities
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage hotel facilities{selectedHotel ? ` for ${selectedHotel.name}` : ''}
          </p>
        </div>
        <button
          onClick={() => {
            if (!hotelId) return alert('Please select a hotel first to add facilities');
            setView('create');
          }}
          disabled={!hotelId}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Add Facility
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder="Search by name or description..."
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
        rowKey={(f) => f.ID}
        sort={list.sort}
        order={list.order}
        onSortChange={list.toggleSort}
        emptyMessage={
          !hotelId
            ? 'Select a hotel to view facilities'
            : list.search ? `No facilities match "${list.search}"` : 'No facilities yet'
        }
      />

      <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
    </div>
  );
};

export default Facilities;

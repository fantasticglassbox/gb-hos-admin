import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, ArrowLeft, Edit2, Globe, FileText, X, MapPin, Search } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import ImageUpload from '../components/ImageUpload';
import DataTable, { type Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';

interface POI {
  ID: number;
  hotel_id: number;
  title: string;
  type: 'normal' | 'webview';
  description: string;
  image_url?: string;
  image_urls?: string[] | string;
  url: string;
}

const emptyForm = { title: '', type: 'normal' as 'normal' | 'webview', description: '', image_url: '', image_urls: [] as string[], url: '' };

const POIs = () => {
  const { selectedHotel, hotels, setSelectedHotel } = useHotel();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('');

  const urlHotelId = searchParams.get('hotel_id');
  const hotelId = selectedHotel?.ID ?? (urlHotelId ? Number(urlHotelId) : null);

  useEffect(() => {
    if (urlHotelId && hotels.length > 0 && !selectedHotel) {
      const h = hotels.find((x) => x.ID === Number(urlHotelId));
      if (h) setSelectedHotel(h);
    }
  }, [urlHotelId, hotels, selectedHotel, setSelectedHotel]);

  const extraParams = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (hotelId) p.hotel_id = hotelId;
    if (filterType) p.type = filterType;
    return p;
  }, [hotelId, filterType]);

  const list = useServerPagination<POI>({
    endpoint: '/pois',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Please enter a title');
    if (formData.type === 'normal' && !formData.description.trim()) return alert('Please enter a description');
    if (formData.type === 'webview' && !formData.url.trim()) return alert('Please enter a URL');
    if (!hotelId) return alert('Please select a hotel first');

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        hotel_id: hotelId,
        title: formData.title,
        type: formData.type,
      };
      if (formData.type === 'normal') {
        payload.description = formData.description;
        payload.image_urls = formData.image_urls;
      } else {
        payload.url = formData.url;
      }

      if (editingId) {
        await api.put(`/pois/${editingId}`, payload);
      } else {
        await api.post('/pois', payload);
      }
      setFormData(emptyForm);
      setEditingId(null);
      setView('list');
      list.refresh();
    } catch (error: unknown) {
      console.error('Error saving POI:', error);
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? 'Failed to save POI');
    } finally {
      setSubmitting(false);
    }
  };

  const parseImageUrls = (poi: POI): string[] => {
    if (Array.isArray(poi.image_urls) && poi.image_urls.length > 0) return poi.image_urls;
    if (typeof poi.image_urls === 'string') {
      try {
        const parsed = JSON.parse(poi.image_urls);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return poi.image_url ? [poi.image_url] : [];
  };

  const handleEdit = (poi: POI) => {
    const imageUrls = parseImageUrls(poi);
    setFormData({
      title: poi.title,
      type: poi.type,
      description: poi.description || '',
      image_url: poi.image_url || '',
      image_urls: imageUrls,
      url: poi.url || '',
    });
    setEditingId(poi.ID);
    setView('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this POI?')) return;
    try {
      await api.delete(`/pois/${id}`);
      list.refresh();
    } catch (error) {
      console.error('Error deleting POI:', error);
      alert('Failed to delete POI');
    }
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => { setView('list'); setFormData(emptyForm); setEditingId(null); }}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{view === 'edit' ? 'Edit POI' : 'Add New POI'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Local Attractions, Restaurant Guide"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'normal' | 'webview';
                  setFormData({ ...formData, type: newType });
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                required
              >
                <option value="normal">Normal (with description)</option>
                <option value="webview">Webview (with URL)</option>
              </select>
            </div>

            {formData.type === 'normal' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images (Multiple, Optional)</label>
                  <div className="space-y-3">
                    {formData.image_urls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.image_urls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                              <img src={url} alt={`POI ${index + 1}`} className="w-full h-full object-cover" />
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
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                  required
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#008491] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving...' : view === 'edit' ? 'Update POI' : 'Create POI'}
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

  // --- LIST VIEW ---
  if (!hotelId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please select a hotel to manage POIs</p>
      </div>
    );
  }

  const columns: Column<POI>[] = [
    {
      key: 'image',
      header: '',
      width: 'w-16',
      render: (p) => {
        const images = parseImageUrls(p);
        return (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {images[0] ? (
              <img src={images[0]} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <MapPin size={18} className="text-gray-400" />
            )}
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Title',
      sortKey: 'title',
      render: (p) => <span className="font-semibold text-gray-900">{p.title}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortKey: 'type',
      render: (p) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          p.type === 'webview' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {p.type === 'webview' ? <Globe size={12} /> : <FileText size={12} />}
          {p.type}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (p) =>
        p.type === 'webview' ? (
          <a href={p.url} target="_blank" rel="noreferrer" className="text-sm text-[#008491] hover:underline truncate inline-block max-w-md">
            {p.url}
          </a>
        ) : (
          <span className="text-gray-500 text-sm line-clamp-2 max-w-md inline-block">{p.description || '—'}</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      align: 'right',
      render: (p) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => handleEdit(p)}
            className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(p.ID)}
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
            <MapPin className="text-[#008491]" size={32} />
            Points of Interest
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage points of interest{selectedHotel ? ` for ${selectedHotel.name}` : ''}
          </p>
        </div>
        <button
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Add POI
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={list.search}
              onChange={(e) => list.setSearch(e.target.value)}
              placeholder="Search by title, description, URL..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#008491]"
          >
            <option value="">All types</option>
            <option value="normal">Normal</option>
            <option value="webview">Webview</option>
          </select>
        </div>
      </div>

      {list.error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{list.error}</div>
      )}

      <DataTable
        columns={columns}
        rows={list.data}
        loading={list.loading}
        rowKey={(p) => p.ID}
        sort={list.sort}
        order={list.order}
        onSortChange={list.toggleSort}
        emptyMessage={list.search ? `No POIs match "${list.search}"` : 'No POIs yet'}
      />

      <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
    </div>
  );
};

export default POIs;

import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, ArrowLeft, Edit, Globe, FileText, Image as ImageIcon } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import ImageUpload from '../components/ImageUpload';

interface POI {
  ID: number;
  title: string;
  type: 'normal' | 'webview';
  description: string;
  image_url?: string;
  url: string;
}

const POIs = () => {
  const { selectedHotel } = useHotel();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  
  // Form State
  const [formData, setFormData] = useState({ 
    title: '', 
    type: 'normal' as 'normal' | 'webview',
    description: '',
    image_url: '',
    url: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPOIs();
  }, [selectedHotel]);

  const fetchPOIs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pois');
      setPois(response.data);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (formData.type === 'normal' && !formData.description.trim()) {
      alert('Please enter a description for normal type POI');
      return;
    }

    if (formData.type === 'webview' && !formData.url.trim()) {
      alert('Please enter a URL for webview type POI');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
      };

      if (formData.type === 'normal') {
        payload.description = formData.description;
        // Always include image_url for normal type (even if empty, to allow clearing)
        payload.image_url = formData.image_url || '';
      } else {
        payload.url = formData.url;
      }

      if (editingId) {
        await api.put(`/pois/${editingId}`, payload);
      } else {
        await api.post('/pois', payload);
      }
      setFormData({ title: '', type: 'normal', description: '', image_url: '', url: '' });
      setEditingId(null);
      setView('list');
      fetchPOIs();
    } catch (error: any) {
      console.error('Error saving POI:', error);
      alert(error.response?.data?.error || 'Failed to save POI');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (poi: POI) => {
    setFormData({ 
      title: poi.title, 
      type: poi.type,
      description: poi.description || '',
      image_url: poi.image_url || '',
      url: poi.url || '',
    });
    setEditingId(poi.ID);
    setView('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this POI?')) return;
    try {
      await api.delete(`/pois/${id}`);
      fetchPOIs();
    } catch (error) {
      console.error('Error deleting POI:', error);
      alert('Failed to delete POI');
    }
  };

  // --- CREATE/EDIT VIEW ---
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => {
              setView('list');
              setFormData({ title: '', type: 'normal', description: '', image_url: '', url: '' });
              setEditingId(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {view === 'edit' ? 'Edit POI' : 'Add New POI'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'normal' | 'webview';
                  setFormData({ 
                    ...formData, 
                    type: newType,
                    // Clear the other field when switching types
                    description: newType === 'normal' ? formData.description : '',
                    url: newType === 'webview' ? formData.url : '',
                  });
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description for this POI..."
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image (Optional)
                  </label>
                  {formData.image_url && (
                    <div className="mb-3 relative">
                      <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={formData.image_url}
                          alt="POI Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      label={formData.image_url ? "Change Image" : "Upload Image"}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add an image to display with this POI
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This URL will be opened in a webview when users tap on this POI
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#008491] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving...' : (view === 'edit' ? 'Update POI' : 'Create POI')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setFormData({ title: '', type: 'normal', description: '', image_url: '', url: '' });
                  setEditingId(null);
                }}
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
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading POIs...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Points of Interest</h1>
          <p className="text-gray-500 text-sm mt-1">Manage points of interest for guests</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Add POI
        </button>
      </div>

      {pois.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No POIs yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first point of interest</p>
          <button
            onClick={() => setView('create')}
            className="bg-[#008491] text-white px-6 py-2.5 rounded-lg hover:bg-[#006a76] transition-all"
          >
            Add POI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pois.map((poi) => (
            <div
              key={poi.ID}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
            >
              {poi.type === 'normal' && poi.image_url && (
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={poi.image_url}
                    alt={poi.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">{poi.title}</h3>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    poi.type === 'webview' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {poi.type === 'webview' ? (
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        Webview
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        Normal
                      </span>
                    )}
                  </span>
                </div>
                
                {poi.type === 'normal' && poi.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{poi.description}</p>
                )}
                
                {poi.type === 'webview' && poi.url && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">URL:</p>
                    <a 
                      href={poi.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-[#008491] hover:underline break-all"
                    >
                      {poi.url}
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(poi)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(poi.ID)}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default POIs;


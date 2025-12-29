import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Edit, X, Clock, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';
import type { Facility } from '../types';

const Facilities = () => {
  const { selectedHotel, hotels, setSelectedHotel } = useHotel();
  const [searchParams] = useSearchParams();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  
  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    image_url: '', // For backward compatibility
    image_urls: [] as string[],
    opening_time: '',
    closing_time: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});

  // Get hotel_id from URL query params as fallback
  const urlHotelId = searchParams.get('hotel_id');

  // Set hotel from URL if not already selected
  useEffect(() => {
    if (urlHotelId && hotels.length > 0 && !selectedHotel) {
      const hotelId = Number(urlHotelId);
      const hotel = hotels.find(h => h.ID === hotelId);
      if (hotel) {
        setSelectedHotel(hotel);
      }
    }
  }, [urlHotelId, hotels, selectedHotel, setSelectedHotel]);

  useEffect(() => {
    // Re-fetch when hotel changes or URL hotel_id changes
    fetchFacilities();
  }, [selectedHotel, urlHotelId]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      // Use selectedHotel first, then fallback to URL hotel_id
      const hotelId = selectedHotel?.ID || (urlHotelId ? Number(urlHotelId) : null);
      const url = hotelId 
        ? `/facilities?hotel_id=${hotelId}` 
        : '/facilities';
      const response = await api.get(url);
      // Parse image_urls from JSON string if present
      const facilitiesWithParsedUrls = response.data.map((facility: any) => {
        let imageUrls: string[] = [];
        if (facility.image_urls) {
          try {
            imageUrls = typeof facility.image_urls === 'string' 
              ? JSON.parse(facility.image_urls) 
              : facility.image_urls;
          } catch (e) {
            // If parsing fails, use empty array
            imageUrls = [];
          }
        }
        // Backward compatibility: if no image_urls but has image_url, add it
        if (imageUrls.length === 0 && facility.image_url) {
          imageUrls = [facility.image_url];
        }
        return {
          ...facility,
          image_urls: imageUrls,
        };
      });
      setFacilities(facilitiesWithParsedUrls);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a facility name');
      return;
    }

    // Use selectedHotel first, then fallback to URL hotel_id
    const hotelId = selectedHotel?.ID || (urlHotelId ? Number(urlHotelId) : null);
    
    if (!hotelId && !editingId) {
      alert('Please select a hotel first');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : (formData.image_url ? [formData.image_url] : []),
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        description: formData.description,
      };

      // Add hotel_id for new facilities
      if (!editingId && hotelId) {
        payload.hotel_id = hotelId;
      }

      if (editingId) {
        await api.put(`/facilities/${editingId}`, payload);
      } else {
        await api.post('/facilities', payload);
      }
      setFormData({ name: '', image_url: '', image_urls: [], opening_time: '', closing_time: '', description: '' });
      setEditingId(null);
      setView('list');
      fetchFacilities();
    } catch (error: any) {
      console.error('Error saving facility:', error);
      alert(error.response?.data?.error || 'Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    const imageUrls = facility.image_urls && facility.image_urls.length > 0 
      ? facility.image_urls 
      : (facility.image_url ? [facility.image_url] : []);
    
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
      fetchFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
      alert('Failed to delete facility');
    }
  };

  const handleAddImage = (url: string) => {
    setFormData({ ...formData, image_urls: [...formData.image_urls, url] });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({ 
      ...formData, 
      image_urls: formData.image_urls.filter((_, i) => i !== index) 
    });
  };

  const getImagesForFacility = (facility: Facility): string[] => {
    if (facility.image_urls && facility.image_urls.length > 0) {
      return facility.image_urls;
    }
    if (facility.image_url) {
      return [facility.image_url];
    }
    return [];
  };

  const ImageSlider = ({ images, facilityId }: { images: string[], facilityId: number }) => {
    const currentIndex = currentImageIndex[facilityId] || 0;
    
    if (images.length === 0) {
      return (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
          <ImageIcon size={48} />
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <div className="w-full h-64 bg-gray-100 overflow-hidden">
          <img
            src={images[0]}
            alt="Facility"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-64 bg-gray-100 overflow-hidden group">
        <img
          src={images[currentIndex]}
          alt={`Facility image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex({
                  ...currentImageIndex,
                  [facilityId]: (currentIndex - 1 + images.length) % images.length
                });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex({
                  ...currentImageIndex,
                  [facilityId]: (currentIndex + 1) % images.length
                });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // --- CREATE/EDIT VIEW ---
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => {
              setView('list');
              setFormData({ name: '', image_url: '', image_urls: [], opening_time: '', closing_time: '', description: '' });
              setEditingId(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {view === 'edit' ? 'Edit Facility' : 'Add New Facility'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the facility..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Multiple)
              </label>
              <div className="space-y-3">
                {formData.image_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
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
                    onChange={handleAddImage}
                    label="Add Image"
                  />
                </div>
                {formData.image_urls.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    You can add multiple images. Upload or paste image URLs.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#008491] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Saving...' : (view === 'edit' ? 'Update Facility' : 'Create Facility')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setFormData({ name: '', image_url: '', image_urls: [], opening_time: '', closing_time: '', description: '' });
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
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Dumbbell className="text-[#008491]" size={32} />
            Facilities
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage hotel facilities (Gym, Pool, Spa, etc.)</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Add Facility
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading facilities...</div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Facilities Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first facility.</p>
            <button
              onClick={() => setView('create')}
              className="bg-[#008491] text-white px-6 py-2.5 rounded-lg hover:bg-[#006a76] transition-all"
            >
              Add Facility
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => {
                const images = getImagesForFacility(facility);
                return (
                  <div
                    key={facility.ID}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                  >
                <ImageSlider images={images} facilityId={facility.ID} />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{facility.name}</h3>
                  {facility.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{facility.description}</p>
                  )}
                  {(facility.opening_time || facility.closing_time) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Clock size={14} />
                      <span>
                        {facility.opening_time || '--'} - {facility.closing_time || '--'}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(facility)}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(facility.ID)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Facilities;

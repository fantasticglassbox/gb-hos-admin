import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, MapPin, Building2, ArrowLeft, X, Edit2, Trash2 } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';

interface Hotel {
  ID: number;
  name: string;
  address: string;
  description: string;
  facilities: string;
  image_url: string;
}

const Hotels = () => {
  const { fetchHotels } = useHotel(); // To refresh selector after adding
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [newHotel, setNewHotel] = useState({ name: '', address: '', description: '', image_url: '', facilities: '[]' });
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [facilitiesList, setFacilitiesList] = useState<string[]>([]);
  const [facilityInput, setFacilityInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const response = await api.get('/hotels');
      setHotels(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFacility = () => {
    if (facilityInput.trim()) {
      const updated = [...facilitiesList, facilityInput.trim()];
      setFacilitiesList(updated);
      setNewHotel({...newHotel, facilities: JSON.stringify(updated)});
      setFacilityInput('');
    }
  };

  const removeFacility = (index: number) => {
    const updated = facilitiesList.filter((_, i) => i !== index);
    setFacilitiesList(updated);
    setNewHotel({...newHotel, facilities: JSON.stringify(updated)});
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hotels', newHotel);
      setNewHotel({ name: '', address: '', description: '', image_url: '', facilities: '[]' });
      setFacilitiesList([]);
      setView('list');
      loadHotels();
      fetchHotels(); // Refresh global context
    } catch (error) {
      console.error('Error creating hotel:', error);
      alert('Failed to create hotel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    const facilities = hotel.facilities ? (typeof hotel.facilities === 'string' ? JSON.parse(hotel.facilities) : hotel.facilities) : [];
    setFacilitiesList(facilities);
    setNewHotel({
      name: hotel.name,
      address: hotel.address,
      description: hotel.description,
      image_url: hotel.image_url,
      facilities: JSON.stringify(facilities)
    });
    setView('edit');
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    setSubmitting(true);
    try {
      await api.put(`/hotels/${editingHotel.ID}`, newHotel);
      setNewHotel({ name: '', address: '', description: '', image_url: '', facilities: '[]' });
      setFacilitiesList([]);
      setEditingHotel(null);
      setView('list');
      loadHotels();
      fetchHotels(); // Refresh global context
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert('Failed to update hotel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHotel = async (hotel: Hotel) => {
    if (!confirm(`Are you sure you want to delete "${hotel.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/hotels/${hotel.ID}`);
      loadHotels();
      fetchHotels(); // Refresh global context
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert('Failed to delete hotel');
    }
  };

  // --- CREATE/EDIT VIEW ---
  if (view === 'create' || view === 'edit') {
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
            <h1 className="text-2xl font-bold text-gray-800">{view === 'edit' ? 'Edit Hotel' : 'Register New Hotel'}</h1>
            <p className="text-gray-500 text-sm">{view === 'edit' ? 'Update hotel information' : 'Add a new property to the system'}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={view === 'edit' ? handleUpdateHotel : handleAddHotel} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({...newHotel, name: e.target.value})}
                  placeholder="e.g. Grand Hyatt Jakarta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                    value={newHotel.address}
                    onChange={(e) => setNewHotel({...newHotel, address: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={newHotel.description}
                onChange={(e) => setNewHotel({...newHotel, description: e.target.value})}
                rows={4}
                placeholder="Brief description of the property..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facilities</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  placeholder="Add facility (e.g. Swimming Pool)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFacility();
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={addFacility}
                  className="bg-gray-100 text-gray-700 px-4 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Add
                </button>
              </div>
              
              {facilitiesList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {facilitiesList.map((f, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-100">
                      {f}
                      <button type="button" onClick={() => removeFacility(i)} className="hover:text-blue-900">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                <ImageUpload 
                  value={newHotel.image_url}
                  onChange={(url) => setNewHotel({...newHotel, image_url: url})}
                  label="Click to upload cover image"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
              <button 
                type="button" 
                onClick={() => {
                  setView('list');
                  setEditingHotel(null);
                  setNewHotel({ name: '', address: '', description: '', image_url: '', facilities: '[]' });
                  setFacilitiesList([]);
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
                {submitting ? (view === 'edit' ? 'Updating...' : 'Registering...') : (view === 'edit' ? 'Update Hotel' : 'Register Hotel')}
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
          <h1 className="text-3xl font-bold text-gray-800">Hotel Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage properties and locations</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Register Hotel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500 col-span-full text-center py-12">Loading hotels...</p>
        ) : hotels.map((hotel) => (
          <div key={hotel.ID} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-gray-100">
              {hotel.image_url ? (
                <img 
                  src={hotel.image_url} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Building2 size={48} />
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{hotel.name}</h3>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                <MapPin size={14} />
                <span>{hotel.address}</span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4 min-h-[40px]">{hotel.description}</p>
              
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditHotel(hotel)}
                    className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
                    title="Edit Hotel"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteHotel(hotel)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Hotel"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hotels;

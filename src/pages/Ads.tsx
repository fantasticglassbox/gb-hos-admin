import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Video, Filter, X, MonitorPlay } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';

interface Ad {
  ID: number;
  hotel_id: number;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
  duration_seconds: number;
  start_date: string | null;
  end_date: string | null;
}

const Ads = () => {
  const { selectedHotel, hotels, setSelectedHotel } = useHotel();
  const [searchParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State: 'list' | 'create'
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // Form State
  const [newAd, setNewAd] = useState({ 
    title: '', 
    description: '', 
    image_url: '',
    duration_seconds: 10,
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Date range filter state
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: '',
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

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
    // Re-fetch when hotel changes, URL hotel_id changes, or date filter changes
    fetchAds();
  }, [selectedHotel, urlHotelId, dateFilter.start_date, dateFilter.end_date]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      // Use selectedHotel first, then fallback to URL hotel_id
      const hotelId = selectedHotel?.ID || (urlHotelId ? Number(urlHotelId) : null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (hotelId) {
        params.append('hotel_id', hotelId.toString());
      }
      params.append('include_all', 'true');
      
      // Add date range filters if provided
      if (dateFilter.start_date) {
        params.append('filter_start_date', dateFilter.start_date);
      }
      if (dateFilter.end_date) {
        params.append('filter_end_date', dateFilter.end_date);
      }
      
      const url = `/ads?${params.toString()}`;
      const response = await api.get(url);
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDateFilter = () => {
    setDateFilter({ start_date: '', end_date: '' });
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use selectedHotel first, then fallback to URL hotel_id
    const hotelId = selectedHotel?.ID || (urlHotelId ? Number(urlHotelId) : null);
    
    if (!hotelId) {
      alert('Please select a hotel first');
      return;
    }
    
    setSubmitting(true);
    try {
      const adData: any = {
        hotel_id: hotelId,
        title: newAd.title,
        description: newAd.description,
        image_url: newAd.image_url,
        is_active: true,
        duration_seconds: Number(newAd.duration_seconds) || 10,
      };
      
      // Add dates only if provided
      if (newAd.start_date) {
        adData.start_date = newAd.start_date;
      }
      if (newAd.end_date) {
        adData.end_date = newAd.end_date;
      }
      
      await api.post('/ads', adData);
      setNewAd({ title: '', description: '', image_url: '', duration_seconds: 10, start_date: '', end_date: '' });
      setView('list');
      fetchAds();
    } catch (error) {
      console.error('Error creating ad:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await api.delete(`/ads/${id}`);
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
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
            <h1 className="text-2xl font-bold text-gray-800">New Advertisement</h1>
            <p className="text-gray-500 text-sm">Create a new promo banner</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleAddAd} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
              <input 
                type="text" 
                required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={newAd.title}
                onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                placeholder="e.g. Summer Spa Special"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media (Image or Video)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                <ImageUpload 
                  value={newAd.image_url}
                  onChange={(url) => setNewAd({...newAd, image_url: url})}
                  label="Click to upload media"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Supports JPG, PNG, MP4, WEBM</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={newAd.description}
                onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                placeholder="Details about the promotion..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Duration (seconds)</label>
                <input 
                  type="number" 
                  min="1"
                  max="300"
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newAd.duration_seconds}
                  onChange={(e) => setNewAd({...newAd, duration_seconds: Number(e.target.value) || 10})}
                  placeholder="10"
                />
                <p className="text-xs text-gray-400 mt-1">How long each ad displays (1-300 seconds)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newAd.start_date}
                  onChange={(e) => setNewAd({...newAd, start_date: e.target.value})}
                />
                <p className="text-xs text-gray-400 mt-1">When to start showing this ad</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newAd.end_date}
                  onChange={(e) => setNewAd({...newAd, end_date: e.target.value})}
                />
                <p className="text-xs text-gray-400 mt-1">When to stop showing this ad</p>
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
                {submitting ? 'Publishing...' : 'Publish Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  // Use selectedHotel first, then fallback to URL hotel_id
  const effectiveHotelId = selectedHotel?.ID || (urlHotelId ? Number(urlHotelId) : null);
  
  if (!effectiveHotelId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please select a hotel to manage ads</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <MonitorPlay className="text-[#008491]" size={32} />
            Ads & Promos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage digital signage and promotional content{selectedHotel ? ` for ${selectedHotel.name}` : ''}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`px-5 py-2.5 rounded-lg flex items-center gap-2 border transition-all ${
              showDateFilter || dateFilter.start_date || dateFilter.end_date
                ? 'bg-[#008491] text-white border-[#008491]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            Filter by Date
            {(dateFilter.start_date || dateFilter.end_date) && (
              <span className="ml-1 bg-white/20 px-2 py-0.5 rounded text-xs">
                Active
              </span>
            )}
          </button>
          <button 
            onClick={() => setView('create')}
            className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
          >
            <Plus size={20} />
            Create New Ad
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      {showDateFilter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filter by Date Range</h3>
            <button
              onClick={() => setShowDateFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.start_date}
                onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.end_date}
                onChange={(e) => setDateFilter({ ...dateFilter, end_date: e.target.value })}
                min={dateFilter.start_date || undefined}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-transparent outline-none"
              />
            </div>
          </div>
          {(dateFilter.start_date || dateFilter.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearDateFilter}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading ads...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16">
            <Video className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Ads Found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first ad.</p>
            <button 
              onClick={() => setView('create')}
              className="bg-[#008491] text-white px-6 py-2.5 rounded-lg hover:bg-[#006a76] transition-all"
            >
              Create First Ad
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <div key={ad.ID} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-gray-100 group-hover:opacity-90 transition-opacity">
                    {ad.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <div className="relative w-full h-full bg-black">
                        <video src={ad.image_url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                            <Video className="text-white" size={24} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={ad.image_url} 
                        alt={ad.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{ad.title}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2 min-h-[40px]">{ad.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {ad.duration_seconds}s duration
                    </span>
                    {ad.start_date && (
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        Starts: {new Date(ad.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {ad.end_date && (
                      <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                        Ends: {new Date(ad.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <a 
                      href={ad.image_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#008491] hover:text-[#006a76] text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {ad.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? <Video size={16} /> : <ImageIcon size={16} />}
                      View Media
                    </a>
                    <button 
                      onClick={() => handleDeleteAd(ad.ID)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                      title="Delete Ad"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;

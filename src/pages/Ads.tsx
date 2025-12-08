import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';

interface Ad {
  ID: number;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

const Ads = () => {
  const { selectedHotel } = useHotel();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State: 'list' | 'create'
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // Form State
  const [newAd, setNewAd] = useState({ title: '', description: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Re-fetch when hotel changes
    fetchAds();
  }, [selectedHotel]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/ads');
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('http://localhost:8080/api/ads', {
        ...newAd,
        is_active: true
      });
      setNewAd({ title: '', description: '', image_url: '' });
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
      await axios.delete(`http://localhost:8080/api/ads/${id}`);
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
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ads & Promos</h1>
          <p className="text-gray-500 text-sm mt-1">Manage digital signage and promotional content</p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Create New Ad
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading ads...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <Video className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No Active Ads</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Promote hotel services, events, or offers to guests via the in-room tablet.</p>
          <button 
            onClick={() => setView('create')}
            className="text-[#008491] hover:underline font-medium"
          >
            Create First Ad
          </button>
        </div>
      ) : (
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
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{ad.description}</p>
                
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
      )}
    </div>
  );
};

export default Ads;

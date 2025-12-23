import { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Image as ImageIcon, AlertCircle, Globe, Layout, Type, Phone, Plus, Trash2 } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { useHotel } from '../context/HotelContext';

const HotelSettings = () => {
  const { selectedHotel } = useHotel();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    app_background_image: '',
    poi_image: '',
    localization: '',
    default_lang: 'EN',
    default_layout: 'list',
    no_item_section: 2,
    display_size: 'normal',
    call_extensions: '[]',
  });

  interface CallExtension {
    title: string;
    subtitle: string;
    extension: string;
  }

  const [callExtensions, setCallExtensions] = useState<CallExtension[]>([]);

  useEffect(() => {
    if (selectedHotel) {
      fetchHotelSetting();
    } else {
      setLoading(false);
      setFormData({
        app_background_image: '',
        poi_image: '',
        localization: '',
        default_lang: 'EN',
        default_layout: 'list',
        no_item_section: 2,
        display_size: 'normal',
        call_extensions: '[]',
      });
      setCallExtensions([]);
    }
  }, [selectedHotel]);

  const fetchHotelSetting = async () => {
    if (!selectedHotel) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/hotel-settings/by-hotel/${selectedHotel.ID}`);
      const callExtensionsData = response.data.call_extensions || '[]';
      let parsedExtensions: CallExtension[] = [];
      try {
        parsedExtensions = JSON.parse(callExtensionsData);
      } catch (e) {
        parsedExtensions = [];
      }
      
      setFormData({
        app_background_image: response.data.app_background_image || '',
        poi_image: response.data.poi_image || '',
        localization: response.data.localization || '',
        default_lang: response.data.default_lang || 'EN',
        default_layout: response.data.default_layout || 'list',
        no_item_section: response.data.no_item_section || 2,
        display_size: response.data.display_size || 'normal',
        call_extensions: callExtensionsData,
      });
      setCallExtensions(parsedExtensions);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No settings yet for this hotel - that's fine
        setFormData({ 
          app_background_image: '',
          localization: '',
          default_lang: 'EN',
          default_layout: 'list',
          no_item_section: 2,
          display_size: 'normal',
          call_extensions: '[]',
        });
        setCallExtensions([]);
      } else {
        console.error('Error fetching hotel setting:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) {
      setMessage({ type: 'error', text: 'Please select a hotel first' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      await api.post('/hotel-settings/upsert', {
        hotel_id: selectedHotel.ID,
        app_background_image: formData.app_background_image,
        poi_image: formData.poi_image,
        localization: formData.localization,
        default_lang: formData.default_lang,
        default_layout: formData.default_layout,
        no_item_section: formData.no_item_section,
        display_size: formData.display_size,
        call_extensions: JSON.stringify(callExtensions),
      });
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      fetchHotelSetting(); // Refresh to get the updated setting
    } catch (error: any) {
      console.error('Error saving hotel setting:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading settings...
      </div>
    );
  }

  if (!selectedHotel) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Hotel Settings</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="text-amber-500 mt-0.5" size={24} />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">No Hotel Selected</h3>
            <p className="text-amber-700 text-sm">
              Please select a hotel from the sidebar to configure its settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Hotel Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure app settings for {selectedHotel.name}
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <AlertCircle size={20} />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="space-y-8">
          {/* App Background Image Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-[#008491]" />
              App Background Image
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Set the background image for the customer app home screen. This image will be displayed 
              behind the hero section of the app.
            </p>
            
            <div className="space-y-4">
              {formData.app_background_image && (
                <div className="relative">
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.app_background_image}
                      alt="App Background Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, app_background_image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ImageUpload
                  value={formData.app_background_image}
                  onChange={(url) => setFormData({ ...formData, app_background_image: url })}
                  label={formData.app_background_image ? "Change Image" : "Upload Background Image"}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Recommended: High-resolution image (1920x1080 or larger). Supports JPG, PNG, WebP formats.
              </p>
            </div>
          </div>

          {/* POI Image Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-[#008491]" />
              POI Menu Image
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Set the background image for the customer app home screen. This image will be displayed 
              behind the hero section of the app.
            </p>
            
            <div className="space-y-4">
              {formData.app_background_image && (
                <div className="relative">
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.app_background_image}
                      alt="App Background Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, app_background_image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ImageUpload
                  value={formData.app_background_image}
                  onChange={(url) => setFormData({ ...formData, app_background_image: url })}
                  label={formData.app_background_image ? "Change Image" : "Upload Background Image"}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Recommended: High-resolution image (1920x1080 or larger). Supports JPG, PNG, WebP formats.
              </p>
            </div>
          </div>

          {/* POI Image Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-[#008491]" />
              POI Menu Image
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Set the image for the Points of Interest (POI) menu entry on the customer app home screen. 
              This image will be displayed as a menu card that users can tap to view all POIs.
            </p>
            
            <div className="space-y-4">
              {formData.poi_image && (
                <div className="relative">
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={formData.poi_image}
                      alt="POI Image Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, poi_image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ImageUpload
                  value={formData.poi_image}
                  onChange={(url) => setFormData({ ...formData, poi_image: url })}
                  label={formData.poi_image ? "Change Image" : "Upload POI Menu Image"}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Recommended: Square image (800x800 or larger). Supports JPG, PNG, WebP formats.
              </p>
            </div>
          </div>

          {/* Localization Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Globe size={20} className="text-[#008491]" />
              Localization
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure translations for Bahasa (ID), English (EN), and Chinese (ZH). 
              Provide JSON format with language codes as keys.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={formData.default_lang}
                  onChange={(e) => setFormData({ ...formData, default_lang: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                >
                  <option value="EN">English (EN)</option>
                  <option value="ID">Bahasa Indonesia (ID)</option>
                  <option value="ZH">Chinese (ZH)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The default language that will be used when the app first loads. Users can change it later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Translation JSON
                </label>
                <textarea
                  value={formData.localization}
                  onChange={(e) => setFormData({ ...formData, localization: e.target.value })}
                  placeholder='{"ID": {"key": "value"}, "EN": {"key": "value"}, "ZH": {"key": "value"}}'
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#008491] focus:border-[#008491] resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter valid JSON format. Use uppercase language codes (ID, EN, ZH). Example:{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {`{"ID": {"welcome": "Selamat Datang"}, "EN": {"welcome": "Welcome"}, "ZH": {"welcome": "欢迎"}}`}
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Default Layout Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layout size={20} className="text-[#008491]" />
              Default Layout
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure how Curated Services and Facilities are displayed in the customer app.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layout Type
                </label>
                <select
                  value={formData.default_layout}
                  onChange={(e) => setFormData({ ...formData, default_layout: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                >
                  <option value="list">List</option>
                  <option value="grid">Grid</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  List: Single column, top-down. Grid: Multiple columns based on items per section.
                </p>
              </div>

              {formData.default_layout === 'grid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Section (Grid Layout)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="4"
                    value={formData.no_item_section}
                    onChange={(e) => setFormData({ ...formData, no_item_section: parseInt(e.target.value) || 2 })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of items to display per row in grid layout (2-4 recommended).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Display Size Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Type size={20} className="text-[#008491]" />
              Display Size
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Adjust the UI scaling for better readability. Larger sizes increase font sizes, icon sizes, and spacing throughout the app.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size Preset
                </label>
                <select
                  value={formData.display_size}
                  onChange={(e) => setFormData({ ...formData, display_size: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                >
                  <option value="normal">Normal (Default)</option>
                  <option value="large">Large (+25% fonts, +20% icons)</option>
                  <option value="extra_large">Extra Large (+50% fonts, +40% icons)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended for guests who need larger text and easier-to-tap elements.
                </p>
              </div>
            </div>
          </div>

          {/* Call Extensions Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-[#008491]" />
              Call Extensions
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure call extension options that will appear in the customer app's call dialog. Each extension requires a title, subtitle, and extension number.
            </p>
            
            <div className="space-y-4">
              {callExtensions.map((ext, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-700">Extension {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = callExtensions.filter((_, i) => i !== index);
                        setCallExtensions(updated);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={ext.title}
                        onChange={(e) => {
                          const updated = [...callExtensions];
                          updated[index].title = e.target.value;
                          setCallExtensions(updated);
                        }}
                        placeholder="e.g., Room Call"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={ext.subtitle}
                        onChange={(e) => {
                          const updated = [...callExtensions];
                          updated[index].subtitle = e.target.value;
                          setCallExtensions(updated);
                        }}
                        placeholder="e.g., Call from room"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Extension
                      </label>
                      <input
                        type="text"
                        value={ext.extension}
                        onChange={(e) => {
                          const updated = [...callExtensions];
                          updated[index].extension = e.target.value;
                          setCallExtensions(updated);
                        }}
                        placeholder="e.g., 000 or leave empty"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#008491] focus:border-[#008491]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setCallExtensions([...callExtensions, { title: '', subtitle: '', extension: '' }]);
                }}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-[#008491] hover:text-[#008491] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Call Extension
              </button>
              
              {callExtensions.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  No call extensions configured. Click "Add Call Extension" to add one.
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#008491] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006a76] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HotelSettings;

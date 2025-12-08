import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { useHotel } from '../context/HotelContext';

interface Service {
  ID: number;
  name: string;
  type: string;
  price: number;
  description: string;
}

const Services = () => {
  const navigate = useNavigate();
  const { selectedHotel } = useHotel();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newService, setNewService] = useState({ name: '', type: 'food', price: 0, description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedHotel) {
      fetchServices();
    }
  }, [selectedHotel]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/services?hotel_id=${selectedHotel?.ID}`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return alert('Please select a hotel first');
    
    setSubmitting(true);
    try {
      await axios.post('http://localhost:8080/api/services', {
        ...newService,
        price: Number(newService.price),
        hotel_id: selectedHotel.ID
      });
      setNewService({ name: '', type: 'food', price: 0, description: '' });
      setView('list');
      fetchServices();
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setSubmitting(false);
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
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="e.g. In-Room Dining"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none bg-white"
                  value={newService.type}
                  onChange={(e) => setNewService({...newService, type: e.target.value})}
                >
                  <option value="food">Food & Drink</option>
                  <option value="massage">Massage & Spa</option>
                  <option value="laundry">Laundry</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-500">Rp</span>
                <input 
                  type="number" 
                  className="w-full border p-3 pl-10 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                rows={3}
                placeholder="Description of service availability, hours, etc."
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
                {submitting ? 'Creating...' : 'Create Service'}
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
          <h1 className="text-3xl font-bold text-gray-800">Services</h1>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
            <tr>
              <th className="p-5 w-1/4">Name</th>
              <th className="p-5">Type</th>
              <th className="p-5">Base Price</th>
              <th className="p-5 w-1/3">Description</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">Loading services...</td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  No services found for this hotel. <br/>
                  <button onClick={() => setView('create')} className="text-[#008491] hover:underline mt-2 font-medium">Create your first service</button>
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.ID} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-5 font-medium text-gray-900">{service.name}</td>
                  <td className="p-5">
                    <span className="px-2.5 py-1 bg-[#e0fbfc] text-[#006a76] rounded-full text-xs font-bold uppercase tracking-wide">
                      {service.type}
                    </span>
                  </td>
                  <td className="p-5 text-gray-600">Rp {service.price.toLocaleString()}</td>
                  <td className="p-5 text-gray-500 text-sm max-w-xs truncate">{service.description}</td>
                  <td className="p-5 text-right">
                    <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/services/${service.ID}`)}
                        className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
                        title="Edit Menu"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Services;

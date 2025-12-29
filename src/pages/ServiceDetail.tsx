import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Settings, Search, Filter, Edit2, Trash2 } from 'lucide-react';

import type { Service, MenuItem, MenuCategory } from '../types';
import Modal from '../components/Modal';
import CategoryForm from '../components/forms/CategoryForm';
import MenuItemForm from '../components/forms/MenuItemForm';
import ModifierManager from '../components/forms/ModifierManager';
import ImageUpload from '../components/ImageUpload';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | undefined>(undefined);
  const [activeModifierItem, setActiveModifierItem] = useState<MenuItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [serviceImageUrl, setServiceImageUrl] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchService();
  }, [id]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryFilter]);

  const fetchService = async () => {
    try {
      const response = await api.get(`/services/${id}`);
      setService(response.data);
      setServiceImageUrl(response.data.image_url || '');
      
      // Refresh active modifier item if open
      if (activeModifierItem) {
        const updatedService = response.data;
        const updatedItem = updatedService.categories
          .flatMap((c: MenuCategory) => c.items)
          .find((i: MenuItem) => i.ID === activeModifierItem.ID);
        if (updatedItem) setActiveModifierItem(updatedItem);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServiceImage = async () => {
    if (!service) return;
    setSavingImage(true);
    try {
      await api.put(`/services/${service.ID}`, {
        image_url: serviceImageUrl,
      });
      await fetchService();
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving service image:', error);
      alert('Failed to save service image');
    } finally {
      setSavingImage(false);
    }
  };

  // Helper: Flatten all items
  const allItems = useMemo(() => {
    if (!service) return [];
    return service.categories.flatMap(cat => 
      cat.items.map(item => ({ ...item, categoryName: cat.name, categoryId: cat.ID }))
    );
  }, [service]);

  // Helper: Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchTerm, selectedCategoryFilter]);

  // Helper: Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openItemModal = (catId?: number) => {
    if (!service?.categories || service.categories.length === 0) {
      alert("Please create a category first.");
      return;
    }
    setActiveCategory(catId || service.categories[0].ID);
    setEditingItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setActiveCategory(item.categoryId);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/menu/items/${item.ID}`);
      fetchService();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading service details...</div>;
  if (!service) return <div className="p-8 text-center text-red-500">Service not found</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button onClick={() => navigate('/services')} className="text-gray-500 hover:text-gray-800 mb-2 block transition-colors">
            &larr; Back to Services
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{service.name} Menu</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span className="bg-gray-100 px-2 py-0.5 rounded-full">{service.type}</span>
            <span>•</span>
            <span>{service.categories.length} Categories</span>
            <span>•</span>
            <span>{allItems.length} Items</span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all shadow-sm"
          >
            <Settings size={18} /> Settings
          </button>
          <button 
            onClick={() => setShowCatModal(true)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} /> New Category
          </button>
          <button 
            onClick={() => openItemModal()}
            className="bg-[#008491] text-white px-4 py-2 rounded-lg hover:bg-[#006a76] flex items-center gap-2 shadow-md shadow-gray-200 transition-all"
          >
            <Plus size={18} /> New Item
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search menu items..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select 
            className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#008491] min-w-[160px] cursor-pointer"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Categories</option>
            {service.categories.map(cat => (
              <option key={cat.ID} value={cat.ID}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {currentItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No items found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters, or add a new item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.map((item) => (
            <div key={item.ID} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-200 flex flex-col group">
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                    No Image
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm border border-gray-100">
                    {item.categoryName}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                  <span className="font-bold text-[#008491] bg-[#e0fbfc] px-2 py-1 rounded-lg text-sm whitespace-nowrap">
                    Rp {item.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {item.modifiers?.length > 0 ? (
                      <>
                        {item.modifiers.slice(0, 2).map(mod => (
                          <span key={mod.ID} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200 font-medium">
                            {mod.name}
                          </span>
                        ))}
                        {item.modifiers.length > 2 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                            +{item.modifiers.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No modifiers</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setActiveModifierItem(item)}
                      className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
                      title="Configure Modifiers"
                    >
                      <Settings size={18} />
                    </button>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
          >
            Previous
          </button>
          <div className="flex items-center px-4 text-gray-600 bg-white border border-gray-100 rounded-lg">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* --- MODALS --- */}

      <Modal 
        isOpen={showCatModal} 
        onClose={() => setShowCatModal(false)} 
        title="Create New Category"
      >
        <CategoryForm 
          serviceId={id!} 
          onSuccess={() => { setShowCatModal(false); fetchService(); }} 
          onCancel={() => setShowCatModal(false)}
        />
      </Modal>

      <Modal 
        isOpen={showItemModal} 
        onClose={() => { setShowItemModal(false); setEditingItem(null); }} 
        title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}
      >
        <MenuItemForm 
          categories={service.categories} 
          initialCategoryId={activeCategory} 
          editingItem={editingItem}
          onSuccess={() => { setShowItemModal(false); setEditingItem(null); fetchService(); }} 
          onCancel={() => { setShowItemModal(false); setEditingItem(null); }}
        />
      </Modal>

      <Modal 
        isOpen={!!activeModifierItem} 
        onClose={() => setActiveModifierItem(null)} 
        title={activeModifierItem ? `Modifiers: ${activeModifierItem.name}` : 'Modifiers'}
      >
        {activeModifierItem && (
          <ModifierManager 
            item={activeModifierItem} 
            serviceId={id!} 
            onUpdate={fetchService}
            onClose={() => setActiveModifierItem(null)}
          />
        )}
      </Modal>

      <Modal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        title="Service Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Image
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload an image for this service. If not provided, the app will use a default gradient design.
            </p>
            {serviceImageUrl && (
              <div className="mb-3 relative">
                <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={serviceImageUrl}
                    alt="Service preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setServiceImageUrl('')}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <ImageUpload
                value={serviceImageUrl}
                onChange={(url) => setServiceImageUrl(url)}
                label={serviceImageUrl ? "Change Image" : "Upload Service Image"}
                accept="image/png,image/jpeg,image/jpg"
                allowedTypes={['png', 'jpeg', 'jpg']}
                maxSizeMB={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveServiceImage}
              disabled={savingImage}
              className="px-4 py-2 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium shadow-md shadow-gray-200 disabled:opacity-70 transition-all"
            >
              {savingImage ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ServiceDetail;

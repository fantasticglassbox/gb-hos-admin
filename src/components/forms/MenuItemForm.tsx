import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Service, MenuItem } from '../../types';
import ImageUpload from '../ImageUpload';

interface MenuItemFormProps {
  categories: Service['categories'];
  initialCategoryId?: number;
  editingItem?: MenuItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const MenuItemForm = ({ categories, initialCategoryId, editingItem, onSuccess, onCancel }: MenuItemFormProps) => {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<number>(initialCategoryId || (categories[0]?.ID || 0));
  const [newItem, setNewItem] = useState({ 
    name: '', 
    description: '', 
    price: 0, 
    image_url: '' 
  });

  useEffect(() => {
    if (editingItem) {
      setNewItem({
        name: editingItem.name || '',
        description: editingItem.description || '',
        price: editingItem.price || 0,
        image_url: editingItem.image_url || ''
      });
      setCategoryId(editingItem.categoryId || initialCategoryId || categories[0]?.ID || 0);
    } else {
      setNewItem({ name: '', description: '', price: 0, image_url: '' });
      setCategoryId(initialCategoryId || categories[0]?.ID || 0);
    }
  }, [editingItem, initialCategoryId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !newItem.name) {
      alert('Please select a category and enter a name');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await api.put(`/menu/items/${editingItem.ID}`, {
          category_id: categoryId,
          ...newItem
        });
      } else {
        await api.post('/menu/items', {
          category_id: categoryId,
          ...newItem
        });
      }
      setNewItem({ name: '', description: '', price: 0, image_url: '' });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert(editingItem ? 'Failed to update item' : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            className="w-full border p-2 rounded-lg bg-white"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
          >
            {categories.map(c => <option key={c.ID} value={c.ID}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">Rp</span>
            <input 
              type="number" 
              required
              min="0"
              className="w-full border p-2 pl-10 rounded-lg"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
            />
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
        <input 
          type="text" 
          required
          placeholder="e.g. Nasi Goreng Special"
          className="w-full border p-2 rounded-lg"
          value={newItem.name}
          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          placeholder="Ingredients, taste, etc."
          className="w-full border p-2 rounded-lg"
          rows={3}
          value={newItem.description}
          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <ImageUpload 
          value={newItem.image_url}
          onChange={(url) => setNewItem({...newItem, image_url: url})}
          label=""
          accept="image/png,image/jpeg,image/jpg"
          allowedTypes={['png', 'jpeg', 'jpg']}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 py-2 bg-[#008491] text-white rounded-lg hover:bg-[#006a76] disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update Item' : 'Add Item')}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm;


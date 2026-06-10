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
  const emptyItem = { name: '', description: '', price: 0, image_url: '', is_featured: false };
  const [newItem, setNewItem] = useState(emptyItem);

  useEffect(() => {
    if (editingItem) {
      setNewItem({
        name: editingItem.name || '',
        description: editingItem.description || '',
        price: editingItem.price || 0,
        image_url: editingItem.image_url || '',
        is_featured: editingItem.is_featured ?? false,
      });
      setCategoryId(editingItem.categoryId || initialCategoryId || categories[0]?.ID || 0);
    } else {
      setNewItem(emptyItem);
      setCategoryId(initialCategoryId || categories[0]?.ID || 0);
    }
    // emptyItem is a stable literal in this closure; re-running on every render
    // would defeat the form-reset semantics we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setNewItem(emptyItem);
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
          maxSizeMB={2}
        />
      </div>

      <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-amber-50/40 hover:bg-amber-50 transition-colors cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#008491] focus:ring-[#008491]"
          checked={newItem.is_featured}
          onChange={(e) => setNewItem({ ...newItem, is_featured: e.target.checked })}
        />
        <span className="flex-1">
          <span className="block text-sm font-medium text-gray-800">Featured item</span>
          <span className="block text-xs text-gray-500">Shows in the customer app's Featured carousel above the regular menu.</span>
        </span>
      </label>

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


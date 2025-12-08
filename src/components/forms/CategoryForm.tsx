import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

interface CategoryFormProps {
  serviceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CategoryForm = ({ serviceId, onSuccess, onCancel }: CategoryFormProps) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/menu/categories`, {
        service_id: Number(serviceId),
        name: name
      });
      setName('');
      onSuccess();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
        <input 
          type="text" 
          required
          placeholder="e.g. Main Course, Drinks" 
          className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
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
          {loading ? 'Saving...' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;


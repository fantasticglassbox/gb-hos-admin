import { useEffect, useState } from 'react';
import { Plus, Edit2, Check, X } from 'lucide-react';
import api from '../services/api';
import type { MenuCategory } from '../types';

interface CategoriesTabProps {
  serviceId: string;
  // Bumped by parent to force a re-fetch after external changes (e.g. item moves).
  refreshKey?: number;
  // Notifies parent so the Items tab re-fetches when enable/disable state changes.
  onChange?: () => void;
}

const CategoriesTab = ({ serviceId, refreshKey, onChange }: CategoriesTabProps) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/menu/categories', {
        params: { service_id: serviceId, include_disabled: 'true' },
      });
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [serviceId, refreshKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await api.post('/menu/categories', { service_id: Number(serviceId), name });
      setNewName('');
      await fetchCategories();
      onChange?.();
    } catch (err) {
      console.error(err);
      alert('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat: MenuCategory) => {
    setEditingId(cat.ID);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = async (cat: MenuCategory) => {
    const name = editingName.trim();
    if (!name || name === cat.name) {
      cancelEdit();
      return;
    }
    setSavingId(cat.ID);
    try {
      await api.put(`/menu/categories/${cat.ID}`, { name });
      cancelEdit();
      await fetchCategories();
      onChange?.();
    } catch (err) {
      console.error(err);
      alert('Failed to rename category');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggle = async (cat: MenuCategory) => {
    const isDisabled = !!cat.DeletedAt;
    const action = isDisabled ? 'enable' : 'disable';
    if (!confirm(`${isDisabled ? 'Enable' : 'Disable'} "${cat.name}"? ${isDisabled ? 'It will become visible to guests again.' : 'It will be hidden from guests until re-enabled.'}`)) {
      return;
    }
    setSavingId(cat.ID);
    try {
      if (isDisabled) {
        await api.post(`/menu/categories/${cat.ID}/restore`);
      } else {
        await api.delete(`/menu/categories/${cat.ID}`);
      }
      await fetchCategories();
      onChange?.();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} category`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-2">
        <input
          type="text"
          placeholder="New category name (e.g. Main Course)"
          className="flex-1 border border-gray-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="bg-[#008491] text-white px-4 py-2 rounded-lg hover:bg-[#006a76] disabled:bg-gray-400 flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> {creating ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">No categories yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium w-24 text-center">Items</th>
                <th className="py-3 px-4 font-medium w-32 text-center">Status</th>
                <th className="py-3 px-4 font-medium w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const isDisabled = !!cat.DeletedAt;
                const isEditing = editingId === cat.ID;
                const isSaving = savingId === cat.ID;
                return (
                  <tr
                    key={cat.ID}
                    className={`border-b border-gray-50 last:border-0 ${isDisabled ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          className="w-full border border-gray-200 p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#008491]"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(cat);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      ) : (
                        <span className={`font-medium ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {cat.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {cat.items?.length ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(cat)}
                        disabled={isSaving || isEditing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                          isDisabled ? 'bg-gray-300' : 'bg-[#008491]'
                        }`}
                        title={isDisabled ? 'Click to enable' : 'Click to disable'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isDisabled ? 'translate-x-1' : 'translate-x-6'
                          }`}
                        />
                      </button>
                      <div className={`mt-1 text-[10px] font-medium ${isDisabled ? 'text-gray-400' : 'text-[#008491]'}`}>
                        {isDisabled ? 'DISABLED' : 'ENABLED'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleRename(cat)}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(cat)}
                          disabled={isSaving}
                          className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Disabled categories (and their items) are hidden from the guest app. Toggle them back on anytime.
      </p>
    </div>
  );
};

export default CategoriesTab;

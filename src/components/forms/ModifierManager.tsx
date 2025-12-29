import { useState } from 'react';
import api from '../../services/api';
import type { MenuItem } from '../../types';
import { Edit2, Trash2 } from 'lucide-react';

interface ModifierManagerProps {
  item: MenuItem;
  serviceId?: string; // Optional if not used, or keep and use if needed later
  onUpdate: () => void;
  onClose?: () => void;
}

const ModifierManager = ({ item, onUpdate }: ModifierManagerProps) => {
  const [newModifier, setNewModifier] = useState({ name: '', multi_select: false });
  const [editingModifier, setEditingModifier] = useState<number | null>(null);
  const [editingModifierData, setEditingModifierData] = useState({ name: '', multi_select: false });
  const [activeModifierId, setActiveModifierId] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ name: '', price_delta: 0 });
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [editingOptionData, setEditingOptionData] = useState({ name: '', price_delta: 0 });
  const [loading, setLoading] = useState(false);

  // We need to re-fetch the specific item sometimes, but for now we rely on parent refresh
  // Local state update simulation could be done, but simpler to refresh parent context.

  const handleAddModifier = async () => {
    if (!newModifier.name) return;
    setLoading(true);
    try {
      await api.post('/menu/modifiers', {
        menu_item_id: item.ID,
        ...newModifier
      });
      setNewModifier({ name: '', multi_select: false });
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async (modifierId: number) => {
    if (!newOption.name) return;
    setLoading(true);
    try {
      await api.post('/menu/options', {
        modifier_id: modifierId,
        ...newOption
      });
      setNewOption({ name: '', price_delta: 0 });
      setActiveModifierId(null);
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModifier = (modifier: any) => {
    setEditingModifier(modifier.ID);
    setEditingModifierData({ name: modifier.name, multi_select: modifier.multi_select });
  };

  const handleUpdateModifier = async (modifierId: number) => {
    if (!editingModifierData.name) return;
    setLoading(true);
    try {
      await api.put(`/menu/modifiers/${modifierId}`, editingModifierData);
      setEditingModifier(null);
      setEditingModifierData({ name: '', multi_select: false });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to update modifier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModifier = async (modifierId: number) => {
    if (!confirm('Are you sure you want to delete this modifier group? All options will also be deleted.')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/menu/modifiers/${modifierId}`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to delete modifier');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option.ID);
    setEditingOptionData({ name: option.name, price_delta: option.price_delta });
  };

  const handleUpdateOption = async (optionId: number) => {
    if (!editingOptionData.name) return;
    setLoading(true);
    try {
      await api.put(`/menu/options/${optionId}`, editingOptionData);
      setEditingOption(null);
      setEditingOptionData({ name: '', price_delta: 0 });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to update option');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/menu/options/${optionId}`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-4 mb-4">Manage customization options for <b>{item.name}</b></p>

      {/* Add New Modifier Form */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Add New Modifier Group</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input 
            type="text" 
            placeholder="Group Name (e.g. Spiciness)" 
            className="flex-1 border p-2 rounded"
            value={newModifier.name}
            onChange={(e) => setNewModifier({...newModifier, name: e.target.value})}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
            <input 
              type="checkbox" 
              checked={newModifier.multi_select}
              onChange={(e) => setNewModifier({...newModifier, multi_select: e.target.checked})}
            />
            Multi-select
          </label>
          <button 
            onClick={handleAddModifier} 
            disabled={loading}
            className="bg-[#008491] text-white px-4 py-2 rounded text-sm hover:bg-[#006a76] disabled:bg-gray-400"
          >
            Add
          </button>
        </div>
      </div>

      {/* List Modifiers */}
      <div className="space-y-4">
        {item.modifiers?.length === 0 && <p className="text-center text-gray-400 py-4">No modifiers yet.</p>}
        
        {item.modifiers?.map((mod) => (
          <div key={mod.ID} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              {editingModifier === mod.ID ? (
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input 
                    type="text" 
                    className="flex-1 border p-2 rounded text-sm"
                    value={editingModifierData.name}
                    onChange={(e) => setEditingModifierData({...editingModifierData, name: e.target.value})}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={editingModifierData.multi_select}
                      onChange={(e) => setEditingModifierData({...editingModifierData, multi_select: e.target.checked})}
                    />
                    Multi-select
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateModifier(mod.ID)}
                      disabled={loading || !editingModifierData.name}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => { setEditingModifier(null); setEditingModifierData({ name: '', multi_select: false }); }}
                      className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-800">
                    {mod.name} <span className="text-xs text-gray-500 font-normal ml-1">({mod.multi_select ? 'Multi-select' : 'Single choice'})</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={() => setActiveModifierId(mod.ID === activeModifierId ? null : mod.ID)}
                      className="text-xs text-[#008491] hover:text-[#006a76] font-medium"
                    >
                      {activeModifierId === mod.ID ? 'Close' : '+ Add Option'}
                    </button>
                    <button 
                      onClick={() => handleEditModifier(mod)}
                      className="p-1.5 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded transition-colors"
                      title="Edit Modifier"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteModifier(mod.ID)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Modifier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white">
              {/* Add Option Form */}
              {activeModifierId === mod.ID && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4 items-start sm:items-center bg-blue-50 p-3 rounded-lg">
                  <input 
                    type="text" 
                    placeholder="Option Name" 
                    className="flex-1 border p-1.5 rounded text-sm w-full"
                    value={newOption.name}
                    onChange={(e) => setNewOption({...newOption, name: e.target.value})}
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input 
                      type="number" 
                      placeholder="Price Delta" 
                      className="w-24 border p-1.5 rounded text-sm"
                      value={newOption.price_delta}
                      onChange={(e) => setNewOption({...newOption, price_delta: Number(e.target.value)})}
                    />
                    <button onClick={() => handleAddOption(mod.ID)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700">Save</button>
                  </div>
                </div>
              )}

              {mod.options?.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center">No options added yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mod.options?.map((opt) => (
                    <div key={opt.ID} className="text-sm flex justify-between items-center bg-white border border-gray-100 p-2 rounded hover:border-gray-300 transition-colors group">
                      {editingOption === opt.ID ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <input 
                            type="text" 
                            className="flex-1 border p-1 rounded text-xs"
                            value={editingOptionData.name}
                            onChange={(e) => setEditingOptionData({...editingOptionData, name: e.target.value})}
                          />
                          <input 
                            type="number" 
                            className="w-20 border p-1 rounded text-xs"
                            value={editingOptionData.price_delta}
                            onChange={(e) => setEditingOptionData({...editingOptionData, price_delta: Number(e.target.value)})}
                          />
                          <button 
                            onClick={() => handleUpdateOption(opt.ID)}
                            disabled={loading || !editingOptionData.name}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => { setEditingOption(null); setEditingOptionData({ name: '', price_delta: 0 }); }}
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">{opt.name}</span>
                          <div className="flex items-center gap-1">
                            {opt.price_delta > 0 && (
                              <span className="text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded text-xs">+Rp {opt.price_delta.toLocaleString()}</span>
                            )}
                            <button 
                              onClick={() => handleEditOption(opt)}
                              className="p-1 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit Option"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOption(opt.ID)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                              title="Delete Option"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModifierManager;


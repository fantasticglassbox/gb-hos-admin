import { useState } from 'react';
import api from '../../services/api';
import type { MenuItem } from '../../types';

interface ModifierManagerProps {
  item: MenuItem;
  serviceId?: string; // Optional if not used, or keep and use if needed later
  onUpdate: () => void;
  onClose?: () => void;
}

const ModifierManager = ({ item, onUpdate }: ModifierManagerProps) => {
  const [newModifier, setNewModifier] = useState({ name: '', multi_select: false });
  const [activeModifierId, setActiveModifierId] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ name: '', price_delta: 0 });
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
      await axios.post(`${API_URL}/menu/options`, {
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
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <div className="font-medium text-gray-800">
                {mod.name} <span className="text-xs text-gray-500 font-normal ml-1">({mod.multi_select ? 'Multi-select' : 'Single choice'})</span>
              </div>
              <button 
                onClick={() => setActiveModifierId(mod.ID === activeModifierId ? null : mod.ID)}
                className="text-xs text-[#008491] hover:text-[#006a76] font-medium"
              >
                {activeModifierId === mod.ID ? 'Close' : '+ Add Option'}
              </button>
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
                    <div key={opt.ID} className="text-sm flex justify-between items-center bg-white border border-gray-100 p-2 rounded hover:border-gray-300 transition-colors">
                      <span className="font-medium text-gray-700">{opt.name}</span>
                      {opt.price_delta > 0 && (
                        <span className="text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded text-xs">+Rp {opt.price_delta.toLocaleString()}</span>
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


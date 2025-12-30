import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Users as UsersIcon, Edit2, Trash2, ArrowLeft, Shield, UserCheck, UserCog, User } from 'lucide-react';
import { useHotel } from '../context/HotelContext';

interface User {
  ID: number;
  name: string;
  email: string;
  role: string;
  hotel_id: number | null;
  CreatedAt: string;
}

interface Hotel {
  ID: number;
  name: string;
}

const Users = () => {
  const { selectedHotel } = useHotel();
  const [users, setUsers] = useState<User[]>([]);
  const [hotelsList, setHotelsList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterHotel, setFilterHotel] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'hotel_reception',
    hotel_id: selectedHotel?.ID || null,
  });

  useEffect(() => {
    loadHotels();
    loadUsers();
  }, [filterRole, filterHotel]);

  const loadHotels = async () => {
    try {
      const response = await api.get('/hotels');
      setHotelsList(response.data);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = '/users';
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (filterHotel) params.append('hotel_id', filterHotel);
      if (params.toString()) url += '?' + params.toString();
      
      const response = await api.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (formData.role !== 'admin' && formData.hotel_id) {
        payload.hotel_id = formData.hotel_id;
      }
      
      if (editingUser) {
        await api.put(`/users/${editingUser.ID}`, payload);
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          setSubmitting(false);
          return;
        }
        await api.post(`/users`, payload);
      }
      
      resetForm();
      setView('list');
      loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save user';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't prefill password
      role: user.role,
      hotel_id: user.hotel_id || null,
    });
    setView('edit');
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    
    try {
      await api.delete(`/users/${user.ID}`);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMsg = error.response?.data?.error || 'Failed to delete user';
      alert(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'hotel_reception',
      hotel_id: selectedHotel?.ID || null,
    });
    setEditingUser(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-purple-600" />;
      case 'hotel_admin':
        return <UserCog size={16} className="text-blue-600" />;
      case 'hotel_reception':
        return <UserCheck size={16} className="text-green-600" />;
      case 'service_reception':
        return <UserCheck size={16} className="text-orange-600" />;
      case 'hotel_guest':
        return <User size={16} className="text-gray-600" />;
      default:
        return <User size={16} className="text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'hotel_admin':
        return 'bg-blue-100 text-blue-700';
      case 'hotel_reception':
        return 'bg-green-100 text-green-700';
      case 'service_reception':
        return 'bg-orange-100 text-orange-700';
      case 'hotel_guest':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // --- CREATE/EDIT VIEW ---
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              setView('list');
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-gray-500 text-sm">
              {editingUser ? 'Update user information' : 'Add a new user to the system'}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: newRole,
                      hotel_id: newRole === 'admin' ? null : (formData.hotel_id || selectedHotel?.ID || null),
                    });
                  }}
                >
                  <option value="admin">Admin (Internal Admin)</option>
                  <option value="hotel_admin">Hotel Admin</option>
                  <option value="hotel_reception">Hotel Reception</option>
                  <option value="service_reception">Service Reception (Orders Only)</option>
                  <option value="hotel_guest" disabled={!editingUser}>Hotel Guest (Auto-created)</option>
                </select>
                {formData.role === 'hotel_guest' && (
                  <p className="text-xs text-gray-500 mt-1">Hotel guest users are automatically created when hotels are added.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.role === 'admin' ? 'Hotel (Not Required)' : 'Hotel'}
                </label>
                <select
                  required={formData.role !== 'admin'}
                  disabled={formData.role === 'admin'}
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  value={formData.hotel_id || ''}
                  onChange={(e) => setFormData({...formData, hotel_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Select Hotel</option>
                  {hotelsList.map((hotel) => (
                    <option key={hotel.ID} value={hotel.ID}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingUser && '(leave blank to keep current)'}
              </label>
              <input 
                type="password" 
                required={!editingUser}
                minLength={6}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={editingUser ? "•••••••• (leave blank to keep current)" : "••••••••"}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
              <button 
                type="button" 
                onClick={() => {
                  setView('list');
                  resetForm();
                }}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-6 py-2.5 bg-[#008491] text-white hover:bg-[#006a76] rounded-lg font-medium shadow-md shadow-gray-200 disabled:opacity-70 transition-all"
              >
                {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon className="text-[#008491]" size={32} />
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage system users and permissions</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setView('create');
          }}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hotel_admin">Hotel Admin</option>
              <option value="hotel_reception">Hotel Reception</option>
              <option value="service_reception">Service Reception</option>
              <option value="hotel_guest">Hotel Guest</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Hotel</label>
            <select
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-[#008491] outline-none"
              value={filterHotel}
              onChange={(e) => setFilterHotel(e.target.value)}
            >
              <option value="">All Hotels</option>
              {hotelsList.map((hotel) => (
                <option key={hotel.ID} value={hotel.ID}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Users Found</h3>
            <p className="text-gray-500 mb-4">Get started by creating a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const hotel = hotelsList.find(h => h.ID === user.hotel_id);
                  return (
                    <tr key={user.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#008491] flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hotel ? hotel.name : user.role === 'admin' ? '-' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.CreatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-[#008491] hover:text-[#006a76] p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          {user.role !== 'hotel_guest' && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;

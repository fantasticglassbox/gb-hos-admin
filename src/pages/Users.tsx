import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Plus, Users as UsersIcon, Edit2, Trash2, ArrowLeft, Shield, UserCheck, UserCog, User, Search } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import DataTable, { type Column } from '../components/DataTable';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';

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
  const [hotelsList, setHotelsList] = useState<Hotel[]>([]);
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

  const extraParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (filterRole) p.role = filterRole;
    if (filterHotel) p.hotel_id = filterHotel;
    return p;
  }, [filterRole, filterHotel]);

  const list = useServerPagination<User>({
    endpoint: '/users',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams,
  });

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await api.get('/hotels');
        setHotelsList(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      } catch (err) {
        console.error('Error fetching hotels:', err);
      }
    };
    loadHotels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) payload.password = formData.password;
      if (formData.role !== 'admin' && formData.hotel_id) payload.hotel_id = formData.hotel_id;

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
      list.refresh();
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save user';
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
      password: '',
      role: user.role,
      hotel_id: user.hotel_id || null,
    });
    setView('edit');
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user.ID}`);
      list.refresh();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to delete user';
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
      case 'admin': return <Shield size={16} className="text-purple-600" />;
      case 'hotel_admin': return <UserCog size={16} className="text-blue-600" />;
      case 'hotel_reception': return <UserCheck size={16} className="text-green-600" />;
      case 'service_reception': return <UserCheck size={16} className="text-orange-600" />;
      case 'hotel_guest': return <User size={16} className="text-gray-600" />;
      default: return <User size={16} className="text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'hotel_admin': return 'bg-blue-100 text-blue-700';
      case 'hotel_reception': return 'bg-green-100 text-green-700';
      case 'service_reception': return 'bg-orange-100 text-orange-700';
      case 'hotel_guest': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string) =>
    role.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // --- CREATE/EDIT VIEW (unchanged form, simplified outer container) ---
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => { setView('list'); resetForm(); }}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Select Hotel</option>
                  {hotelsList.map((hotel) => (
                    <option key={hotel.ID} value={hotel.ID}>{hotel.name}</option>
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? '•••••••• (leave blank to keep current)' : '••••••••'}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => { setView('list'); resetForm(); }}
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
  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      sortKey: 'name',
      render: (u) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[#008491] flex items-center justify-center text-white font-medium">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="text-sm font-semibold text-gray-900">{u.name}</div>
            <div className="text-sm text-gray-500">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'role',
      render: (u) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
          {getRoleIcon(u.role)}
          {formatRole(u.role)}
        </span>
      ),
    },
    {
      key: 'hotel',
      header: 'Hotel',
      render: (u) => {
        const hotel = hotelsList.find((h) => h.ID === u.hotel_id);
        return <span className="text-gray-600">{hotel ? hotel.name : u.role === 'admin' ? '—' : 'N/A'}</span>;
      },
    },
    {
      key: 'created',
      header: 'Created',
      sortKey: 'created_at',
      render: (u) => <span className="text-gray-500">{new Date(u.CreatedAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-28',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleEdit(u)}
            className="p-2 text-gray-400 hover:text-[#008491] hover:bg-[#e0fbfc] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          {u.role !== 'hotel_guest' && (
            <button
              onClick={() => handleDelete(u)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon className="text-[#008491]" size={32} />
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage system users and permissions</p>
        </div>
        <button
          onClick={() => { resetForm(); setView('create'); }}
          className="bg-[#008491] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#006a76] shadow-md shadow-gray-200 transition-all"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={list.search}
              onChange={(e) => list.setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#008491]"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="hotel_admin">Hotel Admin</option>
            <option value="hotel_reception">Hotel Reception</option>
            <option value="service_reception">Service Reception</option>
            <option value="hotel_guest">Hotel Guest</option>
          </select>
          <select
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#008491]"
          >
            <option value="">All hotels</option>
            {hotelsList.map((h) => (
              <option key={h.ID} value={h.ID}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {list.error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{list.error}</div>
      )}

      <DataTable
        columns={columns}
        rows={list.data}
        loading={list.loading}
        rowKey={(u) => u.ID}
        sort={list.sort}
        order={list.order}
        onSortChange={list.toggleSort}
        emptyMessage={list.search ? `No users match "${list.search}"` : 'No users found'}
      />

      <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
    </div>
  );
};

export default Users;

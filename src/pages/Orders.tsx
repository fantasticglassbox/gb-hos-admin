import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { format, startOfDay, subDays } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle, Package, ShoppingCart, Search } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import Pagination from '../components/Pagination';
import { useServerPagination } from '../hooks/useServerPagination';
import type { ModifierOption } from '../types';

interface OrderItem {
  ID: number;
  service: { name: string; type: string };
  menu_item?: { ID: number; name: string; description: string; price: number; image_url: string };
  quantity: number;
  price: number;
  notes: string;
  modifier_options?: ModifierOption[];
}

interface Order {
  ID: number;
  CreatedAt: string;
  room_id: number;
  room?: { ID: number; number: string };
  total_amount: number;
  status: string;
  notes?: string;
  items: OrderItem[];
}

type OrderTab = 'all' | 'new' | 'in_progress' | 'completed' | 'cancelled';

// Status values the backend stores per tab. "in_progress" tab maps to either
// pending-acceptance (confirmed) or in-flight (in_progress).
const tabStatusFilter: Record<OrderTab, string> = {
  all: '',
  new: 'pending',
  in_progress: 'confirmed,in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

function defaultDateRange() {
  const end = startOfDay(new Date());
  const start = subDays(end, 6);
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}

const Orders = () => {
  const { selectedHotel } = useHotel();
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const defaults = defaultDateRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const extraParams = useMemo(() => {
    const p: Record<string, string | number> = {
      start_date: startDate,
      end_date: endDate,
    };
    if (selectedHotel) p.hotel_id = selectedHotel.ID;
    const statusFilter = tabStatusFilter[activeTab];
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [selectedHotel, startDate, endDate, activeTab]);

  const list = useServerPagination<Order>({
    endpoint: '/orders',
    initialSort: 'created_at',
    initialOrder: 'DESC',
    extraParams,
  });

  // Poll for new orders every 30s on the "new" tab; less frequent elsewhere.
  useEffect(() => {
    const intervalMs = activeTab === 'new' ? 30000 : 60000;
    const id = setInterval(() => list.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [activeTab, list]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      list.refresh();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'new': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-[#e0fbfc] text-[#006a76] border-[#bbf4f6]';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (status: string) => {
    const n = status.toLowerCase();
    return n === 'pending' ? 'NEW' : status.toUpperCase();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed': return <AlertCircle size={16} />;
      case 'in_progress': return <Package size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const resetDateRange = () => {
    const d = defaultDateRange();
    setStartDate(d.start);
    setEndDate(d.end);
  };

  const tabs: { key: OrderTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-[#008491]" size={32} />
            Order Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage guest orders and service requests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-[#008491]/30 focus:border-[#008491] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-[#008491]/30 focus:border-[#008491] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={resetDateRange}
          className="px-4 py-2 text-sm font-medium text-[#008491] border border-[#008491]/40 rounded-lg hover:bg-[#008491]/5 transition-colors"
        >
          Last 7 days
        </button>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008491] bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#008491] border-b-2 border-[#008491]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {list.error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{list.error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {list.loading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : list.data.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
            <p className="text-gray-500 mb-4">
              {list.search ? `No orders matching "${list.search}".` : activeTab === 'all' ? 'No orders in this date range.' : `No ${activeTab.replace('_', ' ')} orders.`}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {list.data.map((order) => (
                <div key={order.ID} className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-900">Order #{order.ID}</span>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getDisplayStatus(order.status)}
                        </span>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        Room {order.room?.number || order.room_id} • {format(new Date(order.CreatedAt), 'PP p')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                    </div>
                  </div>

                  {order.notes && order.notes.trim() !== '' && (
                    <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 flex gap-2 items-start">
                      <span className="text-amber-700 text-sm font-semibold shrink-0">Note:</span>
                      <span className="text-amber-900 text-sm italic">{order.notes}</span>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {order.items?.map((item) => (
                      <div key={item.ID} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3 items-start flex-1">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg shrink-0">
                              <span className="font-bold text-gray-900 text-xs">{item.quantity}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-semibold text-sm mb-1">
                                {item.menu_item?.name || item.service.name}
                              </div>
                              {item.menu_item?.description && (
                                <div className="text-xs text-gray-500 mb-1">{item.menu_item.description}</div>
                              )}
                              {item.modifier_options && item.modifier_options.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                  {item.modifier_options.map((option) => (
                                    <div key={option.ID} className="text-xs text-gray-600 flex items-center gap-1.5">
                                      <span className="text-gray-400">•</span>
                                      <span className="flex-1">{option.name}</span>
                                      {option.price_delta !== 0 && (
                                        <span className={`font-medium whitespace-nowrap ${option.price_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {option.price_delta > 0 ? '+' : ''}Rp {Math.abs(option.price_delta).toLocaleString('id-ID')}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <div className="mt-1.5 text-xs text-gray-500 italic">Note: {item.notes}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 shrink-0">
                            <div className="text-gray-900 font-bold text-sm whitespace-nowrap">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    {order.status.toLowerCase() === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.ID, 'cancelled')}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateStatus(order.ID, 'in_progress')}
                          className="px-4 py-2 text-sm bg-[#008491] text-white hover:bg-[#006a76] rounded-lg transition-colors font-medium"
                        >
                          Accept
                        </button>
                      </>
                    )}
                    {(order.status.toLowerCase() === 'in_progress' || order.status.toLowerCase() === 'confirmed') && (
                      <button
                        onClick={() => updateStatus(order.ID, 'completed')}
                        className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                      >
                        Complete Order
                      </button>
                    )}
                    {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'cancelled') && (
                      <span className="px-4 py-2 text-sm text-gray-500 italic">No actions available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Pagination meta={list.meta} onPageChange={list.setPage} onLimitChange={list.setLimit} />
    </div>
  );
};

export default Orders;

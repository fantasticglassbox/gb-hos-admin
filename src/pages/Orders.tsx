import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import type { ModifierOption } from '../types';

interface OrderItem {
  ID: number;
  service: {
    name: string;
    type: string;
  };
  quantity: number;
  price: number;
  notes: string;
  modifier_options?: ModifierOption[];
}

interface Order {
  ID: number;
  CreatedAt: string;
  room_id: number; // In real app, would fetch room number
  total_amount: number;
  status: string;
  items: OrderItem[];
}

type OrderTab = 'all' | 'new' | 'in_progress' | 'completed' | 'cancelled';

const Orders = () => {
  const { selectedHotel } = useHotel();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>('all');

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [selectedHotel]);

  const fetchOrders = async () => {
    try {
      const url = selectedHotel 
        ? `/orders?hotel_id=${selectedHotel.ID}` 
        : '/orders';
      const response = await api.get(url);
      // Sort by newest first
      const sortedOrders = response.data.sort((a: Order, b: Order) => 
        new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
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
    const normalized = status.toLowerCase();
    if (normalized === 'pending') return 'NEW';
    return status.toUpperCase();
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

  const filteredOrders = orders.filter((order) => {
    const status = order.status.toLowerCase();
    switch (activeTab) {
      case 'all':
        return true;
      case 'new':
        return status === 'pending';
      case 'in_progress':
        return status === 'in_progress' || status === 'confirmed';
      case 'completed':
        return status === 'completed';
      case 'cancelled':
        return status === 'cancelled';
      default:
        return true;
    }
  });

  const tabs: { key: OrderTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'new', label: 'New', count: orders.filter(o => o.status.toLowerCase() === 'pending').length },
    { key: 'in_progress', label: 'In Progress', count: orders.filter(o => o.status.toLowerCase() === 'in_progress' || o.status.toLowerCase() === 'confirmed').length },
    { key: 'completed', label: 'Completed', count: orders.filter(o => o.status.toLowerCase() === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status.toLowerCase() === 'cancelled').length },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-[#008491] border-b-2 border-[#008491]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-[#008491] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center text-gray-500 border border-gray-100">
          No {activeTab === 'all' ? '' : activeTab === 'new' ? 'new' : activeTab} orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.ID} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                    Room {order.room_id} • {format(new Date(order.CreatedAt), 'PP p')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">Rp {order.total_amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.ID} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex gap-2 items-start">
                        <span className="font-semibold text-gray-900 text-sm">{item.quantity}x</span>
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium text-sm">{item.service.name}</span>
                          {item.modifier_options && item.modifier_options.length > 0 && (
                            <div className="mt-1.5 ml-0 space-y-0.5">
                              {item.modifier_options.map((option) => (
                                <div key={option.ID} className="text-xs text-gray-600 flex items-center gap-1.5">
                                  <span className="text-gray-400">•</span>
                                  <span>{option.name}</span>
                                  {option.price_delta !== 0 && (
                                    <span className={`font-medium ${option.price_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ({option.price_delta > 0 ? '+' : ''}Rp {Math.abs(option.price_delta).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <div className="mt-1.5 ml-0 text-xs text-gray-500 italic">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-900 font-semibold text-sm whitespace-nowrap ml-4">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
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
                  <span className="px-4 py-2 text-sm text-gray-500 italic">
                    No actions available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;


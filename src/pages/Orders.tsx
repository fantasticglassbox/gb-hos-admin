import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle, Package, ShoppingCart } from 'lucide-react';
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
  room_id: number;
  room?: {
    ID: number;
    number: string;
  };
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-[#008491]" size={32} />
            Order Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage guest orders and service requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'all' 
                ? 'No orders have been placed yet.' 
                : `No ${activeTab === 'new' ? 'new' : activeTab} orders found.`}
            </p>
          </div>
        ) : (
          <div className="p-6">
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
                    Room {order.room?.number || order.room_id} • {format(new Date(order.CreatedAt), 'PP p')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item) => (
                  <div key={item.ID} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-start flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg shrink-0">
                          <span className="font-bold text-gray-900 text-xs">{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 font-semibold text-sm mb-1">{item.service.name}</div>
                          {item.modifier_options && item.modifier_options.length > 0 && (
                            <div className="mt-1.5 ml-0 space-y-0.5">
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
                            <div className="mt-1.5 ml-0 text-xs text-gray-500 italic">
                              Note: {item.notes}
                            </div>
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
                  <span className="px-4 py-2 text-sm text-gray-500 italic">
                    No actions available
                  </span>
                )}
              </div>
            </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;


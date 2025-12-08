import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OrderItem {
  ID: number;
  service: {
    name: string;
    type: string;
  };
  quantity: number;
  price: number;
  notes: string;
}

interface Order {
  ID: number;
  CreatedAt: string;
  room_id: number; // In real app, would fetch room number
  total_amount: number;
  status: string;
  items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/orders');
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
      await axios.patch(`http://localhost:8080/api/orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-[#e0fbfc] text-[#006a76] border-[#bbf4f6]';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'confirmed': return <AlertCircle size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center text-gray-500 border border-gray-100">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.ID} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-gray-900">Order #{order.ID}</span>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
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

              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div key={item.ID} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-900">{item.quantity}x</span>
                      <span className="text-gray-700">{item.service.name}</span>
                    </div>
                    <span className="text-gray-500">Rp {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(order.ID, 'cancelled')}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => updateStatus(order.ID, 'confirmed')}
                      className="px-4 py-2 text-sm bg-[#008491] text-white hover:bg-[#006a76] rounded-lg transition-colors"
                    >
                      Accept Order
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button 
                    onClick={() => updateStatus(order.ID, 'delivered')}
                    className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Mark Delivered
                  </button>
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


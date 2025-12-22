import { useState, useEffect } from 'react';
import api from '../services/api';
import { useHotel } from '../context/HotelContext';
import { 
  Package, 
  DoorOpen, 
  Users, 
  MessageSquare, 
  Smartphone, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  active_orders: number;
  occupied_rooms: number;
  total_rooms: number;
  occupancy_rate: number;
  active_checkins: number;
  unread_messages: number;
  active_devices: number;
  total_devices: number;
  today_revenue: number;
  yesterday_revenue: number;
  revenue_change: number;
  orders_by_status: Record<string, number>;
  new_orders_today: number;
  checkins_today: number;
  checkouts_today: number;
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
}

interface CheckIn {
  ID: number;
  CreatedAt: string;
  checked_in_at: string;
  checked_out_at?: string;
  guest_name: string;
  room_id: number;
  status: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const { selectedHotel } = useHotel();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHotel]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const hotelIdParam = selectedHotel ? `?hotel_id=${selectedHotel.ID}` : '';
      const [statsResponse, ordersResponse, checkInsResponse] = await Promise.all([
        api.get(`/dashboard/stats${hotelIdParam}`),
        api.get(`/orders${hotelIdParam}`),
        api.get(`/checkins${hotelIdParam}`)
      ]);

      setStats(statsResponse.data);
      
      // Sort orders by newest first and take top 5
      const sortedOrders = ordersResponse.data
        .sort((a: Order, b: Order) => 
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        )
        .slice(0, 5);
      setRecentOrders(sortedOrders);

      // Sort check-ins by newest first and take top 5
      const sortedCheckIns = checkInsResponse.data
        .sort((a: CheckIn, b: CheckIn) => 
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        )
        .slice(0, 5);
      setRecentCheckIns(sortedCheckIns);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'new':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare data for charts
  const orderStatusData = stats?.orders_by_status
    ? Object.entries(stats.orders_by_status).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value,
      }))
    : [];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        {selectedHotel && (
          <div className="text-sm text-gray-600">
            Hotel: <span className="font-semibold">{selectedHotel.name}</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Orders</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.active_orders || 0}
              </p>
              <span className="text-green-500 text-sm mt-2 block flex items-center gap-1">
                <TrendingUp size={14} />
                {stats?.new_orders_today || 0} new today
              </span>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Occupied Rooms */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Occupied Rooms</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.occupied_rooms || 0}
              </p>
              <span className="text-gray-400 text-sm mt-2 block">
                {stats?.occupancy_rate?.toFixed(1) || 0}% occupancy
              </span>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DoorOpen className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Unread Messages */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Unread Messages</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.unread_messages || 0}
              </p>
              <span className="text-blue-500 text-sm mt-2 block flex items-center gap-1">
                <AlertCircle size={14} />
                Action required
              </span>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <MessageSquare className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Today's Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.today_revenue || 0)}
              </p>
              <span
                className={`text-sm mt-2 block flex items-center gap-1 ${
                  (stats?.revenue_change || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {(stats?.revenue_change || 0) >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(stats?.revenue_change || 0).toFixed(1)}% vs yesterday
              </span>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Check-ins */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Users className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Check-ins</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.active_checkins || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Active Devices */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Smartphone className="text-teal-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Active Devices</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.active_devices || 0} / {stats?.total_devices || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="text-orange-600" size={20} />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Today's Activity</h3>
              <p className="text-sm text-gray-700 mt-1">
                {stats?.checkins_today || 0} check-ins, {stats?.checkouts_today || 0} check-outs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Distribution */}
        {orderStatusData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Room Occupancy */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Room Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Occupied',
                  value: stats?.occupied_rooms || 0,
                  fill: '#10b981',
                },
                {
                  name: 'Available',
                  value: (stats?.total_rooms || 0) - (stats?.occupied_rooms || 0),
                  fill: '#3b82f6',
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.ID}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Order #{order.ID}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Room {order.room?.number || order.room_id} • {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.CreatedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Check-ins</h3>
          <div className="space-y-3">
            {recentCheckIns.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent check-ins</p>
            ) : (
              recentCheckIns.map((checkIn) => (
                <div
                  key={checkIn.ID}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {checkIn.guest_name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          checkIn.status
                        )}`}
                      >
                        {checkIn.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Room {checkIn.room_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(
                        new Date(checkIn.checked_in_at || checkIn.CreatedAt),
                        'MMM d, yyyy HH:mm'
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

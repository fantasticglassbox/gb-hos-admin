const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
          <span className="text-green-500 text-sm mt-2 block">↑ 2 new</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Occupied Rooms</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">45</p>
          <span className="text-gray-400 text-sm mt-2 block">85% capacity</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Unread Messages</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
          <span className="text-blue-500 text-sm mt-2 block">Action required</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Today's Revenue</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$2,450</p>
          <span className="text-green-500 text-sm mt-2 block">+12% vs yesterday</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


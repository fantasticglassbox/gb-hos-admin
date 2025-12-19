import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ShoppingBag, Utensils, Settings, LogOut, MonitorPlay, Building2, Smartphone, Users, ChevronDown, Search, Check, Dumbbell, DoorOpen, Sliders } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useHotel } from '../context/HotelContext';
import logo from '../assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hotels, selectedHotel, setSelectedHotel, clearSelectedHotel } = useHotel();
  const userRole = localStorage.getItem('userRole');
  const isHotelAdmin = userRole === 'hotel_admin';
  
  // Searchable Select State
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Hotels', path: '/hotels' },
    { icon: Smartphone, label: 'Devices', path: '/devices' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Utensils, label: 'Services', path: '/services' },
    { icon: DoorOpen, label: 'Rooms', path: '/rooms' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: MonitorPlay, label: 'Ads & Promos', path: '/ads' },
    { icon: Dumbbell, label: 'Facilities', path: '/facilities' },
    { icon: Sliders, label: 'Hotel Settings', path: '/hotel-settings' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Filter menu items for hotel_admin - hide Hotels and Settings
  const menuItems = isHotelAdmin
    ? allMenuItems.filter(item => item.path !== '/hotels' && item.path !== '/settings')
    : allMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedHotelId');
    navigate('/login');
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 shadow-lg">
      <div className="p-6 border-b border-gray-100 relative z-20">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Glassbox" className="h-8 w-auto" />
        </div>
        
        {/* Hotel Selector or Welcome Label */}
        {isHotelAdmin ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2 px-1">
              <Building2 size={12} className="text-gray-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Welcome</span>
            </div>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="font-semibold text-base text-gray-900">{selectedHotel?.name || 'Hotel'}</div>
              <div className="text-xs text-gray-600 mt-0.5">Hotel Administrator</div>
            </div>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 text-gray-600 mb-2 px-1">
              <Building2 size={12} className="text-gray-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Selected Hotel</span>
            </div>
            
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg p-2.5 flex justify-between items-center hover:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
            >
              <span className="truncate font-medium">{selectedHotel?.name || 'All Hotels'}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animation-fade-in">
                <div className="p-2 border-b border-gray-50">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search hotel..." 
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border-none rounded-md focus:ring-0 text-gray-700 placeholder-gray-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {/* Option to unselect hotel (show all/unassigned) */}
                  <button
                    onClick={() => {
                      clearSelectedHotel();
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                      selectedHotel === null 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">All Hotels</span>
                    {selectedHotel === null && <Check size={14} className="text-primary-600" />}
                  </button>
                  
                  {filteredHotels.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">No hotels found</div>
                  ) : (
                    filteredHotels.map(hotel => (
                      <button
                        key={hotel.ID}
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                          selectedHotel?.ID === hotel.ID 
                            ? 'bg-primary-50 text-primary-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{hotel.name}</span>
                        {selectedHotel?.ID === hotel.ID && <Check size={14} className="text-primary-600" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-[#008491] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 text-gray-700 hover:text-red-600 w-full px-4 py-2 transition-colors rounded-lg hover:bg-red-50 group"
        >
          <LogOut size={20} className="text-gray-700 group-hover:text-red-600 transition-colors" />
          <span className="transition-colors">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

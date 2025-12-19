import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HotelProvider } from './context/HotelContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Orders from './pages/Orders';
import Ads from './pages/Ads';
import Hotels from './pages/Hotels';
import Devices from './pages/Devices';
import Users from './pages/Users';
import Facilities from './pages/Facilities';
import Rooms from './pages/Rooms';
import HotelSettings from './pages/HotelSettings';
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  // If user is already logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <HotelProvider>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="hotels" element={<Hotels />} />
            <Route path="devices" element={<Devices />} />
            <Route path="users" element={<Users />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="ads" element={<Ads />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="hotel-settings" element={<HotelSettings />} />
          </Route>
          
          {/* Catch all - redirect to login if route not found */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HotelProvider>
    </BrowserRouter>
  );
}

export default App;

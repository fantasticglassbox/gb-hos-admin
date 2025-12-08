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
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <HotelProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="hotels" element={<Hotels />} />
            <Route path="devices" element={<Devices />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:id" element={<ServiceDetail />} />
            <Route path="orders" element={<Orders />} />
            <Route path="ads" element={<Ads />} />
          </Route>
        </Routes>
      </HotelProvider>
    </BrowserRouter>
  );
}

export default App;

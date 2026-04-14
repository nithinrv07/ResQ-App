import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load all page components for better performance
const UserApp = lazy(() => import('./pages/UserApp'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MapSelector = lazy(() => import('./pages/MapSelector'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const StaffLoginPage = lazy(() => import('./pages/StaffLoginPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const EmployeeNotificationPage = lazy(() => import('./pages/EmployeeNotificationPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const RoleSelector = lazy(() => import('./pages/RoleSelector'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-300 border-t-rose-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

const Navigation = memo(({ role }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-md px-6 py-2 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center gap-3">
        <img src="/resq-logo.png" alt="ResQ" className="w-32 h-14" />
      </div>
      <div className="flex gap-6 items-center text-gray-700">
        {role === 'guest' && (
          <Link to="/guest-dashboard" className="hover:text-rose-600 transition-colors font-medium">Guest Safety</Link>
        )}
        {role && role !== 'guest' && (
          <Link to="/" className="hover:text-rose-600 transition-colors font-medium">Home</Link>
        )}
        <Link to="/" className="hover:text-rose-600 transition-colors font-medium">Login</Link>
        <Link to="/chat" className="hover:text-rose-600 transition-colors flex items-center gap-1 font-medium">
          <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-[10px] leading-none">C</span>
          Chat
        </Link>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

function App() {
  function AppLayout() {
    const location = useLocation();
    const { role } = useAuth();
    const isMapSelectorPage = location.pathname === '/map-selector';
    const isLoginPage = location.pathname === '/login';
    const isGuestDashboard = location.pathname === '/guest-dashboard';
    const isStaffLoginPage = location.pathname === '/staff/login';
    const isRoleSelectorPage = location.pathname === '/';
    const hideNavPages = isMapSelectorPage || isLoginPage || isStaffLoginPage || isRoleSelectorPage || isGuestDashboard;

    return (
      <div className="min-h-screen bg-white text-slate-900">
        {!hideNavPages && <Navigation role={role} />}
        <main className={hideNavPages ? 'min-h-screen' : 'pt-20 min-h-screen'}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RoleSelector />} />
              <Route path="/role-select" element={<RoleSelector />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/user-app" element={<UserApp />} />
              <Route path="/guest-dashboard" element={<UserApp />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/employee-notifications" element={<EmployeeNotificationPage />} />
              <Route path="/employee-notification" element={<EmployeeNotificationPage />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/map-selector" element={<MapSelector />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

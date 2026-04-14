import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mockDb } from '../services/firebase';
import { LogOut, Shield, Activity, Users, BarChart3, Plus, AlertTriangle, Clock, Zap, TrendingUp } from 'lucide-react';

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function AdminMapUpdater({ center }) {
  const map = useMap();
  const lat = center?.[0];
  const lng = center?.[1];

  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo(center, 13, { animate: true });
    }
  }, [lat, lng, map]);

  return null;
}

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [emergencies, setEmergencies] = useState([]);
  const [guests, setGuests] = useState([]);
  const [activeGuests, setActiveGuests] = useState([]);
  const [employees, setEmployees] = useState([
    { id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh@hotel.com', phone: '9876543210', floor: '3,4', department: 'Security', shiftTiming: 'Morning (6AM-2PM)', status: 'on-duty' },
    { id: 'EMP002', name: 'Priya Singh', email: 'priya@hotel.com', phone: '9876543211', floor: '2,3', department: 'Medical', shiftTiming: 'Afternoon (2PM-10PM)', status: 'on-duty' },
    { id: 'EMP003', name: 'Arjun Patel', email: 'arjun@hotel.com', phone: '9876543212', floor: '4,5', department: 'Fire Response', shiftTiming: 'Night (10PM-6AM)', status: 'off-duty' },
  ]);
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'analytics', 'guests', 'employees'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [dispatchSuccessId, setDispatchSuccessId] = useState(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    floor: '',
    department: 'Security',
    shiftTiming: 'Morning (6AM-2PM)',
    status: 'on-duty'
  });

  useEffect(() => {
    const unsub = mockDb.listenEmergencies((data) => {
      // Filter out resolved or arrived so they drop from the active queue immediately
      const activeEmergencies = data.filter(e => e.status !== 'resolved' && e.status !== 'arrived');
      
      // Sort so highest critical priority is on top
      const sorted = [...activeEmergencies].sort((a, b) => {
        const pMap = { 'CRITICAL': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      });
      setEmergencies(sorted);

      // Extract unique guests from incidents (using email as unique identifier)
      const guestMap = new Map();
      data.forEach(incident => {
        if (incident.guestData && incident.guestData.email) {
          const key = incident.guestData.email;
          if (!guestMap.has(key)) {
            guestMap.set(key, incident.guestData);
          }
        }
      });
      setGuests(Array.from(guestMap.values()));
    });
    return () => unsub();
  }, []);

  // Listen for active guest sessions in real-time
  useEffect(() => {
    const handleActiveSessions = () => {
      const activeSessions = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      setActiveGuests(Object.values(activeSessions));
    };

    handleActiveSessions();
    window.addEventListener('activeSessions:updated', handleActiveSessions);
    return () => window.removeEventListener('activeSessions:updated', handleActiveSessions);
  }, []);

  const mapCenter = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : emergencies.length > 0 && emergencies[0]?.location
      ? [emergencies[0].location.lat, emergencies[0].location.lng]
      : [28.6139, 77.2090];

  const handleDispatch = (id) => {
     mockDb.dispatchUnit(id);
     setDispatchSuccessId(id);
     setTimeout(() => setDispatchSuccessId(null), 3000); // clear success msg after 3s
  };

  const handleBulkDispatchCritical = () => {
    const criticalIncidents = emergencies.filter(e => e.priority === 'CRITICAL' && e.status === 'pending');
    if (criticalIncidents.length === 0) {
      alert('No pending CRITICAL incidents to dispatch');
      return;
    }
    
    if (window.confirm(`Dispatch all ${criticalIncidents.length} CRITICAL incident(s)?`)) {
      criticalIncidents.forEach(incident => {
        mockDb.dispatchUnit(incident.id);
      });
      setDispatchSuccessId('bulk');
      setTimeout(() => setDispatchSuccessId(null), 3000);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone) {
      alert('Please fill in all required fields');
      return;
    }
    const empId = 'EMP' + String(employees.length + 1).padStart(3, '0');
    setEmployees([...employees, { ...newEmployee, id: empId }]);
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      floor: '',
      department: 'Security',
      shiftTiming: 'Morning (6AM-2PM)',
      status: 'on-duty'
    });
    setShowAddEmployee(false);
  };

  const handleRemoveEmployee = (id) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleToggleEmployeeStatus = (id) => {
    setEmployees(employees.map(e => 
      e.id === id ? { ...e, status: e.status === 'on-duty' ? 'off-duty' : 'on-duty' } : e
    ));
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-indigo-300 shadow-lg">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
              A
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white text-slate-800">
      {/* Sidebar Queue or Analytics */}
      {activeTab === 'live' ? (
        <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-2xl shadow-indigo-900/5 relative">
          
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

          <div className="p-6 border-b border-slate-100 flex items-center justify-between relative z-10 bg-white/80 backdrop-blur-sm">
            <h2 className="text-2xl font-extrabold flex items-center gap-3 text-slate-900">
              <Shield className="text-indigo-500 w-8 h-8" /> Crisis Dispatch Queue
            </h2>
            <div className="flex gap-2 items-center flex-nowrap">
               {emergencies.filter(e => e.priority === 'CRITICAL' && e.status === 'pending').length > 0 && (
                 <button 
                   onClick={handleBulkDispatchCritical}
                   className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors border border-rose-700 animate-pulse whitespace-nowrap flex-shrink-0"
                   title={`Dispatch all ${emergencies.filter(e => e.priority === 'CRITICAL' && e.status === 'pending').length} CRITICAL incidents`}
                 >
                   Dispatch All CRITICAL
                 </button>
               )}
               <button 
                 onClick={() => mockDb.clearAll()} 
                 className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-200 whitespace-nowrap flex-shrink-0"
                 title="Clear all active mock emergencies"
               >
                 Clear Queue
               </button>
               <span className="bg-rose-500 text-white text-sm px-3 py-1 rounded-full font-black shadow-md shadow-rose-500/20 whitespace-nowrap flex-shrink-0">
                 {emergencies.length} Active
               </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-5 relative z-10">
            {emergencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Activity className="w-16 h-16 mb-4 opacity-50 text-indigo-300" />
                 <p className="font-bold text-lg">All clear. No active incidents.</p>
              </div>
            ) : (
              emergencies.map((em) => (
                <div 
                  key={em.id} 
                  onClick={() => setSelectedLocation(em.location)}
                  className={`p-5 rounded-2xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                    em.priority === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : 
                    em.priority === 'High' ? 'bg-amber-50 border-amber-200' : 
                    'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Score Indicator Background */}
                  {em.criticalScore && (
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br transform rotate-12 opacity-10 blur-xl ${em.priority === 'CRITICAL' ? 'from-rose-500 to-red-600' : 'from-indigo-500 to-blue-400'}" />
                  )}

                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <h3 className="font-black text-lg flex items-center gap-2 text-slate-800">
                      {em.priority === 'CRITICAL' && <AlertTriangle className="text-rose-500 w-5 h-5" />}
                      {em.type} Incident
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-md text-white shadow-sm ${
                        em.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}>
                        {em.priority}
                      </span>
                      {em.criticalScore && (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500"/> SCORE: {em.criticalScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-5 font-medium leading-relaxed clamp-2 line-clamp-2">"{em.details}"</p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200/60 pt-4 relative z-10">
                    <span className="flex items-center gap-1.5 font-semibold"><Clock className="w-4 h-4"/> Just now</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDispatch(em.id); }} 
                      disabled={em.status !== 'pending'}
                      className={`px-4 py-1.5 rounded-lg font-bold transition-all shadow-sm z-20 ${
                        dispatchSuccessId === em.id ? 'bg-emerald-500 text-white shadow-emerald-500/30' :
                        em.status === 'pending' ? 'bg-indigo-600 hover:bg-indigo-500 text-white animate-[pulse_1.5s_ease-in-out_infinite] hover:scale-105' : 
                        em.status === 'arrived' ? 'bg-emerald-100 text-emerald-700 shadow-none' : 'bg-slate-100 text-slate-500 shadow-none'
                      }`}
                    >
                      {dispatchSuccessId === em.id ? 'Team Assigned!' : em.status === 'pending' ? 'Assign Team' : (em.status === 'arrived' ? 'Team on Site' : 'Team En Route')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-2xl relative">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold flex items-center gap-3 text-slate-900">
              <TrendingUp className="text-indigo-500 w-8 h-8" /> Incident Analytics
            </h2>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
             <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm">
               <h3 className="font-extrabold text-slate-800 text-lg">Incident Hotspots (30d)</h3>
               <p className="text-sm text-slate-500 font-medium mt-1">Heatmap data showing high density hazard areas to inform authority planning.</p>
               <div className="mt-5 flex gap-4 text-xs font-bold text-slate-600">
                 <span className="flex gap-2 items-center"><div className="w-3 h-3 bg-rose-500 rounded-full shadow-sm"></div> Severe Risk</span>
                 <span className="flex gap-2 items-center"><div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div> Warning Area</span>
               </div>
             </div>
             
             <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm">
               <h3 className="font-extrabold text-slate-800 text-lg mb-4">Response Speed Metrics</h3>
               <div className="mt-4 flex justify-between items-center border-b border-slate-200 pb-3">
                 <span className="text-slate-600 font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> Avg. Medical</span>
                 <span className="text-emerald-500 font-black text-2xl">4.2m</span>
               </div>
               <div className="mt-3 flex justify-between items-center border-b border-slate-200 pb-3">
                 <span className="text-slate-600 font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-amber-500"/> Avg. Fire</span>
                 <span className="text-amber-500 font-black text-2xl">5.8m</span>
               </div>
               <div className="mt-3 flex justify-between items-center">
                 <span className="text-slate-600 font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-500"/> Avg. Security</span>
                 <span className="text-amber-500 font-black text-2xl">6.1m</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Operations View */}
      <div className="w-2/3 h-full relative bg-slate-100 p-6 overflow-hidden flex flex-col">
        <div className="flex gap-3 mb-6 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('live')} 
            className={`px-5 py-2.5 rounded-2xl font-bold transition-all shadow ${activeTab === 'live' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'}`}
          >
            Live Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`px-5 py-2.5 rounded-2xl font-bold transition-all shadow ${activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'}`}
          >
            Incident Analytics
          </button>
          <button 
            onClick={() => setActiveTab('guests')} 
            className={`px-5 py-2.5 rounded-2xl font-bold transition-all shadow flex items-center gap-2 ${activeTab === 'guests' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Guests
          </button>
          <button 
            onClick={() => setActiveTab('employees')} 
            className={`px-5 py-2.5 rounded-2xl font-bold transition-all shadow flex items-center gap-2 ${activeTab === 'employees' ? 'bg-amber-600 text-white' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Employees
          </button>
        </div>

        {activeTab === 'live' ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Map Tracker</p>
                <div className="flex gap-3 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Incident</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Responder</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white" style={{ position: 'relative', overflow: 'hidden' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  <AdminMapUpdater center={mapCenter} />
                  <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {emergencies.map((em) => (
                    <>
                      {em.location && (
                        <CircleMarker
                          center={[em.location.lat, em.location.lng]}
                          pathOptions={{
                            color: em.priority === 'CRITICAL' ? '#e11d48' : '#f59e0b',
                            fillColor: em.priority === 'CRITICAL' ? '#e11d48' : '#f59e0b',
                            fillOpacity: 0.8,
                          }}
                          radius={10}
                        >
                          <Popup>
                            <div className="text-slate-900">
                              <p className="font-bold">{em.type} • {em.priority}</p>
                              <p className="text-xs">Guest/Staff: {em.location.lat.toFixed(5)}, {em.location.lng.toFixed(5)}</p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      )}

                      {em.responderLocation && em.status !== 'arrived' && (
                        <>
                          <CircleMarker
                            center={[em.responderLocation.lat, em.responderLocation.lng]}
                            pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 1 }}
                            radius={7}
                          >
                            <Popup>Response Team En Route</Popup>
                          </CircleMarker>

                          {em.routeCoordinates ? (
                            <Polyline
                              positions={em.routeCoordinates.map(c => [c.lat, c.lng])}
                              pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.8 }}
                            />
                          ) : (
                            <Polyline
                              positions={[[em.responderLocation.lat, em.responderLocation.lng], [em.location.lat, em.location.lng]]}
                              pathOptions={{ color: '#4f46e5', dashArray: '8, 8', weight: 3, opacity: 0.6 }}
                            />
                          )}
                        </>
                      )}
                    </>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
            {/* Incident Analytics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Incident Analytics</p>
              <p className="text-slate-700 font-medium">Real-time metrics for active incidents in the system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border-2 border-rose-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-600"/> Active Incidents</p>
                <p className="text-4xl font-black text-rose-600 mb-3">{emergencies.length}</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold text-rose-600">Critical:</span> {emergencies.filter(e => e.priority === 'CRITICAL').length}</p>
                  <p className="text-slate-600"><span className="font-bold text-amber-600">High:</span> {emergencies.filter(e => e.priority === 'High').length}</p>
                  <p className="text-slate-600"><span className="font-bold text-yellow-600">Medium:</span> {emergencies.filter(e => e.priority === 'Medium').length}</p>
                  <p className="text-slate-600"><span className="font-bold text-blue-600">Low:</span> {emergencies.filter(e => e.priority === 'Low').length}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600"/> Incident Types</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold">Fire:</span> {emergencies.filter(e => e.type === 'Fire').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Medical:</span> {emergencies.filter(e => e.type === 'Medical').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Security Threat:</span> {emergencies.filter(e => e.type === 'Security Threat').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Natural Disaster:</span> {emergencies.filter(e => e.type === 'Natural Disaster').length}</p>
                </div>
              </div>
            </div>

            {/* Employee Analytics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Employee Analytics</p>
              <p className="text-slate-700 font-medium">Real-time workforce metrics and coverage analysis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total & Status */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-amber-600"/> Workforce Status</p>
                <div className="space-y-2">
                  <p className="text-3xl font-black text-amber-600 mb-2">{employees.length} Total</p>
                  <p className="text-slate-600"><span className="font-bold text-emerald-600">🟢 On Duty:</span> {employees.filter(e => e.status === 'on-duty').length}</p>
                  <p className="text-slate-600"><span className="font-bold text-slate-600">🔴 Off Duty:</span> {employees.filter(e => e.status === 'off-duty').length}</p>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-600"/> By Department</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold">Security:</span> {employees.filter(e => e.department === 'Security').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Medical:</span> {employees.filter(e => e.department === 'Medical').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Fire Response:</span> {employees.filter(e => e.department === 'Fire Response').length}</p>
                  <p className="text-slate-600"><span className="font-bold">General Staff:</span> {employees.filter(e => e.department === 'General Staff').length}</p>
                </div>
              </div>

              {/* Shift Distribution */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600"/> By Shift</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold">🌅 Morning (6AM-2PM):</span> {employees.filter(e => e.shiftTiming === 'Morning (6AM-2PM)').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Afternoon (2PM-10PM):</span> {employees.filter(e => e.shiftTiming === 'Afternoon (2PM-10PM)').length}</p>
                  <p className="text-slate-600"><span className="font-bold">🌙 Night (10PM-6AM):</span> {employees.filter(e => e.shiftTiming === 'Night (10PM-6AM)').length}</p>
                </div>
              </div>

              {/* On-Duty by Department */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600"/> On-Duty Coverage</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><span className="font-bold">Security:</span> {employees.filter(e => e.department === 'Security' && e.status === 'on-duty').length}/{employees.filter(e => e.department === 'Security').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Medical:</span> {employees.filter(e => e.department === 'Medical' && e.status === 'on-duty').length}/{employees.filter(e => e.department === 'Medical').length}</p>
                  <p className="text-slate-600"><span className="font-bold">Fire Response:</span> {employees.filter(e => e.department === 'Fire Response' && e.status === 'on-duty').length}/{employees.filter(e => e.department === 'Fire Response').length}</p>
                </div>
              </div>

              {/* Coverage Efficiency */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 p-5 shadow-sm">
                <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-600"/> Efficiency Metrics</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Coverage Rate</p>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{width: `${(employees.filter(e => e.status === 'on-duty').length / employees.length) * 100 || 0}%`}}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{Math.round((employees.filter(e => e.status === 'on-duty').length / employees.length) * 100 || 0)}% Active</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Avg. Employees/Shift</p>
                    <p className="text-2xl font-black text-yellow-600">{Math.round(employees.length / 3 || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'guests' ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4">
            {/* Currently Active Guests */}
            {activeGuests.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">🟢 Currently Active Guests ({activeGuests.length})</h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem('activeSessions');
                      window.dispatchEvent(new Event('activeSessions:updated'));
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-4">
                  {activeGuests.map((guest, idx) => (
                    <div key={idx} className="p-5 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 rounded-xl border-2 border-emerald-300 shadow-md">
                      {/* Header: Name and Room */}
                      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-emerald-300">
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Name</p>
                          <p className="text-2xl font-black text-slate-900">{guest.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Room</p>
                          <p className="text-2xl font-black text-emerald-600">{guest.room}</p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Email</p>
                          <p className="font-semibold text-slate-800 break-words">{guest.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Phone</p>
                          <p className="font-semibold text-slate-800">{guest.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Floor</p>
                          <p className="font-semibold text-slate-800">{guest.floor}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Registered Guests (from incidents) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">All Registered Guests (Incident History)</h3>
              {guests.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No guests have created incidents yet</p>
              ) : (
                <div className="space-y-4">
                  {guests.map((guest, idx) => (
                    <div key={idx} className="p-5 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-xl border-2 border-blue-200 shadow-md">
                      {/* Header: Name and Room */}
                      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-blue-200">
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Name</p>
                          <p className="text-2xl font-black text-slate-900">{guest.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Room</p>
                          <p className="text-2xl font-black text-blue-600">{guest.room}</p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b-2 border-blue-200 text-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Email</p>
                          <p className="font-semibold text-slate-800 break-words">{guest.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Phone</p>
                          <p className="font-semibold text-slate-800">{guest.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase">Floor</p>
                          <p className="font-semibold text-slate-800">{guest.floor}</p>
                        </div>
                      </div>

                      {/* Medical Conditions */}
                      {guest.diseases && guest.diseases.length > 0 ? (
                        <div className="mb-4 p-3 bg-red-100 rounded-lg border-2 border-red-300">
                          <p className="text-sm font-black text-red-700 mb-2">Medical Conditions:</p>
                          <div className="flex flex-wrap gap-2">
                            {guest.diseases.map(d => (
                              <span key={d} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold shadow-md">{d}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-green-100 rounded-lg border-2 border-green-300">
                          <p className="text-sm font-black text-green-700">Medical Conditions: None Reported</p>
                        </div>
                      )}

                      {/* Medical Details */}
                      {guest.medicalInfo && (
                        <div className="mb-4 p-3 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                          <p className="text-sm font-black text-yellow-800 mb-2">Medical Details:</p>
                          <p className="text-sm text-yellow-900 font-semibold">{guest.medicalInfo}</p>
                        </div>
                      )}

                      {/* Emergency Contact */}
                      {guest.emergencyContact && (
                        <div className="p-3 bg-amber-100 rounded-lg border-2 border-amber-300">
                          <p className="text-sm font-black text-amber-800 mb-2">Emergency Contact:</p>
                          <p className="text-sm font-bold text-amber-900">{guest.emergencyContact}</p>
                          <p className="text-sm font-bold text-amber-900">{guest.emergencyContactPhone}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'employees' ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Employee Status Overview (Read-Only)</h3>
                <p className="text-sm text-slate-600 mt-2">Note: Employee management is handled by the Manager Dashboard for operational control.</p>
              </div>

              <div className="space-y-3">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border-2 border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase">ID</p>
                        <p className="font-black text-slate-900">{emp.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Name</p>
                        <p className="font-black text-slate-900">{emp.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Department</p>
                        <p className="font-black text-blue-700">{emp.department}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Shift</p>
                        <p className="font-semibold text-slate-800">{emp.shiftTiming}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase">Status</p>
                        <p className={`font-black text-lg ${emp.status === 'on-duty' ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {emp.status === 'on-duty' ? '🟢 On Duty' : '🔴 Off Duty'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm border-t border-slate-200 pt-3">
                      <div>
                        <p className="text-xs font-bold text-slate-600">Email</p>
                        <p className="font-semibold text-slate-800 break-words">{emp.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Phone</p>
                        <p className="font-semibold text-slate-800">{emp.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Assigned Floors</p>
                        <p className="font-semibold text-slate-800">{emp.floor || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Join Date</p>
                        <p className="font-semibold text-slate-800">{emp.joinDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold">To add, edit, or remove employees, use the Manager Dashboard</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Analytics Summary</p>
              <p className="text-slate-700 font-medium">Hotspot and route map views are disabled. Metrics continue to update from live incident data.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-slate-800 font-bold mb-2">Total Active Incidents: {emergencies.length}</p>
              <p className="text-slate-600">Critical: {emergencies.filter(e => e.priority === 'CRITICAL').length}</p>
              <p className="text-slate-600">High: {emergencies.filter(e => e.priority === 'High').length}</p>
              <p className="text-slate-600">Other: {emergencies.filter(e => e.priority !== 'CRITICAL' && e.priority !== 'High').length}</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

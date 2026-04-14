import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertCircle, CheckCircle, Users, BarChart3, Plus } from 'lucide-react';

import { mockDb } from '../services/firebase';

// Mock employee database
const mockEmployees = [
  { id: '1', name: 'John Smith', employeeId: 'EMP001', floor: '1,2', status: 'active', joinDate: '2024-01-15', department: 'Security', shiftTiming: 'Morning (6AM-2PM)', phone: '9876543210', email: 'john@hotel.com' },
  { id: '2', name: 'Sarah Johnson', employeeId: 'EMP002', floor: '3,4', status: 'active', joinDate: '2024-02-20', department: 'Medical', shiftTiming: 'Afternoon (2PM-10PM)', phone: '9876543211', email: 'sarah@hotel.com' },
  { id: '3', name: 'Mike Davis', employeeId: 'EMP003', floor: '2,3', status: 'active', joinDate: '2024-01-10', department: 'Fire Response', shiftTiming: 'Night (10PM-6AM)', phone: '9876543212', email: 'mike@hotel.com' },
  { id: '4', name: 'Emma Wilson', employeeId: 'EMP004', floor: '1', status: 'active', joinDate: '2024-03-05', department: 'General Staff', shiftTiming: 'Morning (6AM-2PM)', phone: '9876543213', email: 'emma@hotel.com' },
  { id: '5', name: 'Alex Brown', employeeId: 'EMP005', floor: '4,5', status: 'off-duty', joinDate: '2024-01-20', department: 'Security', shiftTiming: 'Night (10PM-6AM)', phone: '9876543214', email: 'alex@hotel.com' }
];

export default function ManagerDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [employees, setEmployees] = useState(mockEmployees);
  const [activeTab, setActiveTab] = useState('incidents'); // incidents, employees, guests, analytics
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [assigningEmployee, setAssigningEmployee] = useState(null);
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [newIncident, setNewIncident] = useState({
    type: 'Fire',
    details: '',
    floor: '',
    room: '',
    priority: 'High'
  });
  const [showStatusFilter, setShowStatusFilter] = useState(true);

  // Redirect if not manager
  useEffect(() => {
    if (role !== 'manager') {
      navigate('/');
    }
  }, [role, navigate]);

  // Listen to all incidents
  useEffect(() => {
    const unsub = mockDb.listenEmergencies((data) => {
      setIncidents(data.sort((a, b) => {
        const pMap = { 'CRITICAL': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }));
    });
    return () => unsub();
  }, []);

  const handleAssignEmployee = (incidentId, employeeId) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      const updatedIncident = {
        ...incident,
        assignedEmployeeId: employeeId,
        assignedEmployee: employees.find(e => e.id === employeeId)?.name,
        status: 'assigned'
      };
      mockDb.updateEmergencyStatus(incidentId, 'assigned');
      setAssigningEmployee(null);
      setSelectedIncident(null);
    }
  };

  const handleLogIncident = () => {
    if (!newIncident.type || !newIncident.details || !newIncident.floor) {
      alert('Please fill in type, details, and floor');
      return;
    }
    
    const incident = {
      id: 'INC_' + Date.now(),
      type: newIncident.type,
      details: newIncident.details,
      description: newIncident.details,
      floor: newIncident.floor,
      room: newIncident.room || 'N/A',
      priority: newIncident.priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      location: { lat: 28.6139 + Math.random() * 0.01, lng: 77.209 + Math.random() * 0.01 },
      createdBy: user?.name || 'Manager'
    };
    
    mockDb.createEmergency(incident);
    setNewIncident({ type: 'Fire', details: '', floor: '', room: '', priority: 'High' });
    setShowCreateIncident(false);
  };

  // Get employees with matching floors for assignment
  const getEmployeesForFloor = (incidentFloor) => {
    if (!incidentFloor) return employees.filter(e => e.status === 'active');
    
    const floorNum = incidentFloor.toString();
    return employees.filter(e => {
      const empFloors = e.floor.split(',').map(f => f.trim());
      return e.status === 'active' && empFloors.includes(floorNum);
    });
  };

  // Get all on-duty employees
  const onDutyEmployees = employees.filter(e => e.status === 'active');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate stats
  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'arrived').length;
  const resolvedToday = incidents.filter(i => i.status === 'resolved').length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const guestCount = incidents.filter(i => i.guestData).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-emerald-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-black text-lg">

            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Manager Command Center</h1>
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

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Active Incidents</p>
                <p className="text-4xl font-black text-rose-600 mt-2">{activeIncidents}</p>
              </div>
              <AlertCircle className="w-14 h-14 text-rose-300 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Resolved Today</p>
                <p className="text-4xl font-black text-amber-600 mt-2">{resolvedToday}</p>
              </div>
              <CheckCircle className="w-14 h-14 text-amber-300 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-cyan-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Active Staff</p>
                <p className="text-4xl font-black text-cyan-600 mt-2">{activeEmployees}/{employees.length}</p>
              </div>
              <Users className="w-14 h-14 text-cyan-300 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Guests in System</p>
                <p className="text-4xl font-black text-purple-600 mt-2">{guestCount}</p>
              </div>
              <BarChart3 className="w-14 h-14 text-purple-300 opacity-50" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['incidents', 'employees', 'guests', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-emerald-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Crisis Response Queue</h2>
              <button
                onClick={() => setShowCreateIncident(!showCreateIncident)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Log Incident
              </button>
            </div>

            {/* Create Incident Form */}
            {showCreateIncident && (
              <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                <h3 className="font-bold text-slate-900 mb-4">Log New Incident</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <select
                    value={newIncident.type}
                    onChange={(e) => setNewIncident({...newIncident, type: e.target.value})}
                    className="px-3 py-2 border border-emerald-300 rounded font-semibold text-sm"
                  >
                    <option>Fire</option>
                    <option>Medical</option>
                    <option>Security Threat</option>
                    <option>Natural Disaster</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Floor"
                    value={newIncident.floor}
                    onChange={(e) => setNewIncident({...newIncident, floor: e.target.value})}
                    className="px-3 py-2 border border-emerald-300 rounded font-semibold text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Room (optional)"
                    value={newIncident.room}
                    onChange={(e) => setNewIncident({...newIncident, room: e.target.value})}
                    className="px-3 py-2 border border-emerald-300 rounded font-semibold text-sm"
                  />
                </div>
                <textarea
                  placeholder="Incident Details"
                  value={newIncident.details}
                  onChange={(e) => setNewIncident({...newIncident, details: e.target.value})}
                  className="w-full px-3 py-2 border border-emerald-300 rounded font-semibold text-sm mb-3"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleLogIncident}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Log Incident
                  </button>
                  <button
                    onClick={() => setShowCreateIncident(false)}
                    className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-bold text-lg">No active incidents</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      incident.priority === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-300'
                        : incident.priority === 'High'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-50 border-slate-300'
                    }`}
                    onClick={() => setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-slate-900">{incident.type} Incident</h3>
                          <span className={`text-xs font-black px-3 py-1 rounded-md text-white ${
                            incident.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}>
                            {incident.priority}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            incident.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            incident.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            incident.status === 'arrived' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">{incident.details}</p>
                      </div>
                    </div>

                    {/* Guest Information */}
                    {incident.guestData && (
                      <div className="bg-white/70 rounded-lg p-4 mb-4 border border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-slate-600 font-bold uppercase">Guest Name</p>
                            <p className="font-black text-slate-900">{incident.guestData.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-bold uppercase">Room</p>
                            <p className="font-black text-slate-900">{incident.guestData.room}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-bold uppercase">Contact</p>
                            <p className="font-black text-slate-900">{incident.guestData.emergencyContactPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 font-bold uppercase">Floor</p>
                            <p className="font-black text-slate-900">{incident.guestData.floor}</p>
                          </div>
                        </div>
                        
                        {/* Diseases/Medical Conditions */}
                        {incident.guestData.diseases && incident.guestData.diseases.length > 0 && (
                          <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg">
                            <p className="text-xs text-rose-900 font-bold uppercase mb-2">Medical Conditions</p>
                            <div className="flex flex-wrap gap-2">
                              {incident.guestData.diseases.map((disease) => (
                                <span key={disease} className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-bold">
                                  {disease}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Medical Info */}
                        {incident.guestData.medicalInfo && (
                          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <p className="text-xs text-yellow-900 font-bold uppercase mb-1">Medical Details</p>
                            <p className="text-sm text-yellow-900 font-medium">{incident.guestData.medicalInfo}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Section */}
                    {selectedIncident?.id === incident.id && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="mb-3">
                          <p className="font-bold text-slate-900 mb-2">Assign Staff to This Incident (Floor {incident.floor || incident.guestData?.floor || 'N/A'}):</p>
                          {incident.floor || incident.guestData?.floor ? (
                            <p className="text-xs text-blue-700 font-semibold mb-3">
                              ⭐ Suggested staff with matching floors are highlighted
                            </p>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {employees
                            .filter(e => e.status === 'active')
                            .map((emp) => {
                              const empFloors = emp.floor.split(',').map(f => f.trim());
                              const isFloorMatch = incident.floor ? empFloors.includes(incident.floor.toString()) : 
                                                  incident.guestData?.floor ? empFloors.includes(incident.guestData.floor.toString()) : false;
                              return (
                                <button
                                  key={emp.id}
                                  onClick={() => handleAssignEmployee(incident.id, emp.id)}
                                  className={`p-3 rounded-lg hover:shadow-md transition-all text-center border-2 ${
                                    isFloorMatch 
                                      ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400' 
                                      : 'bg-white border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  <p className="font-bold text-sm text-slate-900">{emp.name}</p>
                                  <p className={`text-xs ${isFloorMatch ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                                    Floor {emp.floor}
                                  </p>
                                  <p className="text-xs text-slate-500">{emp.department}</p>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Staff Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-4 font-black text-slate-900">Name</th>
                    <th className="text-left p-4 font-black text-slate-900">Employee ID</th>
                    <th className="text-left p-4 font-black text-slate-900">Department</th>
                    <th className="text-left p-4 font-black text-slate-900">Floors</th>
                    <th className="text-left p-4 font-black text-slate-900">Shift</th>
                    <th className="text-left p-4 font-black text-slate-900">Contact</th>
                    <th className="text-left p-4 font-black text-slate-900">Status</th>
                    <th className="text-left p-4 font-black text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-4 text-slate-700">{emp.employeeId}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                          {emp.department}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                          {emp.floor}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700">{emp.shiftTiming}</td>
                      <td className="p-4 text-sm font-bold">
                        <div className="text-slate-900">{emp.phone}</div>
                        <div className="text-slate-600 text-xs">{emp.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          emp.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Guests in System</h2>
            <div className="space-y-4">
              {incidents
                .filter(i => i.guestData)
                .map((incident) => (
                  <div key={incident.id} className="p-6 border-2 border-slate-200 rounded-xl hover:border-slate-400 transition-colors">
                    {/* Guest Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <div className="border-r border-slate-200 pr-4">
                        <p className="text-xs text-slate-600 font-bold uppercase">Name</p>
                        <p className="text-lg font-black text-slate-900">{incident.guestData.name}</p>
                      </div>
                      <div className="border-r border-slate-200 pr-4">
                        <p className="text-xs text-slate-600 font-bold uppercase">Room</p>
                        <p className="text-lg font-black text-slate-900">{incident.guestData.room}</p>
                      </div>
                      <div className="border-r border-slate-200 pr-4">
                        <p className="text-xs text-slate-600 font-bold uppercase">Floor</p>
                        <p className="text-lg font-black text-slate-900">{incident.guestData.floor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 font-bold uppercase">Phone</p>
                        <p className="text-lg font-black text-slate-900">{incident.guestData.phone}</p>
                      </div>
                    </div>

                    {/* Contact & Medical Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Emergency Contact */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-900 font-bold uppercase mb-2">Emergency Contact</p>
                        <p className="font-black text-amber-900">{incident.guestData.emergencyContact || 'N/A'}</p>
                        <p className="text-sm text-amber-800 font-bold">{incident.guestData.emergencyContactPhone || 'N/A'}</p>
                      </div>

                      {/* Medical Conditions */}
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="text-xs text-rose-900 font-bold uppercase mb-2">Medical Conditions</p>
                        {incident.guestData.diseases && incident.guestData.diseases.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {incident.guestData.diseases.map((disease) => (
                              <span key={disease} className="px-2 py-1 bg-rose-200 text-rose-900 rounded text-xs font-bold">
                                {disease}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-rose-800 font-bold">None reported</p>
                        )}
                      </div>
                    </div>

                    {/* Medical Info Details */}
                    {incident.guestData.medicalInfo && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-900 font-bold uppercase mb-2">Medical Details</p>
                        <p className="text-sm text-yellow-900 font-medium">{incident.guestData.medicalInfo}</p>
                      </div>
                    )}

                    {/* Email */}
                    <div className="mt-4 p-3 bg-slate-100 rounded-lg text-sm text-slate-700 font-bold">
                      Email: {incident.guestData.email || 'N/A'}
                    </div>
                  </div>
                ))}
              {incidents.filter(i => i.guestData).length === 0 && (
                <p className="text-center text-slate-500 py-8">No guests with incidents</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
              <h3 className="text-xl font-black text-slate-900 mb-4">Incidents by Type</h3>
              <div className="space-y-3">
                {['Fire', 'Medical', 'Security Threat', 'Natural Disaster'].map((type) => {
                  const count = incidents.filter(i => i.type === type).length;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{type}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-black">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
              <h3 className="text-xl font-black text-slate-900 mb-4">Response Time</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Avg. Fire Response</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black">4.2m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Avg. Medical Response</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black">3.8m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Avg. Security Response</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black">5.1m</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

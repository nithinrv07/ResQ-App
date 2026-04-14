import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Bell, LogOut, CheckCircle, Zap, User, Phone, MapPin } from 'lucide-react';

import { mockDb } from '../services/firebase';

export default function EmployeeNotificationPage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [resolvedEmergencies, setResolvedEmergencies] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [responseNotes, setResponseNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [eta, setEta] = useState({});

  // Redirect if not employee
  useEffect(() => {
    if (role !== 'employee') {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    // Listen to emergencies in real-time
    const unsub = mockDb.listenEmergencies((data) => {
      const active = data
        .filter(e => e.status !== 'resolved')
        .sort((a, b) => {
          const pMap = { 'CRITICAL': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
          return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
        });

      const resolved = data
        .filter(e => e.status === 'resolved')
        .slice(-5);

      setEmergencies(active);
      setResolvedEmergencies(resolved);
      setUnreadCount(active.length);
    });

    return () => unsub();
  }, []);

  const handleAcknowledge = (emergencyId) => {
    const emergency = emergencies.find(e => e.id === emergencyId);
    if (emergency) {
      mockDb.updateEmergencyStatus(emergencyId, 'acknowledged');
    }
  };

  const handleEnRoute = (emergencyId) => {
    mockDb.updateEmergencyStatus(emergencyId, 'en-route');
  };

  const handleResolve = (emergencyId) => {
    mockDb.updateEmergencyStatus(emergencyId, 'resolved');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
      case 'High':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Medium':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-red-500 text-white';
      case 'acknowledged':
        return 'bg-yellow-500 text-white';
      case 'en-route':
        return 'bg-blue-500 text-white';
      case 'resolved':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Emergency Notifications</h1>
            <p className="text-slate-600">Employee: <span className="font-bold text-slate-900">{user?.name}</span></p>
            <p className="text-slate-500 text-sm">Employee ID: {user?.employeeId}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Active Emergencies</p>
                <p className="text-3xl font-bold">{emergencies.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-yellow-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Unread Notifications</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
              <Bell className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Resolved Today</p>
                <p className="text-3xl font-bold">{resolvedEmergencies.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Response Rate</p>
                <p className="text-3xl font-bold">100%</p>
              </div>
              <Zap className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>

        {/* Active Emergencies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Active Emergencies ({emergencies.length})
          </h2>
          {emergencies.length === 0 ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600">No active emergencies at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencies.map((emergency) => (
                <div
                  key={emergency.id}
                  className="bg-slate-800 rounded-lg p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getPriorityIcon(emergency.priority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">{emergency.type}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(emergency.priority)}`}>
                              {emergency.priority}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(emergency.status)} uppercase`}>
                              {emergency.status}
                            </span>
                          </div>
                          <p className="text-slate-300 mb-4">{emergency.description}</p>

                          {/* Guest Details Box - Full Width Extended */}
                          <div className="bg-slate-700 rounded-lg p-4 mb-4 border border-slate-600 w-full">
                            <p className="text-slate-300 font-bold mb-4 text-sm uppercase tracking-wide">Guest Information</p>
                            <div className="grid grid-cols-4 gap-3">
                              {/* Room Number - Highlighted */}
                              <div className="bg-red-900 bg-opacity-50 p-3 rounded-lg border border-red-700 flex flex-col justify-center">
                                <p className="text-slate-200 text-xs font-bold uppercase">Room</p>
                                <p className="text-white font-bold text-2xl mt-2">#{emergency.room}</p>
                              </div>

                              {/* Floor */}
                              <div className="p-3 rounded-lg bg-slate-600 flex flex-col justify-center">
                                <p className="text-slate-200 text-xs font-bold uppercase">Floor</p>
                                <p className="text-white font-bold text-2xl mt-2">{emergency.floor}</p>
                              </div>

                              {/* Guest Name */}
                              <div className="p-3 rounded-lg bg-slate-600 flex flex-col justify-center">
                                <p className="text-slate-200 text-xs font-bold uppercase flex items-center gap-1">
                                  <User className="w-3 h-3" /> Name
                                </p>
                                <p className="text-white font-bold text-sm mt-2 truncate">{emergency.guestName || 'N/A'}</p>
                              </div>

                              {/* Guest Phone */}
                              <div className="p-3 rounded-lg bg-slate-600 flex flex-col justify-center">
                                <p className="text-slate-200 text-xs font-bold uppercase flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Phone
                                </p>
                                <p className="text-white font-bold text-sm mt-2">{emergency.guestPhone || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          {emergency.additionalInfo && (
                            <div className="bg-slate-700 rounded-lg p-3 mb-4 border border-slate-600">
                              <p className="text-slate-300 text-sm"><span className="font-bold">Details:</span> {emergency.additionalInfo}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 md:w-full">
                      {/* Response Notes & ETA Section */}
                      {(emergency.status === 'acknowledged' || emergency.status === 'en-route') && (
                        <div className="bg-slate-700 rounded-lg p-3 border border-slate-600 mb-2">
                          <div className="mb-2">
                            <label className="text-slate-300 text-xs font-bold block mb-2">📝 Response Notes</label>
                            <textarea
                              value={responseNotes[emergency.id] || ''}
                              onChange={(e) => setResponseNotes({...responseNotes, [emergency.id]: e.target.value})}
                              placeholder="Document your response (First aid applied, ambulance called, etc.)"
                              className="w-full px-3 py-2 bg-slate-600 text-white text-sm rounded border border-slate-500 focus:outline-none focus:border-blue-400"
                              rows="2"
                            />
                          </div>
                          <div className="mb-2">
                            <label className="text-slate-300 text-xs font-bold block mb-2">ETA (minutes)</label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={eta[emergency.id] || ''}
                              onChange={(e) => setEta({...eta, [emergency.id]: e.target.value})}
                              placeholder="Estimated time to arrival"
                              className="w-full px-3 py-2 bg-slate-600 text-white text-sm rounded border border-slate-500 focus:outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>
                      )}

                      {emergency.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(emergency.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(emergency.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {emergency.status === 'acknowledged' && (
                        <>
                          <button
                            onClick={() => handleEnRoute(emergency.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            En Route
                          </button>
                          <button
                            onClick={() => handleResolve(emergency.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                      {emergency.status === 'en-route' && (
                        <>
                          <button
                            disabled
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            En Route
                          </button>
                          <button
                            onClick={() => handleResolve(emergency.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                      {emergency.status === 'resolved' && (
                        <button disabled className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg opacity-50">
                          Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Emergencies */}
        {resolvedEmergencies.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Recently Resolved
            </h3>
            <div className="space-y-3">
              {resolvedEmergencies.map((emergency) => (
                <div key={emergency.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-white font-bold">{emergency.type}</p>
                        <p className="text-slate-400 text-sm">Room #{emergency.room} - Floor {emergency.floor}</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">
                      {new Date(emergency.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

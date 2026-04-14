import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Map, AlertCircle, CheckCircle, Zap, Clock } from 'lucide-react';

import { mockDb } from '../services/firebase';

export default function EmployeeDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Redirect if not employee
  useEffect(() => {
    if (role !== 'employee') {
      navigate('/');
    }
  }, [role, navigate]);

  useEffect(() => {
    // Listen to emergencies and filter by assigned floor
    const unsub = mockDb.listenEmergencies((data) => {
      // Filter incidents from employee's assigned floor
      const filterByFloor = (em) => {
        if (!user?.floor) return false;
        const userFloors = user.floor.split(',').map(f => f.trim());
        return userFloors.some(f => f === em.floor?.toString()) || em.floor === user.floor;
      };

      const active = data
        .filter(e => e.status !== 'resolved' && filterByFloor(e))
        .sort((a, b) => {
          const pMap = { 'CRITICAL': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
          return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
        });

      const completed = data
        .filter(e => e.status === 'resolved' && filterByFloor(e))
        .slice(-5);

      setAssignments(active);
      setCompletedTasks(completed);
    });

    return () => unsub();
  }, [user?.floor]);

  const handleCompleteTask = (id) => {
    mockDb.updateEmergencyStatus(id, 'resolved');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-amber-200 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              E{user?.employeeId?.slice(-2)}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Employee Portal</h1>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Assigned Floor</p>
                <p className="text-3xl font-black text-amber-600 mt-2">Floor {user?.floor || 'N/A'}</p>
              </div>
              <Map className="w-12 h-12 text-amber-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Active Tasks</p>
                <p className="text-3xl font-black text-rose-600 mt-2">{assignments.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-rose-400 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-bold uppercase">Completed Today</p>
                <p className="text-3xl font-black text-emerald-600 mt-2">{completedTasks.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Active Assignments</h2>
          
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CheckCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-bold text-lg">No active tasks for your floor</p>
              <p className="text-sm">Check back for new assignments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((task) => (
                <div
                  key={task.id}
                  className={`p-6 rounded-xl border-2 overflow-hidden ${
                    task.priority === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-300'
                      : task.priority === 'High'
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900">{task.type} Incident</h3>
                        <span className={`text-xs font-black px-3 py-1 rounded-md text-white ${
                          task.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{task.details}</p>
                    </div>
                    <Zap className={`w-8 h-8 ${task.priority === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white/50 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase">Room</p>
                      <p className="text-lg font-black text-slate-900">{task.guestData?.room || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase">Guest Name</p>
                      <p className="text-lg font-black text-slate-900">{task.guestData?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase">Floor</p>
                      <p className="text-lg font-black text-slate-900">{task.floor || 'N/A'}</p>
                    </div>
                  </div>

                  {task.guestData?.medicalInfo && (
                    <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                      <p className="text-xs text-yellow-900 font-bold uppercase mb-1">Medical Notes:</p>
                      <p className="text-sm text-yellow-900 font-medium">{task.guestData.medicalInfo}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold">Just reported</span>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Recent Completed Tasks</h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">{task.type} - Room {task.guestData?.room}</p>
                      <p className="text-xs text-slate-600">{task.guestData?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 uppercase">Resolved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

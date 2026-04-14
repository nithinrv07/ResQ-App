import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, AlertCircle } from 'lucide-react';


export default function StaffPage() {
  const navigate = useNavigate();
  const { user, role, logout, switchRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  // Redirect if not staff
  useEffect(() => {
    if (role !== 'staff') {
      navigate('/');
    }
  }, [role, navigate]);

  const handleRoleSelect = (selectedRole) => {
    setSelectedRole(selectedRole);
    switchRole(selectedRole);
    
    // Navigate to appropriate dashboard
    if (selectedRole === 'admin') {
      navigate('/admin');
    } else if (selectedRole === 'manager') {
      navigate('/manager');
    } else if (selectedRole === 'employee') {
      navigate('/employee-notification');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine which roles the user logged in with
  const accessRoles = user?.accessRole ? [user.accessRole] : [];

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Staff Portal</h1>
          <p className="text-slate-600">Welcome, <span className="font-bold text-slate-900">{user?.name}</span></p>
          <p className="text-slate-500 text-sm">Employee ID: {user?.employeeId}</p>
          <div className="mt-3 inline-block bg-blue-600 px-4 py-2 rounded-lg">
            <p className="text-white font-bold text-sm">Logged in as: <span className="uppercase">{accessRoles[0]}</span></p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Admin Role */}
          {accessRoles.includes('admin') && (
            <button
              onClick={() => handleRoleSelect('admin')}
              disabled={selectedRole === 'admin'}
              className="group relative bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 disabled:scale-100 disabled:opacity-75"
            >
              <div className="flex flex-col items-center gap-4">
                <Shield className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold mb-1">Admin</h3>
                  <p className="text-red-100 text-sm">Full system control & monitoring</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-red-500 border-opacity-30">
                <p className="text-xs text-red-100">Click to access admin dashboard</p>
              </div>
              {selectedRole === 'admin' && (
                <div className="absolute inset-0 rounded-xl bg-red-500 opacity-20"></div>
              )}
            </button>
          )}

          {/* Manager Role */}
          {accessRoles.includes('manager') && (
            <button
              onClick={() => handleRoleSelect('manager')}
              disabled={selectedRole === 'manager'}
              className="group relative bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 disabled:scale-100 disabled:opacity-75"
            >
              <div className="flex flex-col items-center gap-4">
                <Users className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold mb-1">Manager</h3>
                  <p className="text-yellow-100 text-sm">Team & response coordination</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-yellow-500 border-opacity-30">
                <p className="text-xs text-yellow-100">Click to access manager dashboard</p>
              </div>
              {selectedRole === 'manager' && (
                <div className="absolute inset-0 rounded-xl bg-yellow-500 opacity-20"></div>
              )}
            </button>
          )}

          {/* Employee Role */}
          {accessRoles.includes('employee') && (
            <button
              onClick={() => handleRoleSelect('employee')}
              disabled={selectedRole === 'employee'}
              className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 disabled:scale-100 disabled:opacity-75"
            >
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="w-12 h-12" />
                <div>
                  <h3 className="text-2xl font-bold mb-1">Employee</h3>
                  <p className="text-blue-100 text-sm">Emergency notifications & alerts</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500 border-opacity-30">
                <p className="text-xs text-blue-100">Click to view notifications</p>
              </div>
              {selectedRole === 'employee' && (
                <div className="absolute inset-0 rounded-xl bg-blue-500 opacity-20"></div>
              )}
            </button>
          )}
        </div>

        {/* No Access Message */}
        {accessRoles.length === 0 && (
          <div className="bg-red-600 rounded-lg p-6 text-white text-center mb-8">
            <p className="font-bold text-lg">No authorized roles for this account</p>
            <p className="text-red-100">Contact your administrator for access</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h3 className="text-white font-bold mb-2">Your Access Level</h3>
          <p className="text-slate-300">
            {accessRoles.length > 0 
              ? `You have been granted access to the ${accessRoles.join(', ').toUpperCase()} role(s). Select above to continue.`
              : 'No roles assigned to this account.'}
          </p>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

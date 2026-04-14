import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authenticateUser = (username, password) => {
    const validUsers = {
      'emp001': { role: 'employee', name: 'Employee User', password: '123456' },
      'mng001': { role: 'manager', name: 'Manager User', password: '123456' },
      'adm001': { role: 'admin', name: 'Admin User', password: '123456' }
    };

    const user = validUsers[username.toLowerCase()];
    
    if (!user) {
      return { success: false, message: 'Invalid username. Use emp001, mng001, or adm001' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, user };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const authResult = authenticateUser(formData.username, formData.password);
      
      if (!authResult.success) {
        setError(authResult.message);
        setIsLoading(false);
        return;
      }

      const userData = {
        employeeId: formData.username,
        name: authResult.user.name,
        role: authResult.user.role
      };

      login(userData, authResult.user.role);
      
      if (authResult.user.role === 'employee') {
        navigate('/employee-notifications');
      } else if (authResult.user.role === 'manager') {
        navigate('/manager-dashboard');
      } else if (authResult.user.role === 'admin') {
        navigate('/admin-dashboard');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white rounded-2xl p-8 inline-block">
            <img src="/resq-logo.png" alt="ResQ" className="w-80 h-40" />
          </div>
          <p className="text-slate-600 text-lg mt-6">Staff Login</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Staff Authentication</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="emp001, mng001, or adm001"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-bold text-white text-lg transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-sm mt-4">
            Test credentials: emp001, mng001, or adm001 with password 123456
          </p>
        </div>
      </div>
    </div>
  );
}

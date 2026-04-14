import { useNavigate } from 'react-router-dom';


export default function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white rounded-2xl p-8 inline-block">
            <img src="/resq-logo.png" alt="ResQ" className="w-80 h-40" />
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <h2 className="text-3xl font-bold mb-2 text-slate-900 text-center">Who are you?</h2>
          <p className="text-slate-600 text-center mb-8">Select your role to continue</p>

          <div className="space-y-4">
            {/* Guest Button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full group relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg p-6 rounded-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <span className="block w-6 h-6 leading-6 text-center font-bold">G</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900">Guest</h3>
                  <p className="text-sm text-slate-600">Report emergency or get help</p>
                </div>
              </div>
            </button>

            {/* Staff Button */}
            <button
              onClick={() => navigate('/staff/login')}
              className="w-full group relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg p-6 rounded-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <span className="block w-6 h-6 leading-6 text-center font-bold">S</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-900">Staff</h3>
                  <p className="text-sm text-slate-600">Admin, Manager, or Employee</p>
                </div>
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-300">
            <p className="text-sm text-slate-700">
              <span className="font-bold">First time?</span> Choose "Guest" to register and report emergencies, or "Staff" if you have employee credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Emergency Response System</p>
        </div>
      </div>
    </div>
  );
}

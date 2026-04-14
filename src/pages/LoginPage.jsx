import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { validatePhoneNumber } from '../utils/phoneValidator';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    floor: '',
    room: '',
    diseases: [],
    medicalInfo: '',
    emergencyContact: '',
    emergencyContactPhone: ''
  });
  
  const [phoneErrors, setPhoneErrors] = useState({
    phone: '',
    emergencyContactPhone: ''
  });

  const handlePhoneChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Real-time validation
    const validation = validatePhoneNumber(value);
    setPhoneErrors({
      ...phoneErrors,
      [field]: validation.isValid ? '' : validation.message
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneErrors({ ...phoneErrors, phone: phoneValidation.message });
      alert('Invalid phone number: ' + phoneValidation.message);
      return;
    }

    if (!formData.room) {
      alert('Please enter Room Number');
      return;
    }
    
    if (!formData.emergencyContact || !formData.emergencyContactPhone) {
      alert('Please provide Emergency Contact information');
      return;
    }

    // Validate emergency contact phone
    const emergencyPhoneValidation = validatePhoneNumber(formData.emergencyContactPhone);
    if (!emergencyPhoneValidation.isValid) {
      setPhoneErrors({ ...phoneErrors, emergencyContactPhone: emergencyPhoneValidation.message });
      alert('Invalid emergency contact phone: ' + emergencyPhoneValidation.message);
      return;
    }

    login(formData, 'guest');
    navigate('/user-app');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="bg-white rounded-2xl p-8 inline-block">
            <img src="/resq-logo.png" alt="ResQ" className="w-80 h-40" />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">Guest Registration</h2>

          <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide pr-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handlePhoneChange('phone', e.target.value)}
                className={`w-full border-2 rounded-lg p-3 focus:outline-none transition-colors ${
                  phoneErrors.phone ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Enter 10-digit phone number"
              />
              {phoneErrors.phone && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                  <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold leading-none">!</span>
                  <span>{phoneErrors.phone}</span>
                </div>
              )}
            </div>

            {/* Room Information */}
            <div className="border-t-2 border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-4">Room Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g., 305"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Floor Number</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g., 3"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border-t-2 border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-4">Medical Information</h3>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Any pre-existing medical conditions?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['None', 'Diabetes', 'Heart Condition', 'Asthma', 'Hypertension', 'Allergies', 'Other'].map((disease) => (
                    <label key={disease} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-blue-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.diseases.includes(disease)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, diseases: [...formData.diseases, disease] });
                          } else {
                            setFormData({ ...formData, diseases: formData.diseases.filter(d => d !== disease) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-slate-700">{disease}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Medical Details / Allergies</label>
                <textarea
                  value={formData.medicalInfo}
                  onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Any medications, allergies, or special medical conditions..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t-2 border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handlePhoneChange('emergencyContactPhone', e.target.value)}
                    className={`w-full border-2 rounded-lg p-3 focus:outline-none transition-colors ${
                      phoneErrors.emergencyContactPhone ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-blue-500'
                    }`}
                    placeholder="Emergency contact number"
                  />
                  {phoneErrors.emergencyContactPhone && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold leading-none">!</span>
                      <span>{phoneErrors.emergencyContactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-bold text-white text-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
              >
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-white/20 text-white text-[10px] font-bold leading-none">G</span>
                Login as Guest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

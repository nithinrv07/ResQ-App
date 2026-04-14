import React, { createContext, useState, useContext, useEffect } from 'react';
import { mockDb } from '../services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'guest', 'employee', 'manager', 'admin', 'staff'
  const [isLoading, setIsLoading] = useState(true); // Loading state to prevent redirect flash

  // Restore session from localStorage on app load
  useEffect(() => {
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
      try {
        const { user: savedUser, role: savedRole } = JSON.parse(savedSession);
        setUser(savedUser);
        setRole(savedRole);
      } catch (err) {
        console.error('Failed to restore session:', err);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (credentials, userRole) => {
    // Don't clear incidents - keep them persistent across all logins
    // Each guest will see only their own incidents based on email filtering
    
    // Track active guest sessions for real-time admin visibility
    if (userRole === 'guest') {
      const activeSessions = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      activeSessions[credentials.email] = {
        name: credentials.name,
        email: credentials.email,
        room: credentials.room,
        floor: credentials.floor,
        phone: credentials.phone,
        diseases: credentials.diseases,
        medicalInfo: credentials.medicalInfo,
        emergencyContact: credentials.emergencyContact,
        emergencyContactPhone: credentials.emergencyContactPhone,
        loginTime: new Date().toISOString(),
        status: 'active'
      };
      localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
      window.dispatchEvent(new Event('activeSessions:updated'));
    }
    
    // Mock authentication - in real app, verify with backend
    setUser({
      id: Date.now().toString(),
      name: credentials.name,
      email: credentials.email,
      phone: credentials.phone,
      floor: credentials.floor, // for employees and staff
      room: credentials.room,   // for guests
      employeeId: credentials.employeeId,
      accessRole: credentials.accessRole, // which role logged in with
      diseases: credentials.diseases, // medical conditions
      medicalInfo: credentials.medicalInfo, // medical details
      emergencyContact: credentials.emergencyContact,
      emergencyContactPhone: credentials.emergencyContactPhone,
      createdAt: new Date().toISOString()
    });
    setRole(userRole);
    localStorage.setItem('currentUser', JSON.stringify({ user: { ...credentials }, role: userRole }));
  };

  const logout = () => {
    // Remove from active sessions if guest
    if (role === 'guest' && user?.email) {
      const activeSessions = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      delete activeSessions[user.email];
      localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
      window.dispatchEvent(new Event('activeSessions:updated'));
    }
    
    setUser(null);
    setRole(null);
    localStorage.removeItem('currentUser');
  };

  const switchRole = (newRole) => {
    // Allow staff to switch between admin, manager, and employee roles
    if (role === 'staff' && ['admin', 'manager', 'employee'].includes(newRole)) {
      setRole(newRole);
      localStorage.setItem('currentUser', JSON.stringify({ user, role: newRole }));
    }
  };

  const isAuthenticated = () => user !== null && role !== null;

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isAuthenticated, isLoading, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

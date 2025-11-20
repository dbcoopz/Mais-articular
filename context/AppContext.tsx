import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { User, Patient, Session, Appointment, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_PATIENTS, INITIAL_SESSIONS, INITIAL_APPOINTMENTS } from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  sessions: Session[];
  appointments: Appointment[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  addSession: (session: Session) => void;
  addAppointment: (apt: Appointment) => void;
  updateAppointment: (apt: Appointment) => void;
  deleteAppointment: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Load data from localStorage or fall back to constants
  // FIX: Prioritize localStorage completely. If data exists, do NOT merge with INITIAL_USERS.
  // This prevents deleted users from reappearing on reload.
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ma_users');
    if (saved) {
        return JSON.parse(saved);
    }
    return INITIAL_USERS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('ma_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('ma_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('ma_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('ma_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('ma_patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('ma_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('ma_appointments', JSON.stringify(appointments)), [appointments]);

  // Auth Logic
  useEffect(() => {
    const savedUser = localStorage.getItem('ma_currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      if (!user.active) return false;
      setCurrentUser(user);
      localStorage.setItem('ma_currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ma_currentUser');
  };

  // Data mutations
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  
  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    // If the updated user is the current logged-in user, update session state too
    if (currentUser && currentUser.id === user.id) {
        const updatedUser = { ...currentUser, ...user };
        setCurrentUser(updatedUser);
        localStorage.setItem('ma_currentUser', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addPatient = (patient: Patient) => setPatients(prev => [...prev, patient]);
  const updatePatient = (patient: Patient) => {
    setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
  };
  const addSession = (session: Session) => setSessions(prev => [session, ...prev]);
  const addAppointment = (apt: Appointment) => setAppointments(prev => [...prev, apt]);
  const updateAppointment = (apt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a));
  };
  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      patients,
      sessions,
      appointments,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      addPatient,
      updatePatient,
      addSession,
      addAppointment,
      updateAppointment,
      deleteAppointment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
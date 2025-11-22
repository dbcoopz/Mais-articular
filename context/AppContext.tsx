
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { User, Patient, Session, Appointment, UserRole, WaitingListEntry, SessionType, PatientDocument } from '../types';
import { INITIAL_USERS, INITIAL_PATIENTS, INITIAL_SESSIONS, INITIAL_APPOINTMENTS, INITIAL_WAITING_LIST, INITIAL_SESSION_TYPES } from '../constants';

export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  sessions: Session[];
  appointments: Appointment[];
  waitingList: WaitingListEntry[];
  sessionTypes: SessionType[];
  toasts: ToastMessage[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  addAppointment: (apt: Appointment) => void;
  updateAppointment: (apt: Appointment) => void;
  deleteAppointment: (id: string) => void;
  addToWaitingList: (entry: WaitingListEntry) => void;
  updateWaitingListEntry: (entry: WaitingListEntry) => void;
  deleteFromWaitingList: (id: string) => void;
  addSessionType: (type: SessionType) => void;
  updateSessionType: (type: SessionType) => void;
  deleteSessionType: (id: string) => void;
  addPatientDocument: (patientId: string, doc: PatientDocument) => void; // New
  deletePatientDocument: (patientId: string, docId: string) => void; // New
  restoreData: (data: any) => void;
  clearAllData: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Load data from localStorage or fall back to constants
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

  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>(() => {
    const saved = localStorage.getItem('ma_waitingList');
    return saved ? JSON.parse(saved) : INITIAL_WAITING_LIST;
  });

  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(() => {
    const saved = localStorage.getItem('ma_sessionTypes');
    return saved ? JSON.parse(saved) : INITIAL_SESSION_TYPES;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('ma_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('ma_patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('ma_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('ma_appointments', JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem('ma_waitingList', JSON.stringify(waitingList)), [waitingList]);
  useEffect(() => localStorage.setItem('ma_sessionTypes', JSON.stringify(sessionTypes)), [sessionTypes]);

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

  // Toast Logic
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Data mutations
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  
  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
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

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };
  
  // Document Mutations
  const addPatientDocument = (patientId: string, doc: PatientDocument) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const currentDocs = p.documents || [];
        return { ...p, documents: [...currentDocs, doc] };
      }
      return p;
    }));
  };

  const deletePatientDocument = (patientId: string, docId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const currentDocs = p.documents || [];
        return { ...p, documents: currentDocs.filter(d => d.id !== docId) };
      }
      return p;
    }));
  };
  
  const addSession = (session: Session) => setSessions(prev => [session, ...prev]);
  
  const updateSession = (session: Session) => {
    setSessions(prev => prev.map(s => s.id === session.id ? session : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const addAppointment = (apt: Appointment) => setAppointments(prev => [...prev, apt]);
  const updateAppointment = (apt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a));
  };
  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  // Waiting List Mutations
  const addToWaitingList = (entry: WaitingListEntry) => setWaitingList(prev => [...prev, entry]);
  const updateWaitingListEntry = (entry: WaitingListEntry) => {
    setWaitingList(prev => prev.map(e => e.id === entry.id ? entry : e));
  };
  const deleteFromWaitingList = (id: string) => {
    setWaitingList(prev => prev.filter(e => e.id !== id));
  };

  // Session Types Mutations
  const addSessionType = (type: SessionType) => setSessionTypes(prev => [...prev, type]);
  const updateSessionType = (type: SessionType) => setSessionTypes(prev => prev.map(t => t.id === type.id ? type : t));
  const deleteSessionType = (id: string) => setSessionTypes(prev => prev.filter(t => t.id !== id));

  // System Functions
  const restoreData = (data: any) => {
    if (data.users) setUsers(data.users);
    if (data.patients) setPatients(data.patients);
    if (data.sessions) setSessions(data.sessions);
    if (data.appointments) setAppointments(data.appointments);
    if (data.waitingList) setWaitingList(data.waitingList);
    if (data.sessionTypes) setSessionTypes(data.sessionTypes);
  };

  const clearAllData = () => {
      setUsers(INITIAL_USERS);
      setPatients([]);
      setSessions([]);
      setAppointments([]);
      setWaitingList([]);
      setSessionTypes(INITIAL_SESSION_TYPES);
      localStorage.clear();
      // Force reload to clear persistent state
      window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      patients,
      sessions,
      appointments,
      waitingList,
      sessionTypes,
      toasts,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      addPatient,
      updatePatient,
      deletePatient,
      addSession,
      updateSession,
      deleteSession,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addToWaitingList,
      updateWaitingListEntry,
      deleteFromWaitingList,
      addSessionType,
      updateSessionType,
      deleteSessionType,
      addPatientDocument,
      deletePatientDocument,
      restoreData,
      clearAllData,
      showToast,
      removeToast
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

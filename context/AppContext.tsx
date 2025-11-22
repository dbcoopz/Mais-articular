
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { User, Utente, Session, Appointment, UserRole, WaitingListEntry, SessionType, UtenteDocument, Specialty } from '../types';
import { INITIAL_USERS, INITIAL_UTENTES, INITIAL_SESSIONS, INITIAL_APPOINTMENTS, INITIAL_WAITING_LIST, INITIAL_SESSION_TYPES, INITIAL_SPECIALTIES } from '../constants';
import { addWeeks, parseISO, format, isAfter } from 'date-fns';

export type ToastMessage = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  utentes: Utente[];
  sessions: Session[];
  appointments: Appointment[];
  waitingList: WaitingListEntry[];
  sessionTypes: SessionType[];
  specialties: Specialty[]; // New
  toasts: ToastMessage[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addUtente: (utente: Utente) => void;
  updateUtente: (utente: Utente) => void;
  deleteUtente: (id: string) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  addAppointment: (apt: Appointment) => void;
  addAppointmentSeries: (apt: Appointment, repeatUntil: string) => void; // New
  updateAppointment: (apt: Appointment) => void;
  updateAppointmentSeries: (apt: Appointment) => void; // New
  deleteAppointment: (id: string) => void;
  addToWaitingList: (entry: WaitingListEntry) => void;
  updateWaitingListEntry: (entry: WaitingListEntry) => void;
  deleteFromWaitingList: (id: string) => void;
  addSessionType: (type: SessionType) => void;
  updateSessionType: (type: SessionType) => void;
  deleteSessionType: (id: string) => void;
  addSpecialty: (specialty: Specialty) => void; // New
  updateSpecialty: (specialty: Specialty) => void; // New
  deleteSpecialty: (id: string) => void; // New
  addUtenteDocument: (utenteId: string, doc: UtenteDocument) => void;
  deleteUtenteDocument: (utenteId: string, docId: string) => void;
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

  const [utentes, setUtentes] = useState<Utente[]>(() => {
    const saved = localStorage.getItem('ma_utentes');
    return saved ? JSON.parse(saved) : INITIAL_UTENTES;
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

  const [specialties, setSpecialties] = useState<Specialty[]>(() => {
    const saved = localStorage.getItem('ma_specialties');
    return saved ? JSON.parse(saved) : INITIAL_SPECIALTIES;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('ma_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('ma_utentes', JSON.stringify(utentes)), [utentes]);
  useEffect(() => localStorage.setItem('ma_sessions', JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem('ma_appointments', JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem('ma_waitingList', JSON.stringify(waitingList)), [waitingList]);
  useEffect(() => localStorage.setItem('ma_sessionTypes', JSON.stringify(sessionTypes)), [sessionTypes]);
  useEffect(() => localStorage.setItem('ma_specialties', JSON.stringify(specialties)), [specialties]);


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

  const addUtente = (utente: Utente) => setUtentes(prev => [...prev, utente]);
  const updateUtente = (utente: Utente) => {
    setUtentes(prev => prev.map(p => p.id === utente.id ? utente : p));
  };

  const deleteUtente = (id: string) => {
    setUtentes(prev => prev.filter(p => p.id !== id));
  };
  
  // Document Mutations
  const addUtenteDocument = (utenteId: string, doc: UtenteDocument) => {
    setUtentes(prev => prev.map(p => {
      if (p.id === utenteId) {
        const currentDocs = p.documents || [];
        return { ...p, documents: [...currentDocs, doc] };
      }
      return p;
    }));
  };

  const deleteUtenteDocument = (utenteId: string, docId: string) => {
    setUtentes(prev => prev.map(p => {
      if (p.id === utenteId) {
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
  
  // New: Add Series
  const addAppointmentSeries = (apt: Appointment, repeatUntil: string) => {
    const groupId = Math.random().toString(36).substr(2, 9);
    const newAppointments: Appointment[] = [];
    const startDate = parseISO(apt.date);
    const endDate = parseISO(repeatUntil);
    let currentDate = startDate;

    // While current date is same or before end date
    while (!isAfter(currentDate, endDate)) {
        newAppointments.push({
            ...apt,
            id: Math.random().toString(36).substr(2, 9),
            date: format(currentDate, 'yyyy-MM-dd'),
            groupId: groupId
        });
        currentDate = addWeeks(currentDate, 1);
    }
    
    setAppointments(prev => [...prev, ...newAppointments]);
  };

  const updateAppointment = (apt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === apt.id ? apt : a));
  };

  // New: Update Series
  const updateAppointmentSeries = (apt: Appointment) => {
    if (!apt.groupId) return;
    
    // Only update this and future appointments in the series
    const currentDate = parseISO(apt.date);

    setAppointments(prev => prev.map(a => {
        // Check if part of same group AND is today or future
        if (a.groupId === apt.groupId && !isAfter(parseISO(apt.date), parseISO(a.date))) {
            return {
                ...a,
                time: apt.time,
                durationMinutes: apt.durationMinutes,
                notes: apt.notes,
                sessionTypeId: apt.sessionTypeId,
                profissionalId: apt.profissionalId
            };
        }
        return a;
    }));
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

  // Specialty Mutations
  const addSpecialty = (specialty: Specialty) => setSpecialties(prev => [...prev, specialty]);
  const updateSpecialty = (specialty: Specialty) => setSpecialties(prev => prev.map(s => s.id === specialty.id ? specialty : s));
  const deleteSpecialty = (id: string) => {
    // Also remove any session types associated with this specialty
    setSessionTypes(prev => prev.filter(st => st.specialtyId !== id));
    setSpecialties(prev => prev.filter(s => s.id !== id));
  };

  // System Functions
  const restoreData = (data: any) => {
    if (data.users) setUsers(data.users);
    if (data.utentes) setUtentes(data.utentes);
    if (data.sessions) setSessions(data.sessions);
    if (data.appointments) setAppointments(data.appointments);
    if (data.waitingList) setWaitingList(data.waitingList);
    if (data.sessionTypes) setSessionTypes(data.sessionTypes);
    if (data.specialties) setSpecialties(data.specialties);
  };

  const clearAllData = () => {
      setUsers(INITIAL_USERS);
      setUtentes([]);
      setSessions([]);
      setAppointments([]);
      setWaitingList([]);
      setSessionTypes(INITIAL_SESSION_TYPES);
      setSpecialties(INITIAL_SPECIALTIES);
      localStorage.clear();
      window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      utentes,
      sessions,
      appointments,
      waitingList,
      sessionTypes,
      specialties,
      toasts,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      addUtente,
      updateUtente,
      deleteUtente,
      addSession,
      updateSession,
      deleteSession,
      addAppointment,
      addAppointmentSeries, // New
      updateAppointment,
      updateAppointmentSeries, // New
      deleteAppointment,
      addToWaitingList,
      updateWaitingListEntry,
      deleteFromWaitingList,
      addSessionType,
      updateSessionType,
      deleteSessionType,
      addSpecialty,
      updateSpecialty,
      deleteSpecialty,
      addUtenteDocument,
      deleteUtenteDocument,
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

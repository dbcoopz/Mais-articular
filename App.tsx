import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Sessions } from './pages/Sessions';
import { CalendarPage } from './pages/Calendar';
import { Therapists } from './pages/Therapists';
import { Administrators } from './pages/Administrators';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { UserRole } from './types';

const RequireAuth: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const RequireAdmin: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/patients" element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      
      {/* Shared Admin/Therapist Routes but with internal restrictions */}
      <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />

      {/* Admin Only Routes */}
      <Route path="/reports" element={<RequireAuth><RequireAdmin><Reports /></RequireAdmin></RequireAuth>} />
      <Route path="/therapists" element={<RequireAuth><RequireAdmin><Therapists /></RequireAdmin></RequireAuth>} />
      <Route path="/administrators" element={<RequireAuth><RequireAdmin><Administrators /></RequireAdmin></RequireAuth>} />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
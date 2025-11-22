
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Utentes } from './pages/Utentes';
import { UtenteDetail } from './pages/UtenteDetail';
import { Sessions } from './pages/Sessions';
import { CalendarPage } from './pages/Calendar';
import { Profissionais } from './pages/Profissionais';
import { Administrators } from './pages/Administrators';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { WaitingList } from './pages/WaitingList';
import { Settings } from './pages/Settings';
import { Services } from './pages/Services'; // New
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
      <Route path="/utentes" element={<RequireAuth><Utentes /></RequireAuth>} />
      <Route path="/utentes/:id" element={<RequireAuth><UtenteDetail /></RequireAuth>} />
      <Route path="/waiting-list" element={<RequireAuth><WaitingList /></RequireAuth>} />
      <Route path="/sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      
      {/* Shared Admin/PROFISSIONAL Routes but with internal restrictions */}
      <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />

      {/* Admin Only Routes */}
      <Route path="/reports" element={<RequireAuth><RequireAdmin><Reports /></RequireAdmin></RequireAuth>} />
      <Route path="/profissionais" element={<RequireAuth><RequireAdmin><Profissionais /></RequireAdmin></RequireAuth>} />
      <Route path="/administrators" element={<RequireAuth><RequireAdmin><Administrators /></RequireAdmin></RequireAuth>} />
      <Route path="/services" element={<RequireAuth><RequireAdmin><Services /></RequireAdmin></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><RequireAdmin><Settings /></RequireAdmin></RequireAuth>} />
      
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
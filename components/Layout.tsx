import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar, 
  UserCog, 
  CreditCard, 
  FileText, 
  LogOut,
  Download,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close sidebar when route changes (mobile UX)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [UserRole.ADMIN, UserRole.THERAPIST] },
    { label: 'Pacientes', icon: Users, path: '/patients', roles: [UserRole.ADMIN, UserRole.THERAPIST] },
    { label: 'Sessões', icon: MessageSquare, path: '/sessions', roles: [UserRole.ADMIN, UserRole.THERAPIST] },
    { label: 'Agenda', icon: Calendar, path: '/calendar', roles: [UserRole.ADMIN, UserRole.THERAPIST] },
    { label: 'Terapeutas', icon: UserCog, path: '/therapists', roles: [UserRole.ADMIN] },
    { label: 'Administradores', icon: ShieldCheck, path: '/administrators', roles: [UserRole.ADMIN] },
    { label: 'Faturação', icon: CreditCard, path: '/billing', roles: [UserRole.ADMIN, UserRole.THERAPIST] },
    { label: 'Relatórios', icon: FileText, path: '/reports', roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-gray-900">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#0f172a] text-white z-30 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center gap-2">
            <div className="bg-white rounded p-1 w-8 h-8 flex items-center justify-center">
                 <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display='none'}/>
            </div>
            <span className="font-bold text-sm tracking-wide">MAIS ARTICULAR</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-300 ease-in-out transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:flex-shrink-0 md:h-screen
        `}
      >
        <div className="p-6 hidden md:block">
           {/* Logo Container - Desktop */}
           <div className="bg-white rounded-lg p-3 flex items-center justify-center shadow-sm">
              <img 
                src="/logo.png" 
                alt="Mais Articular" 
                className="w-full h-auto object-contain max-h-12"
                onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement!.innerHTML = '<span class="text-[#1e3a5f] font-bold">MAIS ARTICULAR</span>';
                }}
              />
           </div>
        </div>

        {/* Mobile User Info (Top of sidebar on mobile) */}
        <div className="md:hidden p-6 bg-[#0b1120] flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-sm font-bold border-2 border-gray-700">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{currentUser.name}</p>
            </div>
        </div>

        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 md:mt-0">
          Menu Principal
        </div>

        <nav className="flex-1 px-2 space-y-1 mt-2 overflow-y-auto">
          {menuItems.filter(item => item.roles.includes(currentUser.role)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-[#1e3a5f] text-white shadow-md border-l-4 border-blue-400' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-[#0b1120]">
          {showInstallBtn && (
            <button 
              onClick={handleInstallClick}
              className="flex items-center w-full px-3 py-2 mb-4 text-sm font-medium text-blue-200 bg-[#1e3a5f] hover:bg-blue-800 rounded-md transition-colors shadow-sm border border-blue-900"
            >
              <Download className="mr-3 h-4 w-4" />
              Instalar App
            </button>
          )}

          {/* Desktop User Info Footer */}
          <div className="hidden md:flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-sm font-bold">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.role === UserRole.ADMIN ? 'Administrador' : 'Terapeuta'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pt-20 md:pt-8 bg-gray-50 w-full">
        {/* Key prop forces React to remount div on route change, triggering CSS animation */}
        <div key={location.pathname} className="h-full animate-material-enter max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};
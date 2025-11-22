
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole, Session, Utente, Appointment } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Euro, 
  Plus, 
  ArrowRight,
  Clock,
  FileText,
  User,
  Paperclip,
  CheckCircle,
  Check,
  Phone
} from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import parseISO from 'date-fns/parseISO';
import pt from 'date-fns/locale/pt';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon: Icon, colorClass = "bg-blue-50 text-[#1e3a5f]", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''}`}
  >
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{value}</h3>
      <p className={`text-xs font-medium ${subtitle.includes('+') || subtitle.includes('Total') ? 'text-green-600' : 'text-gray-500'}`}>
        {subtitle}
      </p>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const QuickAction: React.FC<{
  icon: React.ElementType;
  title: string;
  desc: string;
  to?: string;
  onClick?: () => void;
  colorClass: string;
}> = ({ icon: Icon, title, desc, to, onClick, colorClass }) => {
  const content = (
    <>
      <div className={`p-3 rounded-lg mr-4 ${colorClass} group-hover:scale-110 transition-transform flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="text-left min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{title}</h4>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group h-full">
        {content}
      </button>
    );
  }

  return (
    <Link to={to || '#'} className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group h-full">
      {content}
    </Link>
  );
};

export const Dashboard: React.FC = () => {
  const { currentUser, utentes, sessions, appointments, users, addUtente, addSession, addAppointment, deleteAppointment, showToast } = useApp();
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // --- DATA FILTERING BASED ON ROLE ---
  
  const myUtentes = isAdmin 
    ? utentes 
    : utentes.filter(p => p.profissionalId === currentUser?.id);

  const mySessions = isAdmin 
    ? sessions 
    : sessions.filter(s => s.profissionalId === currentUser?.id);

  const myAppointments = isAdmin 
    ? appointments 
    : appointments.filter(a => a.profissionalId === currentUser?.id);

  // View States
  const [viewSession, setViewSession] = useState<Session | null>(null);
  
  // Modal States
  const [isUtenteModalOpen, setIsUtenteModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<'utentes' | 'sessions' | 'appointments' | 'financial' | null>(null);
  
  // Conversion Modal State
  const [convertApt, setConvertApt] = useState<Appointment | null>(null);
  const [convertForm, setConvertForm] = useState({
      activities: '',
      progressNotes: '',
      homework: ''
  });

  // Forms Data
  const initialUtenteForm: Omit<Utente, 'id'> = {
    name: '', birthDate: '', age: 0, phone: '', email: '', responsibleName: '', profissionalId: '', diagnosis: '', address: '', clinicalNotes: '', active: true
  };
  const [utenteForm, setUtenteForm] = useState(initialUtenteForm);

  const initialSessionForm: Omit<Session, 'id'> = {
    utenteId: '', profissionalId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', durationMinutes: 60, activities: '', progressNotes: '', homework: '', status: 'COMPLETED', cost: 0, therapistPayment: 0
  };
  const [sessionForm, setSessionForm] = useState(initialSessionForm);

  const initialAptForm: Omit<Appointment, 'id' | 'status'> = {
    utenteId: '', profissionalId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', durationMinutes: 60, notes: ''
  };
  const [aptForm, setAptForm] = useState(initialAptForm);

  // --- METRICS CALCULATION ---
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // 1. Active Utentes
  const activeUtentesCount = myUtentes.filter(p => p.active).length;
  const totalUtentesCount = myUtentes.length;

  // 2. Sessions (Current Month vs Last Month)
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const lastMonthDate = subMonths(today, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();
  
  const monthSessions = mySessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonthSessions = mySessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const sessionsDiff = monthSessions.length - lastMonthSessions.length;
  const sessionsSign = sessionsDiff >= 0 ? '+' : '';

  // 3. Upcoming Appointments (Next 7 Days)
  const nextWeekDate = addDays(today, 7);
  const upcomingAppointments = myAppointments.filter(a => {
    const d = new Date(a.date);
    return a.status === 'PENDING' && d >= today;
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const next7DaysAppointments = upcomingAppointments.filter(a => {
    const d = new Date(a.date);
    return isBefore(d, nextWeekDate);
  });

  // 4. Revenue (Current Month vs Last Month)
  const calculateRevenue = (sessionList: Session[]) => {
      return isAdmin 
        ? sessionList.reduce((acc, s) => acc + s.cost, 0)
        : sessionList.reduce((acc, s) => acc + s.therapistPayment, 0);
  };

  const monthRevenue = calculateRevenue(monthSessions);
  const lastMonthRevenue = calculateRevenue(lastMonthSessions);
  
  const revenueDiff = monthRevenue - lastMonthRevenue;
  const revenueSign = revenueDiff >= 0 ? '+' : '-';
  const revenueDiffAbs = Math.abs(revenueDiff);

  // Recent sessions (Filtered)
  const recentSessions = [...mySessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Today's Appointments (Filtered)
  const todaysAppointments = myAppointments
    .filter(a => a.date === todayStr && a.status === 'PENDING')
    .sort((a, b) => a.time.localeCompare(b.time));

  const getUtenteName = (id: string) => utentes.find(p => p.id === id)?.name || 'Desconhecido';
  const getProfissionalName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';

  // Handlers
  const handleOpenUtenteModal = () => {
    setUtenteForm({
        ...initialUtenteForm,
        profissionalId: isAdmin ? '' : currentUser?.id || ''
    });
    setIsUtenteModalOpen(true);
  };

  const handleUtenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUtente({ ...utenteForm, id: Math.random().toString(36).substr(2, 9) });
    showToast('Utente criado com sucesso!');
    setIsUtenteModalOpen(false);
  };

  const handleOpenSessionModal = () => {
    setSessionForm({ ...initialSessionForm, profissionalId: currentUser?.id || '' });
    setIsSessionModalOpen(true);
  };

  const handleSessionUtenteChange = (utenteId: string) => {
    const utente = utentes.find(p => p.id === utenteId);
    const profissionalId = isAdmin ? sessionForm.profissionalId : currentUser?.id; 
    const profissional = users.find(u => u.id === profissionalId);

    setSessionForm(prev => ({
        ...prev,
        utenteId,
        profissionalId: profissionalId || '',
        cost: 0, // Cost is now determined by session type
        therapistPayment: profissional ? (profissional.paymentPerSession || 0) : 0
    }));
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSession = {
        ...sessionForm,
        profissionalId: isAdmin ? sessionForm.profissionalId : currentUser?.id || '',
        id: Math.random().toString(36).substr(2, 9)
    };
    addSession(finalSession);
    showToast('Sessão registada com sucesso!');
    setIsSessionModalOpen(false);
  };

  const handleOpenAppointmentModal = () => {
    setAptForm({ ...initialAptForm, profissionalId: currentUser?.id || '' });
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalApt = {
        ...aptForm,
        profissionalId: isAdmin ? aptForm.profissionalId : currentUser?.id || '',
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING' as const
    };
    addAppointment(finalApt);
    showToast('Agendamento criado!');
    setIsAppointmentModalOpen(false);
  };

  // Conversion Handlers
  const initiateConversion = (apt: Appointment) => {
    setConvertApt(apt);
    setConvertForm({ activities: '', progressNotes: '', homework: '' });
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertApt) return;

    const utente = utentes.find(p => p.id === convertApt.utenteId);
    const profissional = users.find(u => u.id === convertApt.profissionalId);

    addSession({
        id: Math.random().toString(36).substr(2, 9),
        utenteId: convertApt.utenteId,
        profissionalId: convertApt.profissionalId,
        date: convertApt.date,
        startTime: convertApt.time,
        durationMinutes: convertApt.durationMinutes,
        status: 'COMPLETED',
        activities: convertForm.activities || '',
        progressNotes: convertForm.progressNotes || '',
        homework: convertForm.homework || '',
        cost: 0, // Cost is determined by session type
        therapistPayment: profissional?.paymentPerSession || 0
    });

    deleteAppointment(convertApt.id);
    showToast('Sessão concluída com sucesso!');
    setConvertApt(null);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header: Stack on mobile, Row on Desktop */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1e3a5f] truncate">Olá, {currentUser?.name.split(' ')[0]} 👋</h1>
          <p className="text-sm md:text-base text-gray-500 capitalize">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
      </div>

      {/* Stats Grid - Uniform Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Utentes Ativos" 
          value={activeUtentesCount} 
          subtitle={`Total registados: ${totalUtentesCount}`}
          icon={Users} 
          colorClass="bg-blue-50 text-[#1e3a5f]"
          onClick={() => setActiveStatModal('utentes')}
        />
        <StatCard 
          title="Sessões este Mês" 
          value={monthSessions.length} 
          subtitle={`${sessionsSign}${sessionsDiff} vs mês passado`}
          icon={MessageSquare} 
          colorClass="bg-blue-50 text-[#1e3a5f]"
          onClick={() => setActiveStatModal('sessions')}
        />
        <StatCard 
          title="Próx. Agendamentos" 
          value={upcomingAppointments.length} 
          subtitle={`Próx. 7 dias: ${next7DaysAppointments.length}`}
          icon={Calendar} 
          colorClass="bg-blue-50 text-[#1e3a5f]"
          onClick={() => setActiveStatModal('appointments')}
        />
        <StatCard 
          title={isAdmin ? "Receita Total" : "Meus Ganhos"}
          value={`€${monthRevenue.toFixed(2)}`} 
          subtitle={`${revenueSign}€${revenueDiffAbs.toFixed(2)} vs mês passado`}
          icon={Euro} 
          colorClass="bg-blue-50 text-[#1e3a5f]"
          onClick={() => setActiveStatModal('financial')}
        />
      </div>

      {/* Quick Actions - Uniform Colors */}
      <div>
         <h2 className="text-lg font-bold text-gray-900 mb-3 md:mb-4">Ações Rápidas</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction 
              title="Novo Utente" 
              desc="Adicionar ficha" 
              onClick={handleOpenUtenteModal}
              icon={Plus} 
              colorClass="bg-blue-50 text-[#1e3a5f]" 
            />
            <QuickAction 
              title="Registar Sessão" 
              desc="Notas de evolução" 
              onClick={handleOpenSessionModal}
              icon={MessageSquare} 
              colorClass="bg-blue-50 text-[#1e3a5f]" 
            />
            <QuickAction 
              title="Agendar" 
              desc="Ver agenda" 
              onClick={handleOpenAppointmentModal}
              icon={Calendar} 
              colorClass="bg-blue-50 text-[#1e3a5f]" 
            />
            <QuickAction 
              title="Faturação" 
              desc="Ver finanças" 
              to="/billing" 
              icon={Euro} 
              colorClass="bg-blue-50 text-[#1e3a5f]" 
            />
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Today's Appointments (Left) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Hoje
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{todaysAppointments.length}</span>
              </h2>
              <button 
                onClick={() => navigate('/calendar')}
                className="px-3 py-1 bg-white text-[#1e3a5f] hover:bg-blue-50 text-xs font-medium rounded-full shadow-sm border border-gray-100 hover:shadow transition-all"
              >
                  Ver Agenda
              </button>
            </div>

            <div className="space-y-3 md:space-y-4 flex-1">
                {todaysAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                        <CheckCircle size={48} className="mb-2 opacity-20" />
                        <p>Tudo livre por hoje!</p>
                    </div>
                ) : (
                    todaysAppointments.map(apt => {
                        const utente = utentes.find(p => p.id === apt.utenteId);
                        return (
                            <div key={apt.id} className="flex items-center justify-between p-3 md:p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-start flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/utentes/${apt.utenteId}`)}>
                                    <div className="bg-blue-50 p-2 rounded-lg text-center min-w-[55px] mr-3 shadow-sm border border-blue-100">
                                        <span className="block text-sm font-bold text-[#1e3a5f]">{apt.time}</span>
                                        <span className="block text-[10px] text-gray-500">{apt.durationMinutes}m</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate hover:text-[#1e3a5f] transition-colors">{utente?.name}</h4>
                                        <p className="text-xs text-gray-600 mt-1 truncate">{apt.notes || 'Sessão agendada'}</p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500 truncate">
                                            <User size={12} className="mr-1 flex-shrink-0" />
                                            {getProfissionalName(apt.profissionalId)}
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                    <button 
                                      onClick={() => initiateConversion(apt)}
                                      className="p-2 bg-white text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full shadow-sm border border-gray-200 transition-colors"
                                      title="Concluir Sessão"
                                    >
                                      <Check size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Recent Sessions (Right) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recentes</h2>
            <Link 
              to="/sessions" 
              className="px-3 py-1 bg-white text-[#1e3a5f] hover:bg-blue-50 text-xs font-medium rounded-full shadow-sm border border-gray-100 hover:shadow transition-all flex items-center"
            >
              Ver todas <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>
          
          <div className="space-y-3 md:space-y-4 flex-1">
            {recentSessions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                  Nenhuma sessão registrada
              </div>
            ) : (
              recentSessions.map(session => {
                const utente = utentes.find(p => p.id === session.utenteId);
                return (
                  <div 
                    key={session.id} 
                    onClick={() => setViewSession(session)}
                    className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100"
                  >
                    <div className="flex items-center min-w-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-[#1e3a5f] flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {utente?.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{utente?.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {format(new Date(session.date), 'dd/MM/yyyy')} • {session.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <span className="ml-2 px-2 py-1 rounded-full text-[10px] font-medium bg-white text-green-700 shadow-sm border border-gray-100 flex-shrink-0">
                      Realizada
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Stat Details Modal */}
      <Modal 
        isOpen={!!activeStatModal} 
        onClose={() => setActiveStatModal(null)} 
        title={
            activeStatModal === 'utentes' ? 'Utentes Ativos' :
            activeStatModal === 'sessions' ? 'Sessões do Mês' :
            activeStatModal === 'appointments' ? 'Agendamentos' :
            isAdmin ? 'Receita Mensal' : 'Meus Ganhos'
        } 
        maxWidth="lg"
      >
        <div className="overflow-y-auto max-h-[60vh] space-y-3 p-1">
           {activeStatModal === 'utentes' && (
              <>
                {myUtentes.filter(p => p.active).length === 0 ? (
                  <div className="text-center text-gray-400 py-8">Nenhum utente ativo.</div>
                ) : (
                  myUtentes.filter(p => p.active).map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => { setActiveStatModal(null); navigate(`/utentes/${p.id}`); }}
                        className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-gray-900">
                             <span className="truncate">Resp: {p.responsibleName}</span>
                             <span className="hidden md:inline w-1 h-1 bg-gray-300 rounded-full"></span>
                             <span className="flex items-center gap-1 truncate"><Phone size={10}/> {p.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="block font-bold text-gray-900 text-sm">{p.age} anos</span>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full mt-1">
                          Ativo
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
           )}

           {activeStatModal === 'sessions' && (
             <>
               {monthSessions.length === 0 ? (
                 <div className="text-center text-gray-400 py-8">Sem sessões.</div>
               ) : (
                 monthSessions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                   <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="bg-blue-50 p-2 rounded-lg text-[#1e3a5f] flex-shrink-0">
                           <Calendar size={18} />
                         </div>
                         <div className="min-w-0">
                           <h4 className="font-bold text-gray-900 text-sm truncate">{getUtenteName(s.utenteId)}</h4>
                           <p className="text-xs text-gray-900 truncate">
                             {format(new Date(s.date), 'dd/MM')} • {s.activities}
                           </p>
                         </div>
                      </div>
                      <span className="px-2 py-1 text-[10px] font-medium bg-green-100 text-green-700 rounded-full shrink-0 ml-2">Realizada</span>
                   </div>
                 ))
               )}
             </>
           )}

           {activeStatModal === 'appointments' && (
              <>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">Vazio.</div>
                ) : (
                  upcomingAppointments.map(a => (
                    <div 
                        key={a.id} 
                        onClick={() => { setActiveStatModal(null); navigate(`/utentes/${a.utenteId}`); }}
                        className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50"
                    >
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-blue-50 p-2 rounded-lg text-[#1e3a5f] text-center min-w-[40px] flex-shrink-0">
                             <span className="block font-bold text-gray-900 text-xs">{a.time}</span>
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-bold text-gray-900 text-sm truncate">{getUtenteName(a.utenteId)}</h4>
                             <p className="text-xs text-gray-900 truncate">{format(new Date(a.date), 'dd/MM')} • {a.durationMinutes} min</p>
                          </div>
                       </div>
                       <span className="px-2 py-1 text-[10px] font-medium bg-orange-100 text-orange-700 rounded-full shrink-0 ml-2">Pendente</span>
                    </div>
                  ))
                )}
              </>
           )}

           {activeStatModal === 'financial' && (
             <>
               {monthSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold flex-shrink-0">
                           <Euro size={16} />
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-bold text-gray-900 text-sm truncate">{getUtenteName(s.utenteId)}</h4>
                           <p className="text-xs text-gray-900 truncate">{format(new Date(s.date), 'dd/MM')} {isAdmin && `• ${getProfissionalName(s.profissionalId).split(' ')[0]}`}</p>
                        </div>
                     </div>
                     <span className="font-bold text-gray-900 text-sm ml-2">€{(isAdmin ? s.cost : s.therapistPayment).toFixed(2)}</span>
                  </div>
               ))}
               <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-200 mt-4">
                   <span className="font-bold text-gray-900 text-sm">Total</span>
                   <span className="text-lg font-bold text-green-600">€{monthRevenue.toFixed(2)}</span>
               </div>
             </>
           )}
        </div>
        <div className="flex justify-end pt-4">
             <Button variant="secondary" onClick={() => setActiveStatModal(null)}>Fechar</Button>
        </div>
      </Modal>

      {/* View Session Modal */}
      <Modal isOpen={!!viewSession} onClose={() => setViewSession(null)} title="Resumo da Sessão">
        {viewSession && (
          <div className="space-y-4 md:space-y-6">
             <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                  {getUtenteName(viewSession.utenteId).charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getUtenteName(viewSession.utenteId)}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(viewSession.date), 'dd/MM/yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {viewSession.startTime} ({viewSession.durationMinutes} min)</span>
                  </div>
                </div>
             </div>
             
             {/* ... Mobile optimized grids for details ... */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Profissional</p>
                   <p className="font-medium text-gray-900">{getProfissionalName(viewSession.profissionalId)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Euro size={12} /> Valor</p>
                   <p className="font-medium text-gray-900">€{viewSession.cost.toFixed(2)}</p>
                </div>
             </div>

             {/* ... Rest of the modal content remains largely same, just ensuring text wrapping ... */}
             <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600"/> Atividades Realizadas
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {viewSession.activities}
                </div>
             </div>

             {/* ... Other text areas ... */}
             
             <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setViewSession(null)}>Fechar</Button>
             </div>
          </div>
        )}
      </Modal>
      
      {/* Other modals kept similar but ensure inputs have full width on mobile */}
      <Modal isOpen={isUtenteModalOpen} onClose={() => setIsUtenteModalOpen(false)} title="Novo Utente" maxWidth="2xl">
        <form onSubmit={handleUtenteSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Completo *" value={utenteForm.name} onChange={e => setUtenteForm({...utenteForm, name: e.target.value})} required />
            <Input label="Data de Nascimento *" type="date" value={utenteForm.birthDate} onChange={e => setUtenteForm({...utenteForm, birthDate: e.target.value})} required />
            <Input label="Idade" type="number" value={utenteForm.age} onChange={e => setUtenteForm({...utenteForm, age: parseInt(e.target.value)})} />
            <Input label="Nome do Responsável *" value={utenteForm.responsibleName} onChange={e => setUtenteForm({...utenteForm, responsibleName: e.target.value})} required />
            <Input label="Telefone" value={utenteForm.phone} onChange={e => setUtenteForm({...utenteForm, phone: e.target.value})} />
            <Input label="Email" type="email" value={utenteForm.email} onChange={e => setUtenteForm({...utenteForm, email: e.target.value})} />
          </div>
          {/* ... rest of form ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
               {isAdmin ? (
                   <select 
                     className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                     value={utenteForm.profissionalId}
                     onChange={e => setUtenteForm({...utenteForm, profissionalId: e.target.value})}
                   >
                     <option value="">Selecione</option>
                     {users.filter(u => u.role === UserRole.PROFISSIONAL).map(u => (
                       <option key={u.id} value={u.id}>{u.name}</option>
                     ))}
                   </select>
               ) : (
                   <Input value={currentUser?.name} disabled className="bg-gray-100" />
               )}
             </div>
          </div>
          
          <Input label="Diagnóstico" value={utenteForm.diagnosis} onChange={e => setUtenteForm({...utenteForm, diagnosis: e.target.value})} />
          <Input label="Morada" value={utenteForm.address} onChange={e => setUtenteForm({...utenteForm, address: e.target.value})} />
          <TextArea label="Observações Clínicas" rows={3} value={utenteForm.clinicalNotes} onChange={e => setUtenteForm({...utenteForm, clinicalNotes: e.target.value})} />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsUtenteModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Keep other modals logic intact */}
      {/* ... */}
      <Modal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title="Registar Sessão" maxWidth="lg">
           {/* Standard form logic */}
           <form onSubmit={handleSessionSubmit} className="space-y-4">
               {/* ... Inputs ... */}
               {/* Ensure grids are responsive */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utente *</label>
                  <select 
                      className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                      value={sessionForm.utenteId}
                      onChange={(e) => handleSessionUtenteChange(e.target.value)}
                      required
                  >
                      <option value="">Selecione</option>
                      {myUtentes.filter(p => p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Data *" type="date" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} required />
                  <Input label="Hora *" type="time" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} />
                  <Input label="Duração (min) *" type="number" value={sessionForm.durationMinutes} onChange={e => setSessionForm({...sessionForm, durationMinutes: parseInt(e.target.value)})} required />
              </div>

              <TextArea label="Atividades Realizadas *" placeholder="Descreva as atividades..." rows={3} value={sessionForm.activities} onChange={e => setSessionForm({...sessionForm, activities: e.target.value})} required />
              <TextArea label="Notas de Progresso" placeholder="Observações sobre o progresso..." rows={2} value={sessionForm.progressNotes} onChange={e => setSessionForm({...sessionForm, progressNotes: e.target.value})} />
              <TextArea label="Trabalho de Casa" placeholder="Exercícios para casa..." rows={2} value={sessionForm.homework} onChange={e => setSessionForm({...sessionForm, homework: e.target.value})} />

              <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <input type="file" className="hidden" id="file-upload-dash" />
                  <label htmlFor="file-upload-dash" className="flex items-center cursor-pointer">
                      <Paperclip size={18} className="mr-2" />
                      Anexar Arquivos (simulado)
                  </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={() => setIsSessionModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Registar</Button>
              </div>
           </form>
      </Modal>

      <Modal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} title="Novo Agendamento">
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Utente *</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                        value={aptForm.utenteId}
                        onChange={e => setAptForm({...aptForm, utenteId: e.target.value})}
                        required
                    >
                        <option value="">Selecione</option>
                        {myUtentes.filter(p => p.active).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Data *" type="date" value={aptForm.date} onChange={e => setAptForm({...aptForm, date: e.target.value})} required />
                    <Input label="Hora *" type="time" value={aptForm.time} onChange={e => setAptForm({...aptForm, time: e.target.value})} required />
                </div>
                <Input label="Duração (min)" type="number" value={aptForm.durationMinutes} onChange={e => setAptForm({...aptForm, durationMinutes: parseInt(e.target.value)})} required />
                <TextArea label="Observações" value={aptForm.notes} onChange={e => setAptForm({...aptForm, notes: e.target.value})} />
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsAppointmentModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Agendar</Button>
                </div>
            </form>
      </Modal>

      <Modal isOpen={!!convertApt} onClose={() => setConvertApt(null)} title="Registar Sessão Realizada">
          <div className="mb-4 bg-blue-50 p-3 rounded-md text-sm text-blue-800">
              Convertendo agendamento de <strong>{utentes.find(p => p.id === convertApt?.utenteId)?.name}</strong>.
          </div>
          <form onSubmit={handleConvertSubmit} className="space-y-4">
              <TextArea label="Atividades Realizadas *" value={convertForm.activities} onChange={e => setConvertForm({...convertForm, activities: e.target.value})} required />
              <TextArea label="Notas de Progresso" value={convertForm.progressNotes} onChange={e => setConvertForm({...convertForm, progressNotes: e.target.value})} />
              <TextArea label="Trabalho de Casa" value={convertForm.homework} onChange={e => setConvertForm({...convertForm, homework: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" variant="secondary" onClick={() => setConvertApt(null)}>Cancelar</Button>
                   <Button type="submit">Confirmar e Salvar</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};
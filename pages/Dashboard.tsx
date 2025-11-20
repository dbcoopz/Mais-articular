import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole, Session, Patient, Appointment } from '../types';
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
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon: Icon, colorClass = "bg-blue-50 text-blue-600", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''}`}
  >
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{value}</h3>
      <p className={`text-xs font-medium ${subtitle.includes('+') ? 'text-green-600' : 'text-gray-400'}`}>
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
  const { currentUser, patients, sessions, appointments, users, addPatient, addSession, addAppointment, deleteAppointment } = useApp();
  const navigate = useNavigate();
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // --- DATA FILTERING BASED ON ROLE ---
  
  const myPatients = isAdmin 
    ? patients 
    : patients.filter(p => p.therapistId === currentUser?.id);

  const mySessions = isAdmin 
    ? sessions 
    : sessions.filter(s => s.therapistId === currentUser?.id);

  const myAppointments = isAdmin 
    ? appointments 
    : appointments.filter(a => a.therapistId === currentUser?.id);

  // View States
  const [viewSession, setViewSession] = useState<Session | null>(null);
  
  // Modal States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<'patients' | 'sessions' | 'appointments' | 'financial' | null>(null);
  
  // Conversion Modal State
  const [convertApt, setConvertApt] = useState<Appointment | null>(null);
  const [convertForm, setConvertForm] = useState({
      activities: '',
      progressNotes: '',
      homework: ''
  });

  // Forms Data
  const initialPatientForm: Omit<Patient, 'id'> = {
    name: '', birthDate: '', age: 0, phone: '', email: '', responsibleName: '', therapistId: '', costPerSession: 0, diagnosis: '', address: '', clinicalNotes: '', active: true
  };
  const [patientForm, setPatientForm] = useState(initialPatientForm);

  const initialSessionForm: Omit<Session, 'id'> = {
    patientId: '', therapistId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', durationMinutes: 60, activities: '', progressNotes: '', homework: '', status: 'COMPLETED', cost: 0, therapistPayment: 0
  };
  const [sessionForm, setSessionForm] = useState(initialSessionForm);

  const initialAptForm: Omit<Appointment, 'id' | 'status'> = {
    patientId: '', therapistId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', durationMinutes: 60, notes: ''
  };
  const [aptForm, setAptForm] = useState(initialAptForm);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Metrics Calculation (Using filtered data)
  const activePatientsCount = myPatients.filter(p => p.active).length;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthSessions = mySessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const upcomingAppointments = myAppointments.filter(a => {
    const d = new Date(a.date);
    return d >= today && a.status === 'PENDING';
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const upcomingAppointmentsCount = upcomingAppointments.length;

  // Revenue calculation
  const monthRevenue = isAdmin 
    ? monthSessions.reduce((acc, s) => acc + s.cost, 0)
    : monthSessions.reduce((acc, s) => acc + s.therapistPayment, 0);

  // Recent sessions (Filtered)
  const recentSessions = [...mySessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Today's Appointments (Filtered)
  const todaysAppointments = myAppointments
    .filter(a => a.date === todayStr && a.status === 'PENDING')
    .sort((a, b) => a.time.localeCompare(b.time));

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Desconhecido';
  const getTherapistName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';

  // Handlers
  const handleOpenPatientModal = () => {
    setPatientForm({
        ...initialPatientForm,
        therapistId: isAdmin ? '' : currentUser?.id || ''
    });
    setIsPatientModalOpen(true);
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPatient({ ...patientForm, id: Math.random().toString(36).substr(2, 9) });
    setIsPatientModalOpen(false);
  };

  const handleOpenSessionModal = () => {
    setSessionForm({ ...initialSessionForm, therapistId: currentUser?.id || '' });
    setIsSessionModalOpen(true);
  };

  const handleSessionPatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const therapistId = isAdmin ? sessionForm.therapistId : currentUser?.id; 
    const therapist = users.find(u => u.id === therapistId);

    setSessionForm(prev => ({
        ...prev,
        patientId,
        therapistId: therapistId || '',
        cost: patient ? patient.costPerSession : 0,
        therapistPayment: therapist ? (therapist.paymentPerSession || 0) : 0
    }));
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSession = {
        ...sessionForm,
        therapistId: isAdmin ? sessionForm.therapistId : currentUser?.id || '',
        id: Math.random().toString(36).substr(2, 9)
    };
    addSession(finalSession);
    setIsSessionModalOpen(false);
  };

  const handleOpenAppointmentModal = () => {
    setAptForm({ ...initialAptForm, therapistId: currentUser?.id || '' });
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalApt = {
        ...aptForm,
        therapistId: isAdmin ? aptForm.therapistId : currentUser?.id || '',
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING' as const
    };
    addAppointment(finalApt);
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

    const patient = patients.find(p => p.id === convertApt.patientId);
    const therapist = users.find(u => u.id === convertApt.therapistId);

    addSession({
        id: Math.random().toString(36).substr(2, 9),
        patientId: convertApt.patientId,
        therapistId: convertApt.therapistId,
        date: convertApt.date,
        startTime: convertApt.time,
        durationMinutes: convertApt.durationMinutes,
        status: 'COMPLETED',
        activities: convertForm.activities || '',
        progressNotes: convertForm.progressNotes || '',
        homework: convertForm.homework || '',
        cost: patient?.costPerSession || 0,
        therapistPayment: therapist?.paymentPerSession || 0
    });

    deleteAppointment(convertApt.id);
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Pacientes Ativos" 
          value={activePatientsCount} 
          subtitle="↗ +2 este mês" 
          icon={Users} 
          colorClass="bg-blue-100 text-blue-600"
          onClick={() => setActiveStatModal('patients')}
        />
        <StatCard 
          title="Sessões este Mês" 
          value={monthSessions.length} 
          subtitle="↗ +12% vs média" 
          icon={MessageSquare} 
          colorClass="bg-purple-100 text-purple-600"
          onClick={() => setActiveStatModal('sessions')}
        />
        <StatCard 
          title="Próx. Agendamentos" 
          value={upcomingAppointmentsCount} 
          subtitle={`↗ Hoje: ${todaysAppointments.length}`} 
          icon={Calendar} 
          colorClass="bg-orange-100 text-orange-600"
          onClick={() => setActiveStatModal('appointments')}
        />
        <StatCard 
          title={isAdmin ? "Receita Total" : "Meus Ganhos"}
          value={`€${monthRevenue.toFixed(2)}`} 
          subtitle="↗ 85% da meta" 
          icon={Euro} 
          colorClass="bg-green-100 text-green-600"
          onClick={() => setActiveStatModal('financial')}
        />
      </div>

      {/* Quick Actions */}
      <div>
         <h2 className="text-lg font-bold text-gray-900 mb-3 md:mb-4">Ações Rápidas</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction 
              title="Novo Paciente" 
              desc="Adicionar ficha" 
              onClick={handleOpenPatientModal}
              icon={Plus} 
              colorClass="bg-blue-100 text-blue-600" 
            />
            <QuickAction 
              title="Registar Sessão" 
              desc="Notas de evolução" 
              onClick={handleOpenSessionModal}
              icon={MessageSquare} 
              colorClass="bg-purple-100 text-purple-600" 
            />
            <QuickAction 
              title="Agendar" 
              desc="Ver agenda" 
              onClick={handleOpenAppointmentModal}
              icon={Calendar} 
              colorClass="bg-orange-100 text-orange-600" 
            />
            <QuickAction 
              title="Faturação" 
              desc="Ver finanças" 
              to="/billing" 
              icon={Euro} 
              colorClass="bg-green-100 text-green-600" 
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
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{todaysAppointments.length}</span>
              </h2>
              <button 
                onClick={() => navigate('/calendar')}
                className="px-3 py-1 bg-white text-gray-600 hover:text-[#1e3a5f] text-xs font-medium rounded-full shadow-sm border border-gray-100 hover:shadow transition-all"
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
                        const patient = patients.find(p => p.id === apt.patientId);
                        return (
                            <div key={apt.id} className="flex items-center justify-between p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-100 group">
                                <div className="flex items-start flex-1 min-w-0">
                                    <div className="bg-white p-2 rounded-lg text-center min-w-[55px] mr-3 shadow-sm">
                                        <span className="block text-sm font-bold text-[#1e3a5f]">{apt.time}</span>
                                        <span className="block text-[10px] text-gray-500">{apt.durationMinutes}m</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{patient?.name}</h4>
                                        <p className="text-xs text-gray-600 mt-1 truncate">{apt.notes || 'Sessão agendada'}</p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500 truncate">
                                            <User size={12} className="mr-1 flex-shrink-0" />
                                            {getTherapistName(apt.therapistId)}
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
              className="px-3 py-1 bg-white text-gray-600 hover:text-[#1e3a5f] text-xs font-medium rounded-full shadow-sm border border-gray-100 hover:shadow transition-all flex items-center"
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
                const patient = patients.find(p => p.id === session.patientId);
                return (
                  <div 
                    key={session.id} 
                    onClick={() => setViewSession(session)}
                    className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center min-w-0">
                      <div className="h-10 w-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        {patient?.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{patient?.name}</p>
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

      {/* --- MODALS (Updated for better Mobile text visibility) --- */}
      
      {/* Stat Details Modal */}
      <Modal 
        isOpen={!!activeStatModal} 
        onClose={() => setActiveStatModal(null)} 
        title={
            activeStatModal === 'patients' ? 'Pacientes Ativos' :
            activeStatModal === 'sessions' ? 'Sessões do Mês' :
            activeStatModal === 'appointments' ? 'Agendamentos' :
            isAdmin ? 'Receita Mensal' : 'Meus Ganhos'
        } 
        maxWidth="lg"
      >
        <div className="overflow-y-auto max-h-[60vh] space-y-3 p-1">
           {activeStatModal === 'patients' && (
              <>
                {myPatients.filter(p => p.active).length === 0 ? (
                  <div className="text-center text-gray-400 py-8">Nenhum paciente ativo.</div>
                ) : (
                  myPatients.filter(p => p.active).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{p.name}</h4>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs text-gray-700">
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

           {/* Similar updates for other modal sections to ensure text-gray-900 and responsiveness... */}
           {activeStatModal === 'sessions' && (
             <>
               {monthSessions.length === 0 ? (
                 <div className="text-center text-gray-400 py-8">Sem sessões.</div>
               ) : (
                 monthSessions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(s => (
                   <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="bg-purple-50 p-2 rounded-lg text-purple-600 flex-shrink-0">
                           <Calendar size={18} />
                         </div>
                         <div className="min-w-0">
                           <h4 className="font-bold text-gray-900 text-sm truncate">{getPatientName(s.patientId)}</h4>
                           <p className="text-xs text-gray-700 truncate">
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
                    <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl shadow-sm">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-orange-50 p-2 rounded-lg text-orange-600 text-center min-w-[40px] flex-shrink-0">
                             <span className="block font-bold text-xs">{a.time}</span>
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-bold text-gray-900 text-sm truncate">{getPatientName(a.patientId)}</h4>
                             <p className="text-xs text-gray-700 truncate">{format(new Date(a.date), 'dd/MM')} • {a.durationMinutes} min</p>
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
                           <h4 className="font-bold text-gray-900 text-sm truncate">{getPatientName(s.patientId)}</h4>
                           <p className="text-xs text-gray-700 truncate">{format(new Date(s.date), 'dd/MM')} {isAdmin && `• ${getTherapistName(s.therapistId).split(' ')[0]}`}</p>
                        </div>
                     </div>
                     <span className="font-bold text-gray-900 text-sm ml-2">€{(isAdmin ? s.cost : s.therapistPayment).toFixed(2)}</span>
                  </div>
               ))}
               <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-200 mt-4">
                   <span className="font-bold text-gray-700 text-sm">Total</span>
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
                  {getPatientName(viewSession.patientId).charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getPatientName(viewSession.patientId)}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(viewSession.date), 'dd/MM/yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {viewSession.startTime} ({viewSession.durationMinutes} min)</span>
                  </div>
                </div>
             </div>
             
             {/* ... Mobile optimized grids for details ... */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Terapeuta</p>
                   <p className="font-medium text-gray-900">{getTherapistName(viewSession.therapistId)}</p>
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
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Novo Paciente" maxWidth="2xl">
        <form onSubmit={handlePatientSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Completo *" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} required />
            <Input label="Data de Nascimento *" type="date" value={patientForm.birthDate} onChange={e => setPatientForm({...patientForm, birthDate: e.target.value})} required />
            <Input label="Idade" type="number" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: parseInt(e.target.value)})} />
            <Input label="Nome do Responsável *" value={patientForm.responsibleName} onChange={e => setPatientForm({...patientForm, responsibleName: e.target.value})} required />
            <Input label="Telefone" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} />
            <Input label="Email" type="email" value={patientForm.email} onChange={e => setPatientForm({...patientForm, email: e.target.value})} />
          </div>
          {/* ... rest of form ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta</label>
               {isAdmin ? (
                   <select 
                     className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                     value={patientForm.therapistId}
                     onChange={e => setPatientForm({...patientForm, therapistId: e.target.value})}
                   >
                     <option value="">Selecione</option>
                     {users.filter(u => u.role === UserRole.THERAPIST).map(u => (
                       <option key={u.id} value={u.id}>{u.name}</option>
                     ))}
                   </select>
               ) : (
                   <Input value={currentUser?.name} disabled className="bg-gray-100" />
               )}
             </div>
             {isAdmin && (
                <Input label="Custo por Sessão (€)" type="number" value={patientForm.costPerSession} onChange={e => setPatientForm({...patientForm, costPerSession: parseFloat(e.target.value)})} />
             )}
          </div>
          
          <Input label="Diagnóstico" value={patientForm.diagnosis} onChange={e => setPatientForm({...patientForm, diagnosis: e.target.value})} />
          <Input label="Morada" value={patientForm.address} onChange={e => setPatientForm({...patientForm, address: e.target.value})} />
          <TextArea label="Observações Clínicas" rows={3} value={patientForm.clinicalNotes} onChange={e => setPatientForm({...patientForm, clinicalNotes: e.target.value})} />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsPatientModalOpen(false)}>Cancelar</Button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <select 
                      className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                      value={sessionForm.patientId}
                      onChange={(e) => handleSessionPatientChange(e.target.value)}
                      required
                  >
                      <option value="">Selecione</option>
                      {myPatients.filter(p => p.active).map(p => (
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                        value={aptForm.patientId}
                        onChange={e => setAptForm({...aptForm, patientId: e.target.value})}
                        required
                    >
                        <option value="">Selecione</option>
                        {myPatients.filter(p => p.active).map(p => (
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
              Convertendo agendamento de <strong>{patients.find(p => p.id === convertApt?.patientId)?.name}</strong>.
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
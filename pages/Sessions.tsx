import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Session, UserRole, Appointment, SessionType } from '../types';
import { Plus, Search, Calendar, Clock, User, FileText, Euro, Edit2, Trash2, AlertTriangle, Check, Filter, X, Tag, List } from 'lucide-react';
import { format, isWithinInterval, endOfDay } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import startOfDay from 'date-fns/startOfDay';

// Tipo auxiliar para a lista unificada
type UnifiedSessionItem = {
  type: 'SESSION' | 'APPOINTMENT';
  id: string;
  patientId: string;
  therapistId: string;
  date: string;
  time: string; // startTime ou time
  durationMinutes: number;
  summary: string; // activities ou notes
  status: string; // 'COMPLETED' | 'PENDING' | etc
  originalData: Session | Appointment;
  sessionTypeId?: string;
};

export const Sessions: React.FC = () => {
  const { 
    sessions, appointments, patients, users, currentUser, sessionTypes,
    addSession, updateSession, deleteSession,
    addAppointment, updateAppointment, deleteAppointment,
    addSessionType, updateSessionType, deleteSessionType,
    showToast
  } = useApp();

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal Sessão
  const [isAptModalOpen, setIsAptModalOpen] = useState(false); // Modal Agendamento
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false); // Modal Conversão
  const [isSessionTypeModalOpen, setIsSessionTypeModalOpen] = useState(false); // Modal Tipo Sessão
  const [viewSession, setViewSession] = useState<Session | null>(null); // Modal Ver Detalhes

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'SCHEDULED'>('ALL');
  const [therapistFilter, setTherapistFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit/Delete States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'SESSION' | 'APPOINTMENT' | 'SESSION_TYPE'} | null>(null);
  const [itemToConvert, setItemToConvert] = useState<Appointment | null>(null);
  const [editingSessionType, setEditingSessionType] = useState<SessionType | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // --- FORMS ---
  const initialSessionForm: Omit<Session, 'id'> = {
    patientId: '', therapistId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', durationMinutes: 45, activities: '', progressNotes: '', homework: '', status: 'COMPLETED', cost: 0, therapistPayment: 0, sessionTypeId: ''
  };
  const [sessionFormData, setSessionFormData] = useState(initialSessionForm);

  const initialAptForm: Omit<Appointment, 'id' | 'status'> = {
    patientId: '', therapistId: currentUser?.id || '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', durationMinutes: 45, notes: '', sessionTypeId: ''
  };
  const [aptFormData, setAptFormData] = useState(initialAptForm);

  const [convertFormData, setConvertFormData] = useState({ activities: '', progressNotes: '', homework: '' });

  const initialSessionTypeForm: SessionType = {
      id: '',
      name: '',
      defaultDuration: 45,
      defaultCost: 40,
      active: true
  };
  const [sessionTypeForm, setSessionTypeForm] = useState(initialSessionTypeForm);


  // --- DATA PREPARATION ---

  // 1. Unify Lists
  const unifiedList: UnifiedSessionItem[] = useMemo(() => {
    const mappedSessions: UnifiedSessionItem[] = sessions.map(s => ({
      type: 'SESSION',
      id: s.id,
      patientId: s.patientId,
      therapistId: s.therapistId,
      date: s.date,
      time: s.startTime,
      durationMinutes: s.durationMinutes,
      summary: s.activities,
      status: 'COMPLETED',
      originalData: s,
      sessionTypeId: s.sessionTypeId
    }));

    const mappedAppointments: UnifiedSessionItem[] = appointments
      .filter(a => a.status === 'PENDING') // Only show pending appointments here
      .map(a => ({
        type: 'APPOINTMENT',
        id: a.id,
        patientId: a.patientId,
        therapistId: a.therapistId,
        date: a.date,
        time: a.time,
        durationMinutes: a.durationMinutes,
        summary: a.notes || 'Agendamento',
        status: 'SCHEDULED',
        originalData: a,
        sessionTypeId: a.sessionTypeId
      }));

    return [...mappedSessions, ...mappedAppointments];
  }, [sessions, appointments]);

  // 2. Filter List
  const filteredList = useMemo(() => {
    return unifiedList.filter(item => {
      // Role Filter
      if (isAdmin) {
         if (therapistFilter !== 'ALL' && item.therapistId !== therapistFilter) return false;
      } else {
         if (item.therapistId !== currentUser?.id) return false;
      }

      // Text Search
      const patientName = patients.find(p => p.id === item.patientId)?.name || '';
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'COMPLETED' && item.type !== 'SESSION') return false;
      if (statusFilter === 'SCHEDULED' && item.type !== 'APPOINTMENT') return false;

      // Date Range Filter
      if (startDate || endDate) {
        const itemDate = parseISO(item.date);
        const start = startDate ? startOfDay(parseISO(startDate)) : new Date(1900, 0, 1);
        const end = endDate ? endOfDay(parseISO(endDate)) : new Date(2100, 0, 1);
        if (!isWithinInterval(itemDate, { start, end })) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [unifiedList, searchTerm, statusFilter, therapistFilter, startDate, endDate, isAdmin, currentUser, patients]);


  // --- HANDLERS ---

  // Session Type Management Handlers
  const handleOpenSessionTypeModal = (type?: SessionType) => {
      if (type) {
          setEditingSessionType(type);
          setSessionTypeForm(type);
      } else {
          setEditingSessionType(null);
          setSessionTypeForm(initialSessionTypeForm);
      }
      setIsSessionTypeModalOpen(true);
  };

  const handleSessionTypeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSessionType) {
          updateSessionType({ ...sessionTypeForm, id: editingSessionType.id });
          showToast('Tipo de sessão atualizado com sucesso!');
      } else {
          addSessionType({ ...sessionTypeForm, id: Math.random().toString(36).substr(2, 9) });
          showToast('Tipo de sessão criado com sucesso!');
      }
      setIsSessionTypeModalOpen(false);
  };

  const handleDeleteClick = (id: string, type: 'SESSION' | 'APPOINTMENT' | 'SESSION_TYPE') => {
      setItemToDelete({ id, type });
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (!itemToDelete) return;
      
      if (itemToDelete.type === 'SESSION') {
          deleteSession(itemToDelete.id);
          showToast('Sessão removida com sucesso!', 'info');
      }
      else if (itemToDelete.type === 'APPOINTMENT') {
          deleteAppointment(itemToDelete.id);
          showToast('Agendamento removido com sucesso!', 'info');
      }
      else if (itemToDelete.type === 'SESSION_TYPE') {
          deleteSessionType(itemToDelete.id);
          showToast('Tipo de sessão removido com sucesso!', 'info');
      }

      setIsDeleteModalOpen(false);
      setItemToDelete(null);
  };

  // Session/Apt Handlers
  const handleOpenSessionModal = (session?: Session) => {
    if (session) {
        setEditingId(session.id);
        setSessionFormData(session);
    } else {
        setEditingId(null);
        setSessionFormData({ ...initialSessionForm, therapistId: currentUser?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenAptModal = (apt?: Appointment) => {
    if (apt) {
        setEditingId(apt.id);
        setAptFormData(apt);
    } else {
        setEditingId(null);
        setAptFormData({ ...initialAptForm, therapistId: currentUser?.id || '' });
    }
    setIsAptModalOpen(true);
  };

  const handleSessionTypeChangeInForm = (typeId: string, isSessionForm: boolean) => {
      const sType = sessionTypes.find(t => t.id === typeId);
      if (isSessionForm) {
          setSessionFormData(prev => ({
              ...prev,
              sessionTypeId: typeId,
              durationMinutes: sType ? sType.defaultDuration : prev.durationMinutes
          }));
      } else {
          setAptFormData(prev => ({
              ...prev,
              sessionTypeId: typeId,
              durationMinutes: sType ? sType.defaultDuration : prev.durationMinutes
          }));
      }
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Recalculate cost based on type or patient custom price
      const patient = patients.find(p => p.id === sessionFormData.patientId);
      const sType = sessionTypes.find(t => t.id === sessionFormData.sessionTypeId);
      
      let cost = 0;
      if (patient) {
          // Check custom price first
          if (patient.customPrices && sessionFormData.sessionTypeId && patient.customPrices[sessionFormData.sessionTypeId]) {
              cost = patient.customPrices[sessionFormData.sessionTypeId];
          } else if (patient.costPerSession > 0) {
              cost = patient.costPerSession; // Legacy fallback
          } else if (sType) {
              cost = sType.defaultCost;
          }
      }

      const therapist = users.find(u => u.id === (isAdmin ? sessionFormData.therapistId : currentUser?.id));
      
      const payload = {
          ...sessionFormData,
          cost,
          therapistPayment: therapist?.paymentPerSession || 0,
          id: editingId || Math.random().toString(36).substr(2, 9)
      };

      if (editingId) {
          updateSession(payload as Session);
          showToast('Sessão atualizada com sucesso!');
      } else {
          addSession(payload as Session);
          showToast('Sessão registada com sucesso!');
      }

      setIsModalOpen(false);
  };

  const handleAptSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
          ...aptFormData,
          status: 'PENDING' as const,
          id: editingId || Math.random().toString(36).substr(2, 9)
      };

      if (editingId) {
          updateAppointment(payload as Appointment);
          showToast('Agendamento atualizado!');
      } else {
          addAppointment(payload as Appointment);
          showToast('Agendamento criado!');
      }

      setIsAptModalOpen(false);
  };

  // Conversion Logic
  const initiateConversion = (apt: Appointment) => {
      setItemToConvert(apt);
      setConvertFormData({ activities: '', progressNotes: '', homework: '' });
      setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemToConvert) return;

      const patient = patients.find(p => p.id === itemToConvert.patientId);
      const therapist = users.find(u => u.id === itemToConvert.therapistId);
      const sType = sessionTypes.find(t => t.id === itemToConvert.sessionTypeId);

      let cost = 0;
      if (patient) {
          if (patient.customPrices && itemToConvert.sessionTypeId && patient.customPrices[itemToConvert.sessionTypeId]) {
              cost = patient.customPrices[itemToConvert.sessionTypeId];
          } else if (patient.costPerSession > 0) {
              cost = patient.costPerSession;
          } else if (sType) {
              cost = sType.defaultCost;
          }
      }

      addSession({
          id: Math.random().toString(36).substr(2, 9),
          patientId: itemToConvert.patientId,
          therapistId: itemToConvert.therapistId,
          sessionTypeId: itemToConvert.sessionTypeId,
          date: itemToConvert.date,
          startTime: itemToConvert.time,
          durationMinutes: itemToConvert.durationMinutes,
          status: 'COMPLETED',
          activities: convertFormData.activities,
          progressNotes: convertFormData.progressNotes,
          homework: convertFormData.homework,
          cost: cost,
          therapistPayment: therapist?.paymentPerSession || 0
      });

      deleteAppointment(itemToConvert.id);
      showToast('Sessão concluída com sucesso!');
      setIsConvertModalOpen(false);
      setItemToConvert(null);
  };

  // Helpers
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Desconhecido';
  const getTherapistName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';
  const getSessionTypeName = (id?: string) => sessionTypes.find(t => t.id === id)?.name || 'Padrão';

  return (
    <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-[#1e3a5f]">Sessões</h1>
                <p className="text-gray-500">{filteredList.length} registos encontrados</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleOpenSessionModal()}>
                    <Plus size={18} className="mr-2" /> Registar Sessão
                </Button>
            </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Pesquisar por paciente..."
                    className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
                 {isAdmin && (
                    <div className="relative">
                        <select
                            className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#1e3a5f] appearance-none cursor-pointer"
                            value={therapistFilter}
                            onChange={(e) => setTherapistFilter(e.target.value)}
                        >
                            <option value="ALL">Todos Terapeutas</option>
                            {users.filter(u => u.role === UserRole.THERAPIST).map(u => (
                                <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                 )}

                 <div className="relative">
                    <select
                        className="bg-white text-gray-700 border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#1e3a5f] appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">Todos Estados</option>
                        <option value="COMPLETED">Realizadas</option>
                        <option value="SCHEDULED">Agendadas</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                 </div>

                 <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs focus:outline-none w-24" />
                    <span className="text-gray-400">-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs focus:outline-none w-24" />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                        </button>
                    )}
                 </div>
            </div>
        </div>

        {/* Unified List */}
        <div className="space-y-4">
            {filteredList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    Nenhum registo encontrado com os filtros atuais.
                </div>
            ) : (
                filteredList.map(item => {
                    const patientName = getPatientName(item.patientId);
                    const therapistName = getTherapistName(item.therapistId);
                    const isSession = item.type === 'SESSION';

                    return (
                        <div key={`${item.type}-${item.id}`} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all ${isSession ? 'border-l-green-500' : 'border-l-orange-400'}`}>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1 cursor-pointer" onClick={() => isSession && setViewSession(item.originalData as Session)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isSession ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isSession ? 'Realizada' : 'Agendada'}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12}/> {format(new Date(item.date), 'dd/MM/yyyy')}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock size={12}/> {item.time} ({item.durationMinutes} min)
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900">{patientName}</h3>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                                        {isAdmin && <span className="flex items-center gap-1"><User size={14}/> {therapistName}</span>}
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 rounded text-xs border border-gray-200">
                                            <Tag size={12}/> {getSessionTypeName(item.sessionTypeId)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-2 italic truncate">
                                        {item.summary}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                                    {!isSession && (
                                        <Button 
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                                            onClick={() => initiateConversion(item.originalData as Appointment)}
                                        >
                                            <Check size={16} className="mr-1" /> Concluir
                                        </Button>
                                    )}
                                    
                                    <button 
                                        onClick={() => isSession ? handleOpenSessionModal(item.originalData as Session) : handleOpenAptModal(item.originalData as Appointment)}
                                        className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleDeleteClick(item.id, item.type)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Apagar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Admin: Session Types Management */}
        {isAdmin && (
            <div className="mt-12 border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#1e3a5f] flex items-center gap-2">
                            <Tag size={20}/> Gestão de Tipos de Sessão
                        </h2>
                        <p className="text-sm text-gray-500">Configure os serviços e preços base.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenSessionTypeModal()}>
                        <Plus size={16} className="mr-2"/> Novo Tipo
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
                            <tr>
                                <th className="p-4">Nome do Serviço</th>
                                <th className="p-4">Duração Padrão</th>
                                <th className="p-4">Custo Base</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessionTypes.map(type => (
                                <tr key={type.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{type.name}</td>
                                    <td className="p-4 text-gray-600">{type.defaultDuration} min</td>
                                    <td className="p-4 text-gray-600 font-medium">€{type.defaultCost.toFixed(2)}</td>
                                    <td className="p-4 flex justify-end gap-2">
                                        <button onClick={() => handleOpenSessionTypeModal(type)} className="text-gray-400 hover:text-[#1e3a5f]"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDeleteClick(type.id, 'SESSION_TYPE')} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- MODALS --- */}

        {/* Session Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Sessão" : "Registar Sessão"} maxWidth="lg">
            <form onSubmit={handleSessionSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Paciente *</label>
                      <select 
                          className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                          value={sessionFormData.patientId}
                          onChange={(e) => setSessionFormData({...sessionFormData, patientId: e.target.value})}
                          required
                      >
                          <option value="">Selecione</option>
                          {(isAdmin ? patients : patients.filter(p => p.therapistId === currentUser?.id)).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                  </div>
                  {isAdmin && (
                      <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Terapeuta</label>
                          <select 
                              className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                              value={sessionFormData.therapistId}
                              onChange={(e) => setSessionFormData({...sessionFormData, therapistId: e.target.value})}
                          >
                              {users.filter(u => u.role === UserRole.THERAPIST).map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                          </select>
                      </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <Input label="Data *" type="date" value={sessionFormData.date} onChange={e => setSessionFormData({...sessionFormData, date: e.target.value})} required />
                   <Input label="Hora *" type="time" value={sessionFormData.startTime} onChange={e => setSessionFormData({...sessionFormData, startTime: e.target.value})} required />
                   <Input label="Duração (min) *" type="number" value={sessionFormData.durationMinutes} onChange={e => setSessionFormData({...sessionFormData, durationMinutes: parseInt(e.target.value)})} required />
               </div>

               <div>
                   <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Sessão</label>
                   <select 
                       className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                       value={sessionFormData.sessionTypeId || ''}
                       onChange={(e) => handleSessionTypeChangeInForm(e.target.value, true)}
                   >
                       <option value="">Personalizado</option>
                       {sessionTypes.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                       ))}
                   </select>
               </div>

               <TextArea label="Atividades Realizadas *" rows={3} value={sessionFormData.activities} onChange={e => setSessionFormData({...sessionFormData, activities: e.target.value})} required />
               <TextArea label="Notas de Progresso" rows={2} value={sessionFormData.progressNotes} onChange={e => setSessionFormData({...sessionFormData, progressNotes: e.target.value})} />
               <TextArea label="Trabalho de Casa" rows={2} value={sessionFormData.homework} onChange={e => setSessionFormData({...sessionFormData, homework: e.target.value})} />
               
               <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
               </div>
            </form>
        </Modal>

        {/* Appointment Modal */}
        <Modal isOpen={isAptModalOpen} onClose={() => setIsAptModalOpen(false)} title={editingId ? "Editar Agendamento" : "Novo Agendamento"}>
             <form onSubmit={handleAptSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Paciente *</label>
                        <select 
                            className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                            value={aptFormData.patientId}
                            onChange={e => setAptFormData({...aptFormData, patientId: e.target.value})}
                            required
                        >
                            <option value="">Selecione</option>
                            {(isAdmin ? patients : patients.filter(p => p.therapistId === currentUser?.id)).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    {isAdmin && (
                      <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">Terapeuta</label>
                          <select 
                              className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                              value={aptFormData.therapistId}
                              onChange={(e) => setAptFormData({...aptFormData, therapistId: e.target.value})}
                          >
                              {users.filter(u => u.role === UserRole.THERAPIST).map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                          </select>
                      </div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Data *" type="date" value={aptFormData.date} onChange={e => setAptFormData({...aptFormData, date: e.target.value})} required />
                    <Input label="Hora *" type="time" value={aptFormData.time} onChange={e => setAptFormData({...aptFormData, time: e.target.value})} required />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Sessão</label>
                   <select 
                       className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                       value={aptFormData.sessionTypeId || ''}
                       onChange={(e) => handleSessionTypeChangeInForm(e.target.value, false)}
                   >
                       <option value="">Personalizado</option>
                       {sessionTypes.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                       ))}
                   </select>
                </div>
                
                <Input label="Duração (min)" type="number" value={aptFormData.durationMinutes} onChange={e => setAptFormData({...aptFormData, durationMinutes: parseInt(e.target.value)})} required />
                <TextArea label="Observações" value={aptFormData.notes} onChange={e => setAptFormData({...aptFormData, notes: e.target.value})} />
                
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsAptModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>

        {/* Convert Modal */}
        <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Concluir Sessão">
             <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                Confirme os detalhes da sessão realizada para <strong>{getPatientName(itemToConvert?.patientId || '')}</strong>.
             </div>
             <form onSubmit={handleConvertSubmit} className="space-y-4">
                <TextArea label="Atividades Realizadas *" rows={3} value={convertFormData.activities} onChange={e => setConvertFormData({...convertFormData, activities: e.target.value})} required />
                <TextArea label="Notas de Progresso" rows={2} value={convertFormData.progressNotes} onChange={e => setConvertFormData({...convertFormData, progressNotes: e.target.value})} />
                <TextArea label="Trabalho de Casa" rows={2} value={convertFormData.homework} onChange={e => setConvertFormData({...convertFormData, homework: e.target.value})} />
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Confirmar Realização</Button>
                </div>
            </form>
        </Modal>

        {/* Session Type Modal */}
        <Modal isOpen={isSessionTypeModalOpen} onClose={() => setIsSessionTypeModalOpen(false)} title={editingSessionType ? "Editar Tipo de Sessão" : "Novo Tipo de Sessão"}>
             <form onSubmit={handleSessionTypeSubmit} className="space-y-4">
                 <Input label="Nome do Serviço *" value={sessionTypeForm.name} onChange={e => setSessionTypeForm({...sessionTypeForm, name: e.target.value})} required />
                 <div className="grid grid-cols-2 gap-4">
                     <Input label="Duração Padrão (min) *" type="number" value={sessionTypeForm.defaultDuration} onChange={e => setSessionTypeForm({...sessionTypeForm, defaultDuration: parseInt(e.target.value)})} required />
                     <Input label="Custo Base (€) *" type="number" step="0.01" value={sessionTypeForm.defaultCost} onChange={e => setSessionTypeForm({...sessionTypeForm, defaultCost: parseFloat(e.target.value)})} required />
                 </div>
                 <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsSessionTypeModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Guardar</Button>
                 </div>
             </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminação" maxWidth="sm">
            <div className="text-center p-2">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Apagar Registo?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Tem a certeza que deseja apagar este item? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-center gap-3">
                    <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmDelete}>Apagar</Button>
                </div>
            </div>
        </Modal>

        {/* View Detail Modal */}
        <Modal isOpen={!!viewSession} onClose={() => setViewSession(null)} title="Detalhes da Sessão">
            {viewSession && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                        <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
                            {getPatientName(viewSession.patientId).charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{getPatientName(viewSession.patientId)}</h3>
                            <div className="flex gap-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Calendar size={14}/> {format(new Date(viewSession.date), 'dd/MM/yyyy')}</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> {viewSession.startTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Tipo de Sessão</p>
                            <p className="font-medium text-gray-900">{getSessionTypeName(viewSession.sessionTypeId)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Valor</p>
                            <p className="font-medium text-gray-900">€{viewSession.cost.toFixed(2)}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText size={16} className="text-blue-600"/> Atividades</h4>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{viewSession.activities}</div>
                    </div>

                    {viewSession.progressNotes && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Notas de Progresso</h4>
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">{viewSession.progressNotes}</div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-50">
                        <Button variant="secondary" onClick={() => setViewSession(null)}>Fechar</Button>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};
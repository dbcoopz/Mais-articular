
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, TextArea } from '../components/ui/Input';
import { Appointment, Session, UserRole } from '../types';
import { ChevronLeft, ChevronRight, Plus, Check, Calendar as CalendarIcon, List, Clock, FileText, User, Euro, Trash2, Edit2, ArrowRight, HelpCircle, Tag, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  isToday, 
  addWeeks
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import subWeeks from 'date-fns/subWeeks';
import pt from 'date-fns/locale/pt';

// Unified type for display
type CalendarItem = {
    type: 'SESSION' | 'APPOINTMENT';
    id: string;
    date: string;
    time: string;
    duration: number;
    utenteId: string;
    profissionalId: string;
    notes: string;
    original: Session | Appointment;
};

export const CalendarPage: React.FC = () => {
  const { 
      appointments, sessions, utentes, 
      addAppointment, addAppointmentSeries, 
      updateAppointment, updateAppointmentSeries, 
      deleteAppointment, 
      addSession, users, currentUser, deleteSession, sessionTypes, showToast 
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); // New/Edit Appointment
  const [viewSession, setViewSession] = useState<Session | null>(null); // View History
  const [isSeriesUpdateModalOpen, setIsSeriesUpdateModalOpen] = useState(false); // Confirm Series Update
  
  const [editingAptId, setEditingAptId] = useState<string | null>(null);

  // Repeat State for New Appointment
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [repeatUntilDate, setRepeatUntilDate] = useState('');

  // Drag and Drop State
  const [draggedAptId, setDraggedAptId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string, time: string, apt: Appointment } | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // --- DATA MERGING ---
  const calendarItems: CalendarItem[] = useMemo(() => {
      const rawAppointments = appointments.filter(a => a.status === 'PENDING').map(a => ({
          type: 'APPOINTMENT' as const,
          id: a.id,
          date: a.date,
          time: a.time,
          duration: a.durationMinutes,
          utenteId: a.utenteId,
          profissionalId: a.profissionalId,
          notes: a.notes,
          original: a
      }));

      const rawSessions = sessions.map(s => ({
          type: 'SESSION' as const,
          id: s.id,
          date: s.date,
          time: s.startTime,
          duration: s.durationMinutes,
          utenteId: s.utenteId,
          profissionalId: s.profissionalId,
          notes: s.activities, // Use activities as summary
          original: s
      }));

      const allItems = [...rawAppointments, ...rawSessions];

      // Filter based on role
      if (isAdmin) return allItems;
      return allItems.filter(i => i.profissionalId === currentUser?.id);
  }, [appointments, sessions, isAdmin, currentUser]);


  // Appointment Form State
  const [aptForm, setAptForm] = useState<Omit<Appointment, 'id' | 'status'>>({
      utenteId: '',
      profissionalId: currentUser?.id || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      durationMinutes: 60,
      notes: '',
      sessionTypeId: '',
      groupId: ''
  });

  // Navigation Logic
  const handlePrev = () => {
      if (view === 'month') {
          setCurrentDate(subMonths(currentDate, 1));
      } else {
          setCurrentDate(subWeeks(currentDate, 1));
      }
  };

  const handleNext = () => {
      if (view === 'month') {
          setCurrentDate(addMonths(currentDate, 1));
      } else {
          setCurrentDate(addWeeks(currentDate, 1));
      }
  };

  // Date Calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const monthDays = eachDayOfInterval({ 
      start: startOfWeek(monthStart, { weekStartsOn: 1 }), 
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }) 
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Hours for Week View (08:00 to 18:00)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const handleDayClick = (day: Date) => {
      setSelectedDate(day);
  };

  const handleCellClick = (day: Date, hour: number) => {
      setEditingAptId(null);
      setIsRepeatEnabled(false);
      setRepeatUntilDate('');
      setAptForm({
          ...aptForm,
          date: format(day, 'yyyy-MM-dd'),
          time: `${hour.toString().padStart(2, '0')}:00`,
          profissionalId: currentUser?.id || '',
          sessionTypeId: '',
          groupId: ''
      });
      setIsModalOpen(true);
  };

  const openNewAptModal = () => {
      setEditingAptId(null);
      setIsRepeatEnabled(false);
      setRepeatUntilDate('');
      setAptForm({
          ...aptForm,
          date: format(selectedDate, 'yyyy-MM-dd'),
          profissionalId: currentUser?.id || '',
          sessionTypeId: '',
          groupId: ''
      });
      setIsModalOpen(true);
  };

  const handleEditApt = (e: React.MouseEvent, apt: Appointment) => {
      e.stopPropagation(); // Prevent navigating to utente detail
      setEditingAptId(apt.id);
      setIsRepeatEnabled(false); // Reset repeat UI on edit
      setAptForm({
          utenteId: apt.utenteId,
          profissionalId: apt.profissionalId,
          date: apt.date,
          time: apt.time,
          durationMinutes: apt.durationMinutes,
          notes: apt.notes,
          sessionTypeId: apt.sessionTypeId || '',
          groupId: apt.groupId
      });
      setIsModalOpen(true);
  };

  const handleAptTypeChange = (typeId: string) => {
      const sType = sessionTypes.find(t => t.id === typeId);
      setAptForm(prev => ({
          ...prev,
          sessionTypeId: typeId,
          durationMinutes: sType ? sType.defaultDuration : prev.durationMinutes
      }));
  };

  // Filter available Session Types based on the selected Professional's Specialty
  const getAvailableSessionTypes = (profissionalId: string) => {
      if (!profissionalId) return sessionTypes;
      const profissional = users.find(u => u.id === profissionalId);
      if (!profissional || !profissional.specialtyId) return sessionTypes;
      return sessionTypes.filter(t => t.specialtyId === profissional.specialtyId);
  };

  const submitAppointment = (e: React.FormEvent) => {
      e.preventDefault();
      
      const payload = {
          ...aptForm,
          profissionalId: isAdmin ? aptForm.profissionalId : currentUser?.id || '',
          id: editingAptId || Math.random().toString(36).substr(2, 9),
          status: 'PENDING' as const
      };

      if (editingAptId) {
          // EDIT MODE
          // Check if it's part of a series
          if (aptForm.groupId) {
              setIsModalOpen(false);
              setIsSeriesUpdateModalOpen(true);
              return;
          }

          updateAppointment(payload);
          showToast('Agendamento atualizado com sucesso!');
      } else {
          // CREATE MODE
          if (isRepeatEnabled && repeatUntilDate) {
              // Create Series
              addAppointmentSeries(payload, repeatUntilDate);
              showToast('Série de agendamentos criada com sucesso!');
          } else {
              // Create Single
              addAppointment(payload);
              showToast('Agendamento criado com sucesso!');
          }
      }
      
      setIsModalOpen(false);
      setEditingAptId(null);
  };

  const handleSeriesUpdateDecision = (updateAll: boolean) => {
      const payload = {
          ...aptForm,
          profissionalId: isAdmin ? aptForm.profissionalId : currentUser?.id || '',
          id: editingAptId || '',
          status: 'PENDING' as const
      };

      if (updateAll) {
          updateAppointmentSeries(payload);
          showToast('Série de agendamentos atualizada!');
      } else {
          updateAppointment(payload);
          showToast('Agendamento atualizado!');
      }
      setIsSeriesUpdateModalOpen(false);
      setEditingAptId(null);
  };

  // --- DRAG AND DROP LOGIC ---

  const handleDragStart = (e: React.DragEvent, aptId: string) => {
      setDraggedAptId(aptId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
      e.preventDefault();
      if (!draggedAptId) return;

      const originalApt = appointments.find(a => a.id === draggedAptId);
      if (!originalApt) return;

      const newDateStr = format(day, 'yyyy-MM-dd');
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const height = rect.height;
      const segment = Math.min(3, Math.max(0, Math.floor((offsetY / height) * 4)));
      const minutes = segment * 15;
      const newTimeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      if (originalApt.date === newDateStr && originalApt.time === newTimeStr) {
          setDraggedAptId(null);
          return;
      }

      setDropTarget({
          date: newDateStr,
          time: newTimeStr,
          apt: originalApt
      });
      setDraggedAptId(null);
  };

  const confirmDrop = () => {
      if (dropTarget) {
          updateAppointment({
              ...dropTarget.apt,
              date: dropTarget.date,
              time: dropTarget.time
          });
          showToast('Agendamento movido com sucesso!');
          setDropTarget(null);
      }
  };

  const getUtenteName = (id: string) => utentes.find(p => p.id === id)?.name || 'Desconhecido';
  const getSessionTypeName = (id?: string) => sessionTypes.find(t => t.id === id)?.name || 'Personalizado';

  // Available Utentes for Dropdown
  const availableUtentes = isAdmin 
    ? utentes 
    : utentes.filter(p => p.profissionalId === currentUser?.id);

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* Header and Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-[#1e3a5f]">Agenda</h1>
                <p className="text-gray-500 capitalize">
                    {view === 'month' 
                        ? format(currentDate, 'MMMM yyyy', { locale: pt })
                        : `Semana de ${format(weekStart, "d 'de' MMM", { locale: pt })}`
                    }
                </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                    <button 
                        onClick={() => setView('month')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${view === 'month' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <CalendarIcon size={14} /> Mês
                    </button>
                    <button 
                        onClick={() => setView('week')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${view === 'week' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={14} /> Semana
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center p-1">
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ChevronLeft size={20}/></button>
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ChevronRight size={20}/></button>
                </div>

                <Button onClick={openNewAptModal} className="w-full sm:w-auto"><Plus size={18} className="mr-2"/> Agendar</Button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            
            {/* MONTH VIEW */}
            {view === 'month' && (
                <>
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-6 overflow-y-auto">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                                    <div key={d} className="text-xs font-semibold text-gray-400 uppercase py-2">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                                {monthDays.map((day, idx) => {
                                    const itemsForDay = calendarItems.filter(i => isSameDay(new Date(i.date), day));
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleDayClick(day)}
                                            className={`
                                                min-h-[80px] md:min-h-[100px] border rounded-lg p-1 md:p-2 cursor-pointer transition-all flex flex-col
                                                ${!isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400 border-transparent' : 'bg-white border-gray-100'}
                                                ${isSameDay(day, selectedDate) ? 'ring-2 ring-[#1e3a5f] z-10' : ''}
                                                ${isToday(day) ? 'bg-blue-50' : ''}
                                            `}
                                        >
                                            <div className="text-right text-sm font-medium mb-1">{format(day, 'd')}</div>
                                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                                {itemsForDay.map(item => {
                                                    // NEW: Find Utente Name
                                                    const itemUtente = utentes.find(u => u.id === item.utenteId);
                                                    return (
                                                        <div 
                                                            key={`${item.type}-${item.id}`} 
                                                            className={`text-[10px] px-1 rounded truncate flex items-center gap-1 ${item.type === 'SESSION' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-700'}`}
                                                            title={`${item.time} - ${itemUtente?.name}`} // Tooltip with time and full name
                                                        >
                                                            {(item.original as Appointment).groupId && <Repeat size={8} />}
                                                            {/* NEW: Display Utente Name instead of time */}
                                                            <span className="truncate font-medium">{itemUtente?.name || 'Sem nome'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col h-fit lg:h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                            {format(selectedDate, "d 'de' MMMM", { locale: pt })}
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-3">
                             {calendarItems.filter(i => isSameDay(new Date(i.date), selectedDate)).length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhum evento.</p>
                            ) : (
                                calendarItems.filter(i => isSameDay(new Date(i.date), selectedDate)).sort((a,b) => a.time.localeCompare(b.time)).map(item => {
                                    const utente = utentes.find(p => p.id === item.utenteId);
                                    const isSession = item.type === 'SESSION';
                                    const isRecurring = !isSession && (item.original as Appointment).groupId;

                                    return (
                                        <div 
                                            key={`${item.type}-${item.id}`} 
                                            className={`p-3 rounded-lg border group cursor-pointer hover:shadow-sm transition-all relative ${isSession ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}
                                            onClick={() => navigate(`/utentes/${item.utenteId}`)}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {/* Adjusted Layout in side panel as well per previous requests */}
                                                <span className="font-bold text-[#1e3a5f] text-lg">{item.time}</span>
                                                <span className="text-xs text-gray-500 font-normal">({item.duration} min)</span>
                                                {isRecurring && <Repeat size={12} className="text-[#1e3a5f]" />}
                                            </div>
                                            <p className="font-medium text-gray-900">{utente?.name}</p>
                                            
                                            <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
                                                <Tag size={10} />
                                                {getSessionTypeName(item.original.sessionTypeId)}
                                            </p>
                                            
                                            {isSession ? (
                                                <div className="flex items-center text-xs text-green-700 font-bold gap-1">
                                                    <Check size={12} /> Realizada
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={(e) => handleEditApt(e, item.original as Appointment)}
                                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-[#1e3a5f] bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Editar Agendamento"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* WEEK VIEW */}
            {view === 'week' && (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-20">
                                <div className="p-4 border-r border-gray-100 bg-gray-50"></div>
                                {weekDays.map((day, idx) => (
                                    <div key={idx} className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-blue-50' : 'bg-white'}`}>
                                        <div className={`text-xs font-semibold uppercase ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {format(day, 'EEE', { locale: pt })}
                                        </div>
                                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                {hours.map(hour => (
                                    <div key={hour} className="grid grid-cols-8 h-[128px]">
                                        <div className="border-r border-b border-gray-100 bg-gray-50 p-2 text-right text-xs font-medium text-gray-500 sticky left-0 z-10">
                                            {hour}:00
                                        </div>
                                        {weekDays.map((day, idx) => {
                                            const cellItems = calendarItems.filter(i => isSameDay(new Date(i.date), day) && parseInt(i.time.split(':')[0]) === hour);
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="border-r border-b border-gray-100 last:border-r-0 relative p-1 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => handleCellClick(day, hour)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, day, hour)}
                                                >
                                                    {/* Grid lines for quarters */}
                                                    <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col z-0">
                                                        <div className="flex-1 border-b border-gray-50 border-dashed"></div>
                                                        <div className="flex-1 border-b border-gray-100/50"></div>
                                                        <div className="flex-1 border-b border-gray-50 border-dashed"></div>
                                                        <div className="flex-1"></div>
                                                    </div>

                                                    {cellItems.map(item => {
                                                        const startMinutes = parseInt(item.time.split(':')[1]);
                                                        const topPositionPercent = (startMinutes / 60) * 100;
                                                        const heightPercent = (item.duration / 60) * 100;
                                                        const isRecurring = item.type === 'APPOINTMENT' && (item.original as Appointment).groupId;
                                                        
                                                        return (
                                                          <div 
                                                              key={`${item.type}-${item.id}`}
                                                              draggable={item.type === 'APPOINTMENT'}
                                                              onDragStart={(e) => handleDragStart(e, item.id)}
                                                              onClick={(e) => {
                                                                  e.stopPropagation(); 
                                                                  navigate(`/utentes/${item.utenteId}`);
                                                              }}
                                                              style={{
                                                                  top: `${topPositionPercent}%`,
                                                                  height: `${heightPercent}%`,
                                                                  position: 'absolute', left: '4px', right: '4px', zIndex: 10, minHeight: '24px'
                                                              }}
                                                              className={`p-1.5 rounded text-xs shadow-sm hover:shadow-md transition-shadow border-l-4 overflow-hidden group ${
                                                                  item.type === 'SESSION' 
                                                                      ? 'bg-green-100 border-green-600 text-green-800' 
                                                                      : 'bg-blue-100 border-[#1e3a5f] text-[#1e3a5f] cursor-grab active:cursor-grabbing'
                                                              }`}
                                                          >
                                                              <div className="font-bold flex justify-between items-center">
                                                                  <span>{item.time}</span>
                                                                  {item.type === 'APPOINTMENT' && (
                                                                      <div className="flex items-center gap-1">
                                                                          {isRecurring && <Repeat size={10} />}
                                                                          <button
                                                                            onClick={(e) => handleEditApt(e, item.original as Appointment)}
                                                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/50 rounded text-[#1e3a5f]"
                                                                            title="Editar"
                                                                          >
                                                                              <Edit2 size={12} />
                                                                          </button>
                                                                      </div>
                                                                  )}
                                                              </div>
                                                              <div className="truncate font-medium">{utentes.find(p => p.id === item.utenteId)?.name}</div>
                                                          </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* New/Edit Appointment Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAptId ? "Editar Agendamento" : "Novo Agendamento"}>
            <form onSubmit={submitAppointment} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Utente *</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                        value={aptForm.utenteId}
                        onChange={e => setAptForm({...aptForm, utenteId: e.target.value})}
                        required
                    >
                        <option value="">Selecione</option>
                        {availableUtentes.filter(p => p.active).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Session Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Sessão</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                        value={aptForm.sessionTypeId || ''}
                        onChange={(e) => handleAptTypeChange(e.target.value)}
                    >
                        <option value="">Personalizado</option>
                        {getAvailableSessionTypes(aptForm.profissionalId).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Data *" type="date" value={aptForm.date} onChange={e => setAptForm({...aptForm, date: e.target.value})} required />
                    <Input label="Hora *" type="time" value={aptForm.time} onChange={e => setAptForm({...aptForm, time: e.target.value})} required />
                </div>
                <Input label="Duração (min)" type="number" value={aptForm.durationMinutes} onChange={e => setAptForm({...aptForm, durationMinutes: parseInt(e.target.value)})} required />
                
                {/* Recurring Options - Only show on Create */}
                {!editingAptId && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="repeat" 
                                checked={isRepeatEnabled} 
                                onChange={(e) => setIsRepeatEnabled(e.target.checked)}
                                className="rounded text-[#1e3a5f] focus:ring-[#1e3a5f]"
                            />
                            <label htmlFor="repeat" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Repeat size={14} /> Repetir semanalmente
                            </label>
                        </div>
                        {isRepeatEnabled && (
                            <Input 
                                label="Repetir até" 
                                type="date" 
                                value={repeatUntilDate} 
                                onChange={(e) => setRepeatUntilDate(e.target.value)} 
                                required={isRepeatEnabled}
                            />
                        )}
                    </div>
                )}

                <TextArea label="Observações" value={aptForm.notes} onChange={e => setAptForm({...aptForm, notes: e.target.value})} />
                
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">{editingAptId ? 'Atualizar' : 'Agendar'}</Button>
                </div>
            </form>
        </Modal>

        {/* Series Update Decision Modal */}
        <Modal isOpen={isSeriesUpdateModalOpen} onClose={() => setIsSeriesUpdateModalOpen(false)} title="Alterar Agendamento Recorrente" maxWidth="md">
            <div className="p-2">
                <p className="text-gray-600 mb-6">
                    Este agendamento faz parte de uma série. Como deseja aplicar as alterações?
                </p>
                <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={() => handleSeriesUpdateDecision(false)}>
                        Apenas este agendamento
                    </Button>
                    <Button onClick={() => handleSeriesUpdateDecision(true)}>
                        Este e todos os seguintes
                    </Button>
                </div>
                <div className="flex justify-end mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setIsSeriesUpdateModalOpen(false)}>Cancelar</Button>
                </div>
            </div>
        </Modal>

        {/* View Modal */}
        <Modal isOpen={!!viewSession} onClose={() => setViewSession(null)} title="Resumo da Sessão">
            {viewSession && (
            <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl">
                        {getUtenteName(viewSession.utenteId).charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{getUtenteName(viewSession.utenteId)}</h3>
                        <p className="text-sm text-gray-500">{format(new Date(viewSession.date), 'dd/MM/yyyy')} às {viewSession.startTime}</p>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Tipo de Sessão</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{getSessionTypeName(viewSession.sessionTypeId)}</p>
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText size={16} className="text-blue-600"/> Atividades Realizadas</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{viewSession.activities}</div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                    <Button variant="secondary" onClick={() => setViewSession(null)}>Fechar</Button>
                </div>
            </div>
            )}
        </Modal>
        
        {/* Drag Drop Modal */}
        <Modal isOpen={!!dropTarget} onClose={() => setDropTarget(null)} title="Confirmar Reagendamento" maxWidth="sm">
             <div className="p-2">
                <div className="bg-blue-50 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <HelpCircle className="text-blue-600 h-8 w-8 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-blue-900">Mover para {dropTarget && format(new Date(dropTarget.date), 'dd/MM', {locale: pt})} às {dropTarget?.time}?</p>
                    </div>
                </div>
                <div className="flex justify-center gap-3">
                    <Button variant="secondary" onClick={() => setDropTarget(null)}>Cancelar</Button>
                    <Button onClick={confirmDrop}>Confirmar</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

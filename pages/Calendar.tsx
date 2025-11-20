import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, TextArea } from '../components/ui/Input';
import { Appointment, Session, UserRole } from '../types';
import { ChevronLeft, ChevronRight, Plus, Check, Calendar as CalendarIcon, List } from 'lucide-react';
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

export const CalendarPage: React.FC = () => {
  const { appointments, patients, addAppointment, deleteAppointment, addSession, users, currentUser } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Filter appointments based on role
  const displayedAppointments = isAdmin
    ? appointments
    : appointments.filter(a => a.therapistId === currentUser?.id);

  // Appointment Form State
  const [aptForm, setAptForm] = useState<Omit<Appointment, 'id' | 'status'>>({
      patientId: '',
      therapistId: currentUser?.id || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      durationMinutes: 60,
      notes: ''
  });

  // Session Conversion Form State
  const [sessionForm, setSessionForm] = useState<Partial<Session>>({
      activities: '',
      progressNotes: '',
      homework: ''
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
      setAptForm({
          ...aptForm,
          date: format(day, 'yyyy-MM-dd'),
          time: `${hour.toString().padStart(2, '0')}:00`,
          therapistId: currentUser?.id || ''
      });
      setIsModalOpen(true);
  };

  const openNewAptModal = () => {
      setAptForm({
          ...aptForm,
          date: format(selectedDate, 'yyyy-MM-dd'),
          therapistId: currentUser?.id || ''
      });
      setIsModalOpen(true);
  };

  const submitAppointment = (e: React.FormEvent) => {
      e.preventDefault();
      addAppointment({
          ...aptForm,
          therapistId: isAdmin ? aptForm.therapistId : currentUser?.id || '',
          id: Math.random().toString(36).substr(2, 9),
          status: 'PENDING'
      });
      setIsModalOpen(false);
  };

  const initiateConversion = (apt: Appointment) => {
      setSelectedAppointment(apt);
      setSessionForm({
          activities: '',
          progressNotes: '',
          homework: ''
      });
      setIsConvertModalOpen(true);
  };

  const convertToSession = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAppointment) return;

      const patient = patients.find(p => p.id === selectedAppointment.patientId);
      const therapist = users.find(u => u.id === selectedAppointment.therapistId);

      addSession({
          id: Math.random().toString(36).substr(2, 9),
          patientId: selectedAppointment.patientId,
          therapistId: selectedAppointment.therapistId,
          date: selectedAppointment.date,
          startTime: selectedAppointment.time,
          durationMinutes: selectedAppointment.durationMinutes,
          status: 'COMPLETED',
          activities: sessionForm.activities || '',
          progressNotes: sessionForm.progressNotes || '',
          homework: sessionForm.homework || '',
          cost: patient?.costPerSession || 0,
          therapistPayment: therapist?.paymentPerSession || 0
      });

      deleteAppointment(selectedAppointment.id);
      setIsConvertModalOpen(false);
      setSelectedAppointment(null);
  };

  // Filter day appointments from the already filtered list
  const dayAppointments = displayedAppointments.filter(a => isSameDay(new Date(a.date), selectedDate));

  // Available Patients for Dropdown
  const availablePatients = isAdmin 
    ? patients 
    : patients.filter(p => p.therapistId === currentUser?.id);

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
                {/* View Toggler */}
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

                {/* Navigation */}
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
                         {/* Add min-width to force scrolling instead of squishing on mobile */}
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                                    <div key={d} className="text-xs font-semibold text-gray-400 uppercase py-2">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                                {monthDays.map((day, idx) => {
                                    const aptsForDay = displayedAppointments.filter(a => isSameDay(new Date(a.date), day));
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
                                                {aptsForDay.map(apt => (
                                                    <div key={apt.id} className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded truncate">
                                                        {apt.time}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel - Details for selected day (Only in Month View) */}
                    <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col h-fit lg:h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                            {format(selectedDate, "d 'de' MMMM", { locale: pt })}
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {dayAppointments.length === 0 ? (
                                <p className="text-gray-400 text-sm">Nenhum agendamento.</p>
                            ) : (
                                dayAppointments.sort((a,b) => a.time.localeCompare(b.time)).map(apt => {
                                    const patient = patients.find(p => p.id === apt.patientId);
                                    return (
                                        <div key={apt.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-[#1e3a5f]">{apt.time}</span>
                                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{apt.durationMinutes} min</span>
                                            </div>
                                            <p className="font-medium text-gray-900">{patient?.name}</p>
                                            <p className="text-xs text-gray-500 mb-3">{apt.notes || 'Sem notas'}</p>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                fullWidth 
                                                onClick={() => initiateConversion(apt)}
                                                className="flex items-center justify-center gap-1 text-xs"
                                            >
                                                <Check size={12} /> Concluir Sessão
                                            </Button>
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
                    {/* Container for horizontal scroll */}
                    <div className="flex-1 overflow-auto">
                        <div className="min-w-[800px]">
                            {/* Header Row: Days */}
                            <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-20">
                                <div className="p-4 border-r border-gray-100 bg-gray-50"></div>
                                {weekDays.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-blue-50' : 'bg-white'}`}
                                    >
                                        <div className={`text-xs font-semibold uppercase ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {format(day, 'EEE', { locale: pt })}
                                        </div>
                                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-700' : 'text-gray-900'}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Body: Time Grid */}
                            <div>
                                {hours.map(hour => (
                                    <div key={hour} className="grid grid-cols-8 min-h-[80px]">
                                        {/* Time Column */}
                                        <div className="border-r border-b border-gray-100 bg-gray-50 p-2 text-right text-xs font-medium text-gray-500 sticky left-0 z-10">
                                            {hour}:00
                                        </div>
                                        {/* Days Columns */}
                                        {weekDays.map((day, idx) => {
                                            const cellApts = displayedAppointments.filter(a => {
                                                return isSameDay(new Date(a.date), day) && parseInt(a.time.split(':')[0]) === hour;
                                            });

                                            return (
                                                <div 
                                                    key={idx} 
                                                    className="border-r border-b border-gray-100 last:border-r-0 relative p-1 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => handleCellClick(day, hour)}
                                                >
                                                    {cellApts.map(apt => (
                                                        <div 
                                                            key={apt.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation(); 
                                                                initiateConversion(apt);
                                                            }}
                                                            className="bg-blue-100 border-l-4 border-[#1e3a5f] text-[#1e3a5f] p-1.5 rounded text-xs mb-1 shadow-sm hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="font-bold">{apt.time}</div>
                                                            <div className="truncate font-medium">{patients.find(p => p.id === apt.patientId)?.name}</div>
                                                        </div>
                                                    ))}
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

        {/* New Appointment Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Agendamento">
            <form onSubmit={submitAppointment} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f]"
                        value={aptForm.patientId}
                        onChange={e => setAptForm({...aptForm, patientId: e.target.value})}
                        required
                    >
                        <option value="">Selecione</option>
                        {availablePatients.filter(p => p.active).map(p => (
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
                     <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Agendar</Button>
                </div>
            </form>
        </Modal>

        {/* Convert to Session Modal */}
        <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Registar Sessão Realizada">
            <div className="mb-4 bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                Convertendo agendamento de <strong>{patients.find(p => p.id === selectedAppointment?.patientId)?.name}</strong>.
            </div>
            <form onSubmit={convertToSession} className="space-y-4">
                <TextArea label="Atividades Realizadas *" value={sessionForm.activities} onChange={e => setSessionForm({...sessionForm, activities: e.target.value})} required />
                <TextArea label="Notas de Progresso" value={sessionForm.progressNotes} onChange={e => setSessionForm({...sessionForm, progressNotes: e.target.value})} />
                <TextArea label="Trabalho de Casa" value={sessionForm.homework} onChange={e => setSessionForm({...sessionForm, homework: e.target.value})} />
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)}>Cancelar</Button>
                     <Button type="submit">Confirmar e Salvar</Button>
                </div>
            </form>
        </Modal>
    </div>
  );
};
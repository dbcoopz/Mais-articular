import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Session, UserRole } from '../types';
import { Plus, Search, Paperclip, Calendar, Clock, User, FileText, Euro } from 'lucide-react';
import { format } from 'date-fns';

export const Sessions: React.FC = () => {
  const { sessions, patients, users, addSession, currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewSession, setViewSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const initialFormState: Omit<Session, 'id'> = {
    patientId: '',
    therapistId: currentUser?.id || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    durationMinutes: 60,
    activities: '',
    progressNotes: '',
    homework: '',
    status: 'COMPLETED',
    cost: 0,
    therapistPayment: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenModal = () => {
    setFormData({
        ...initialFormState, 
        therapistId: currentUser?.id || '' 
    });
    setIsModalOpen(true);
  };

  const handlePatientChange = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      const therapistId = isAdmin ? formData.therapistId : currentUser?.id;
      const therapist = users.find(u => u.id === therapistId);

      setFormData(prev => ({
          ...prev,
          patientId,
          cost: patient ? patient.costPerSession : 0,
          therapistPayment: therapist ? (therapist.paymentPerSession || 0) : 0
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSession({ 
        ...formData, 
        therapistId: isAdmin ? formData.therapistId : currentUser?.id || '',
        id: Math.random().toString(36).substr(2, 9) 
    });
    setIsModalOpen(false);
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Desconhecido';
  const getTherapistName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';

  // Filter logic: Search term AND (Admin OR Therapist Own Sessions)
  const filteredSessions = sessions.filter(s => {
      const patientName = patients.find(p => p.id === s.patientId)?.name || '';
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = isAdmin ? true : s.therapistId === currentUser?.id;
      
      return matchesSearch && matchesRole;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Patients available for selection (My Patients only if therapist)
  const availablePatients = isAdmin 
    ? patients 
    : patients.filter(p => p.therapistId === currentUser?.id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Sessões</h1>
          <p className="text-gray-500">{filteredSessions.length} sessão(ões) encontrada(s)</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus size={18} className="mr-2" /> Nova Sessão
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por paciente..."
              className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {filteredSessions.length === 0 ? (
             <div className="p-8 text-center text-gray-400">Nenhuma sessão registada.</div>
         ) : (
             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b border-gray-100">
                         <tr>
                             <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                             <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                             <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Terapeuta</th>
                             <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Atividades</th>
                             <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filteredSessions.map(session => {
                             const patient = patients.find(p => p.id === session.patientId);
                             const therapist = users.find(u => u.id === session.therapistId);
                             return (
                                 <tr 
                                    key={session.id} 
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setViewSession(session)}
                                 >
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                         <div className="font-medium">{format(new Date(session.date), 'dd/MM/yyyy')}</div>
                                         <div className="text-xs text-gray-500">{session.startTime} ({session.durationMinutes} min)</div>
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1e3a5f]">
                                         {patient?.name || 'Unknown'}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                         {therapist?.name || 'Unknown'}
                                     </td>
                                     <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                         {session.activities}
                                     </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                         <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                             Realizada
                                         </span>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
         )}
      </div>

      {/* Create Session Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registar Sessão" maxWidth="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                  <select 
                      className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                      value={formData.patientId}
                      onChange={(e) => handlePatientChange(e.target.value)}
                      required
                  >
                      <option value="">Selecione o paciente</option>
                      {availablePatients.filter(p => p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <Input label="Data *" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  <Input label="Hora *" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  <Input label="Duração (min) *" type="number" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})} required />
              </div>

              <TextArea label="Atividades Realizadas *" placeholder="Descreva as atividades..." rows={3} value={formData.activities} onChange={e => setFormData({...formData, activities: e.target.value})} required />
              <TextArea label="Notas de Progresso" placeholder="Observações sobre o progresso..." rows={2} value={formData.progressNotes} onChange={e => setFormData({...formData, progressNotes: e.target.value})} />
              <TextArea label="Trabalho de Casa" placeholder="Exercícios para casa..." rows={2} value={formData.homework} onChange={e => setFormData({...formData, homework: e.target.value})} />

              <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <input type="file" className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="flex items-center cursor-pointer">
                      <Paperclip size={18} className="mr-2" />
                      Anexar Arquivos (simulado)
                  </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Registar</Button>
              </div>
          </form>
      </Modal>

      {/* View Session Modal */}
      <Modal isOpen={!!viewSession} onClose={() => setViewSession(null)} title="Resumo da Sessão">
        {viewSession && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
                  {getPatientName(viewSession.patientId).charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getPatientName(viewSession.patientId)}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(viewSession.date), 'dd/MM/yyyy')}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {viewSession.startTime} ({viewSession.durationMinutes} min)</span>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> Terapeuta</p>
                   <p className="font-medium text-gray-900">{getTherapistName(viewSession.therapistId)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Euro size={12} /> Valor</p>
                   <p className="font-medium text-gray-900">€{viewSession.cost.toFixed(2)}</p>
                </div>
             </div>

             <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600"/> Atividades Realizadas
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {viewSession.activities}
                </div>
             </div>

             {viewSession.progressNotes && (
               <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Notas de Progresso</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {viewSession.progressNotes}
                  </div>
               </div>
             )}

             {viewSession.homework && (
               <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Trabalho de Casa</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {viewSession.homework}
                  </div>
               </div>
             )}

             <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setViewSession(null)}>Fechar</Button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
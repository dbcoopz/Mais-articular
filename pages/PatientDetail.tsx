
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Calendar, Clock, FileText, Phone, Mail, User, Euro, Paperclip, Trash2, Plus, Upload, Tag, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, sessions, appointments, users, addPatientDocument, deletePatientDocument, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'sessions' | 'appointments' | 'documents'>('summary');
  
  // Documents State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);

  const patient = patients.find(p => p.id === id);
  
  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-700">Paciente não encontrado</h2>
        <Button variant="secondary" onClick={() => navigate('/patients')} className="mt-4">
          Voltar à lista
        </Button>
      </div>
    );
  }

  const therapist = users.find(u => u.id === patient.therapistId);
  
  // Filter Data
  const patientSessions = sessions
    .filter(s => s.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  const patientAppointments = appointments
    .filter(a => a.patientId === patient.id && a.status === 'PENDING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFile(e.target.files[0]);
    }
  };

  const submitDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (docFile && patient) {
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        name: docFile.name,
        type: docFile.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadDate: format(new Date(), 'yyyy-MM-dd'),
        size: (docFile.size / 1024 / 1024).toFixed(2) + ' MB'
      };
      
      addPatientDocument(patient.id, newDoc);
      showToast('Documento adicionado com sucesso!');
      setIsDocModalOpen(false);
      setDocFile(null);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm('Tem a certeza que deseja apagar este documento?')) {
      deletePatientDocument(patient.id, docId);
      showToast('Documento removido.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent hover:text-[#1e3a5f]">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </Button>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-50 text-[#1e3a5f] flex items-center justify-center text-2xl font-bold border border-blue-100">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-500">{patient.age} anos • {patient.diagnosis}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={`px-3 py-1 rounded-full text-sm font-bold ${patient.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
             {patient.active ? 'Ativo' : 'Inativo'}
           </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {[
          { id: 'summary', label: 'Resumo', icon: User },
          { id: 'sessions', label: 'Histórico Sessões', icon: FileText },
          { id: 'appointments', label: 'Agendamentos', icon: Calendar },
          { id: 'documents', label: 'Documentos', icon: Paperclip },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id ? 'bg-[#1e3a5f] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-[#1e3a5f] text-lg border-b pb-2 mb-4">Informação Pessoal</h3>
              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Responsável</label>
                    <p className="text-gray-900 font-medium">{patient.responsibleName}</p>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Data Nascimento</label>
                    <p className="text-gray-900">{format(new Date(patient.birthDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Contactos</label>
                    <div className="flex flex-col gap-1 mt-1">
                       <p className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400"/> {patient.phone}</p>
                       {patient.email && <p className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-gray-400"/> {patient.email}</p>}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Morada</label>
                    <p className="flex items-center gap-2 text-gray-900 mt-1"><MapPin size={14} className="text-gray-400"/> {patient.address || 'Não definida'}</p>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-[#1e3a5f] text-lg border-b pb-2 mb-4">Informação Clínica</h3>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase">Terapeuta Atribuído</label>
                 <div className="flex items-center gap-2 mt-1 bg-gray-50 p-2 rounded-lg w-fit">
                    <div className="h-6 w-6 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs">
                       {therapist?.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{therapist?.name || 'Não atribuído'}</span>
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-400 uppercase">Observações Clínicas</label>
                 <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap border border-gray-100">
                    {patient.clinicalNotes || 'Sem observações registadas.'}
                 </p>
              </div>
              {/* Custom Prices Display */}
              {patient.customPrices && Object.keys(patient.customPrices).length > 0 && (
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">Preços Acordados</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             <Tag size={12} className="mr-1" /> Personalizado
                          </span>
                      </div>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Últimas Sessões Realizadas</h3>
                <span className="text-sm text-gray-500">{patientSessions.length} total</span>
             </div>
             
             <div className="space-y-3">
                {patientSessions.length === 0 ? (
                   <p className="text-gray-400 italic text-center py-8">Nenhuma sessão realizada ainda.</p>
                ) : (
                   patientSessions.map(s => (
                      <div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">Realizada</span>
                               <span className="text-sm font-bold text-gray-900">{format(new Date(s.date), 'dd/MM/yyyy')}</span>
                               <span className="text-xs text-gray-500 flex items-center"><Clock size={12} className="mr-1"/> {s.startTime} ({s.durationMinutes}m)</span>
                            </div>
                            <span className="font-bold text-[#1e3a5f] text-sm">€{s.cost.toFixed(2)}</span>
                         </div>
                         <p className="text-sm text-gray-700 mb-2"><strong>Atividades:</strong> {s.activities}</p>
                         {s.progressNotes && <p className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100">"{s.progressNotes}"</p>}
                      </div>
                   ))
                )}
             </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Próximos Agendamentos</h3>
                <Button size="sm" onClick={() => navigate('/calendar')}>Ir para Agenda</Button>
             </div>

             <div className="space-y-3">
                {patientAppointments.length === 0 ? (
                   <p className="text-gray-400 italic text-center py-8">Sem agendamentos futuros.</p>
                ) : (
                   patientAppointments.map(a => (
                      <div key={a.id} className="border-l-4 border-blue-500 bg-blue-50/30 rounded-r-xl p-4 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-[#1e3a5f] flex items-center gap-2">
                               <Calendar size={16}/> {format(new Date(a.date), 'dd/MM/yyyy')}
                               <span className="text-gray-400">|</span>
                               <Clock size={16}/> {a.time}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{a.notes || 'Sem notas'}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-xs font-bold bg-white border border-blue-100 text-blue-600 px-2 py-1 rounded-full">
                               {a.durationMinutes} min
                            </span>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Documentos & Relatórios</h3>
                <Button onClick={() => setIsDocModalOpen(true)} size="sm">
                   <Upload size={16} className="mr-2"/> Adicionar Ficheiro
                </Button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(!patient.documents || patient.documents.length === 0) ? (
                   <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                      <Paperclip size={32} className="mx-auto mb-2 opacity-30" />
                      Nenhum documento anexado.
                   </div>
                ) : (
                   patient.documents.map(doc => (
                      <div key={doc.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all relative group">
                         <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">
                               {doc.type}
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-gray-900 text-sm truncate" title={doc.name}>{doc.name}</p>
                               <p className="text-xs text-gray-500 mt-1">{format(new Date(doc.uploadDate), 'dd/MM/yyyy')} • {doc.size}</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   ))
                )}
             </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Anexar Documento" maxWidth="sm">
         <form onSubmit={submitDocument} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
               <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  required
               />
               {docFile ? (
                  <div className="text-[#1e3a5f]">
                     <FileText size={32} className="mx-auto mb-2" />
                     <p className="font-bold text-sm">{docFile.name}</p>
                     <p className="text-xs text-gray-500">{(docFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
               ) : (
                  <div className="text-gray-400">
                     <Upload size={32} className="mx-auto mb-2" />
                     <p className="font-bold text-sm">Clique para selecionar</p>
                     <p className="text-xs">PDF, JPG, PNG</p>
                  </div>
               )}
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="secondary" onClick={() => setIsDocModalOpen(false)}>Cancelar</Button>
               <Button type="submit" disabled={!docFile}>Guardar</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

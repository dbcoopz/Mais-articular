
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, TextArea } from '../components/ui/Input'; // Imported Input/TextArea
import { ArrowLeft, Calendar, Clock, FileText, Phone, Mail, User, Paperclip, Trash2, Plus, Upload, Tag, MapPin, CheckCircle, AlertCircle, Edit2 } from 'lucide-react'; // Added Edit2
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { UserRole, Utente } from '../types';

export const UtenteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { utentes, sessions, appointments, users, currentUser, addUtenteDocument, deleteUtenteDocument, sessionTypes, showToast, updateUtente } = useApp(); // Added updateUtente
  const [activeTab, setActiveTab] = useState<'summary' | 'sessions' | 'appointments' | 'documents'>('summary');
  
  // Documents State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Utente | null>(null);

  const utente = utentes.find(p => p.id === id);
  
  if (!utente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-700">Utente não encontrado</h2>
        <Button variant="secondary" onClick={() => navigate('/utentes')} className="mt-4">
          Voltar à lista
        </Button>
      </div>
    );
  }

  const profissional = users.find(u => u.id === utente.profissionalId);
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  // Filter Data
  const utenteSessions = sessions
    .filter(s => s.utenteId === utente.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  const utenteAppointments = appointments
    .filter(a => a.utenteId === utente.id && a.status === 'PENDING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- Document Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFile(e.target.files[0]);
    }
  };

  const submitDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (docFile && utente) {
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        name: docFile.name,
        type: docFile.name.split('.').pop()?.toUpperCase() || 'FILE',
        uploadDate: format(new Date(), 'yyyy-MM-dd'),
        size: (docFile.size / 1024 / 1024).toFixed(2) + ' MB'
      };
      
      addUtenteDocument(utente.id, newDoc);
      showToast('Documento adicionado com sucesso!');
      setIsDocModalOpen(false);
      setDocFile(null);
    }
  };

  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem a certeza que deseja apagar este documento?')) {
      deleteUtenteDocument(utente.id, docId);
      showToast('Documento removido.', 'info');
    }
  };

  const handleOpenDoc = (doc: any) => {
      // Simulation of opening a file
      alert(`A abrir documento: ${doc.name}`);
  };

  // --- Edit Handlers ---
  const handleEditClick = () => {
      setFormData({ ...utente });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData) {
          updateUtente(formData);
          showToast('Utente atualizado com sucesso!');
          setIsEditModalOpen(false);
      }
  };

  const handleCustomPriceChange = (typeId: string, value: string) => {
      const numValue = parseFloat(value);
      setFormData(prev => {
          if (!prev) return null;
          const newPrices = { ...prev.customPrices };
          if (!isNaN(numValue)) {
              newPrices[typeId] = numValue;
          } else {
              delete newPrices[typeId];
          }
          return { ...prev, customPrices: newPrices };
      });
  };

  const getSessionTypeName = (id?: string) => sessionTypes.find(t => t.id === id)?.name || 'Padrão';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center text-gray-500 -ml-4 hover:text-[#1e3a5f]">
        <ArrowLeft size={16} className="mr-2" /> Voltar
      </Button>

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-6">
        <div className="h-24 w-24 rounded-full bg-blue-50 text-[#1e3a5f] flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md flex-shrink-0">
          {utente.name.charAt(0)}
        </div>
        <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{utente.name}</h1>
                    <p className="text-gray-500 mt-1">{utente.age} anos • {utente.diagnosis}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${utente.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {utente.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                        onClick={handleEditClick}
                        className="p-2 text-gray-400 hover:text-[#1e3a5f] bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Utente"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>
          
          <div className="mt-6 flex flex-wrap gap-4 md:gap-8 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
             <div className="flex items-center gap-2"><User size={16} className="text-[#1e3a5f]"/> <span className="font-semibold">Responsável:</span> {utente.responsibleName}</div>
             <div className="flex items-center gap-2"><Phone size={16} className="text-[#1e3a5f]"/> <span className="font-semibold">Telefone:</span> {utente.phone}</div>
             <div className="flex items-center gap-2"><Mail size={16} className="text-[#1e3a5f]"/> <span className="font-semibold">Email:</span> {utente.email}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {['summary', 'sessions', 'appointments', 'documents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-[#1e3a5f] text-[#1e3a5f]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'summary' ? 'Resumo' : tab === 'sessions' ? 'Histórico Sessões' : tab === 'appointments' ? 'Agenda' : 'Documentos'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinical Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <div>
                  <h3 className="font-bold text-lg text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-[#1e3a5f]"/> Informação Clínica
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Profissional:</span>
                        <span className="font-medium text-gray-900">{profissional?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Diagnóstico:</span>
                        <span className="font-medium text-gray-900">{utente.diagnosis}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Morada:</span>
                        <span className="font-medium text-gray-900">{utente.address}</span>
                    </div>
                  </div>
              </div>
              
              <div>
                 <h4 className="font-bold text-gray-800 mb-2">Notas Clínicas</h4>
                 <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border border-gray-200 whitespace-pre-wrap leading-relaxed">
                    {utente.clinicalNotes || 'Sem notas registadas.'}
                 </div>
              </div>
            </div>

            {/* Custom Prices - VISIBLE ONLY TO ADMIN */}
            {isAdmin && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-lg text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                        <Tag size={20} className="text-[#1e3a5f]"/> Preços Personalizados
                    </h3>
                    
                    {Object.keys(utente.customPrices || {}).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500">Nenhum preço personalizado.</p>
                        <p className="text-xs text-gray-400 mt-1">Usa os valores padrão dos serviços.</p>
                    </div>
                    ) : (
                    <div className="space-y-3">
                        {Object.entries(utente.customPrices || {}).map(([typeId, price]) => {
                            const typeName = sessionTypes.find(t => t.id === typeId)?.name || 'Serviço Desconhecido';
                            return (
                                <div key={typeId} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <span className="text-sm font-medium text-blue-900">{typeName}</span>
                                    <span className="text-sm font-bold text-[#1e3a5f]">€{Number(price).toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                    )}
                    <p className="text-xs text-gray-400 mt-4 bg-yellow-50 p-2 rounded text-yellow-700 border border-yellow-100 flex gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                        Esta secção é visível apenas para Administradores.
                    </p>
                </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">Histórico de Sessões ({utenteSessions.length})</h3>
            </div>
            
            {utenteSessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Nenhuma sessão realizada.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {utenteSessions.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-700 rounded-xl">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg capitalize">
                                    {format(new Date(s.date), 'dd MMMM yyyy', { locale: pt })}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {s.startTime} ({s.durationMinutes} min)</span>
                                    <span className="flex items-center gap-1"><User size={12}/> {users.find(u=>u.id === s.profissionalId)?.name}</span>
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                        {getSessionTypeName(s.sessionTypeId)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full self-start">Realizada</span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border border-gray-100 mt-1">
                        <p className="font-bold text-xs text-gray-400 uppercase tracking-wide mb-1">Atividades Realizadas</p>
                        {s.activities}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
           <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Próximos Agendamentos ({utenteAppointments.length})</h3>
            
            {utenteAppointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">Nenhum agendamento futuro.</p>
                </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                  {utenteAppointments.map(a => (
                    <div key={a.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all border-l-4 border-l-orange-400">
                       <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                           <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg capitalize">
                                        {format(new Date(a.date), 'dd MMMM yyyy', { locale: pt })}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1 font-semibold text-[#1e3a5f]"><Clock size={12}/> {a.time} ({a.durationMinutes} min)</span>
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                            {getSessionTypeName(a.sessionTypeId)}
                                        </span>
                                    </div>
                                </div>
                           </div>
                           <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full self-start">Agendada</span>
                       </div>
                       {a.notes && (
                           <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-100 italic">
                               "{a.notes}"
                           </div>
                       )}
                    </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Documentos ({utente.documents?.length || 0})</h3>
              <Button onClick={() => setIsDocModalOpen(true)} size="sm"><Plus size={16} className="mr-2"/> Adicionar</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(utente.documents || []).map(doc => (
                <div 
                    key={doc.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
                    onClick={() => handleOpenDoc(doc)}
                >
                  <div className="p-3 bg-blue-50 text-[#1e3a5f] rounded-xl"><FileText size={24} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{doc.uploadDate} • {doc.size}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteDoc(doc.id, e)} 
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Apagar documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(utente.documents || []).length === 0 && (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500">Nenhum documento anexado.</p>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Adicionar Documento">
        <form onSubmit={submitDocument}>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#1e3a5f] hover:bg-blue-50/30 transition-all group">
            <Upload size={40} className="mx-auto text-gray-400 mb-3 group-hover:text-[#1e3a5f] transition-colors" />
            <input type="file" id="doc-upload" onChange={handleFileUpload} className="hidden" />
            <label htmlFor="doc-upload" className="font-bold text-[#1e3a5f] cursor-pointer text-lg hover:underline">
              Escolher ficheiro
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {docFile ? <span className="font-bold text-green-600">{docFile.name}</span> : "PDF, JPG, PNG, Word, etc."}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" type="button" onClick={() => setIsDocModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!docFile}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Utente Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Utente" maxWidth="2xl">
        {formData && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <Input label="Data de Nascimento *" type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
                    <Input label="Idade" type="number" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} />
                    <Input label="Nome do Responsável *" value={formData.responsibleName} onChange={e => setFormData({...formData, responsibleName: e.target.value})} required />
                    <Input label="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                    {isAdmin ? (
                        <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                        value={formData.profissionalId}
                        onChange={e => setFormData({...formData, profissionalId: e.target.value})}
                        >
                        <option value="">Selecione</option>
                        {users.filter(u => u.role === UserRole.PROFISSIONAL).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                        </select>
                    ) : (
                        <Input value={users.find(u => u.id === formData.profissionalId)?.name || ''} disabled className="bg-gray-100" />
                    )}
                </div>

                <Input label="Diagnóstico" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
                <Input label="Morada" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                <TextArea label="Observações Clínicas" rows={3} value={formData.clinicalNotes} onChange={e => setFormData({...formData, clinicalNotes: e.target.value})} />
                
                {/* Tabela de Preços Personalizados (Apenas Admin) */}
                {isAdmin && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                        <h4 className="font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                            <Tag size={16} /> Preços Personalizados (por Sessão)
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">Deixe em branco para usar o preço padrão do serviço.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sessionTypes.map(type => (
                                <div key={type.id}>
                                    <Input 
                                        label={type.name} 
                                        type="number" 
                                        placeholder={`Padrão: €${type.defaultCost}`}
                                        value={formData.customPrices?.[type.id] || ''} 
                                        onChange={e => handleCustomPriceChange(type.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                    <label htmlFor="active" className="text-sm text-gray-700">Utente Ativo</label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        )}
      </Modal>

    </div>
  );
};

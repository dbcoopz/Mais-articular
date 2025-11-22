
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { WaitingListEntry, UserRole, Utente } from '../types';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Calendar, Clock, Phone, UserPlus, Check } from 'lucide-react';
import { format } from 'date-fns';

export const WaitingList: React.FC = () => {
  const { waitingList, users, currentUser, addToWaitingList, updateWaitingListEntry, deleteFromWaitingList, addUtente, showToast } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<WaitingListEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [entryToConvert, setEntryToConvert] = useState<WaitingListEntry | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // --- FORM STATES ---
  const initialFormState: Omit<WaitingListEntry, 'id'> = {
    name: '',
    birthDate: '',
    age: 0,
    responsibleName: '',
    phone: '',
    email: '',
    preferredSchedule: '',
    reason: '',
    registrationDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Form for Converting to Utente (extends Utente type)
  const [convertFormData, setConvertFormData] = useState<Partial<Utente>>({});

  // --- HANDLERS ---

  const handleOpenModal = (entry?: WaitingListEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData(entry);
    } else {
      setEditingEntry(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
        updateWaitingListEntry({ ...formData, id: editingEntry.id });
        showToast('Candidato atualizado com sucesso!');
    } else {
        addToWaitingList({ ...formData, id: Math.random().toString(36).substr(2, 9) });
        showToast('Candidato adicionado à lista de espera!');
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
        deleteFromWaitingList(entryToDelete);
        showToast('Candidato removido da lista.', 'info');
        setIsDeleteModalOpen(false);
        setEntryToDelete(null);
    }
  };

  // --- CONVERSION LOGIC ---

  const initiateConversion = (entry: WaitingListEntry) => {
    setEntryToConvert(entry);
    // Pre-fill Utente Form Data with info from Waiting List
    setConvertFormData({
        name: entry.name,
        birthDate: entry.birthDate,
        age: entry.age,
        responsibleName: entry.responsibleName,
        phone: entry.phone,
        email: entry.email,
        diagnosis: entry.reason, // Assume reason as initial diagnosis
        address: '',
        clinicalNotes: entry.notes ? `[Lista de Espera] ${entry.notes}` : '',
        profissionalId: isAdmin ? '' : currentUser?.id || '',
        active: true
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryToConvert) return;

    // Create the utente
    addUtente({
        id: Math.random().toString(36).substr(2, 9),
        name: convertFormData.name || '',
        birthDate: convertFormData.birthDate || '',
        age: convertFormData.age || 0,
        phone: convertFormData.phone || '',
        email: convertFormData.email || '',
        responsibleName: convertFormData.responsibleName || '',
        profissionalId: convertFormData.profissionalId || '',
        diagnosis: convertFormData.diagnosis || '',
        address: convertFormData.address || '',
        clinicalNotes: convertFormData.clinicalNotes || '',
        active: true
    });

    // Remove from waiting list
    deleteFromWaitingList(entryToConvert.id);
    
    showToast('Utente inscrito com sucesso!');
    setIsConvertModalOpen(false);
    setEntryToConvert(null);
  };

  const filteredList = waitingList.filter(entry => 
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Lista de Espera</h1>
          <p className="text-gray-500">{filteredList.length} candidato(s) em espera</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Candidato
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar nome, responsável ou motivo..."
            className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
         {filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                Nenhum candidato na lista de espera.
            </div>
         ) : (
            filteredList.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            {/* Updated Avatar */}
                            <div className="h-10 w-10 rounded-full bg-blue-50 text-[#1e3a5f] flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                                {entry.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{entry.name}</h3>
                                <p className="text-sm text-gray-500">{entry.age} anos • Inscrito a {format(new Date(entry.registrationDate), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 mt-3">
                             <p><span className="font-medium text-gray-900">Motivo:</span> {entry.reason}</p>
                             <p><span className="font-medium text-gray-900">Horário:</span> {entry.preferredSchedule}</p>
                             <p><span className="font-medium text-gray-900">Responsável:</span> {entry.responsibleName}</p>
                             <p className="flex items-center gap-1"><Phone size={12}/> {entry.phone}</p>
                        </div>
                        {entry.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500 italic border border-gray-100">
                                "{entry.notes}"
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 shrink-0">
                        <Button 
                            onClick={() => initiateConversion(entry)}
                            className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                        >
                            <UserPlus size={16} className="mr-2" /> Inscrever
                        </Button>
                        <button 
                            onClick={() => handleOpenModal(entry)}
                            className="p-2 text-gray-400 hover:text-[#1e3a5f] bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            title="Apagar"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))
         )}
      </div>

      {/* New/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEntry ? "Editar Candidato" : "Novo Candidato"} maxWidth="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome do Candidato *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Data de Nascimento *" type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
            <Input label="Idade" type="number" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} />
            <Input label="Nome do Responsável *" value={formData.responsibleName} onChange={e => setFormData({...formData, responsibleName: e.target.value})} required />
            <Input label="Telefone *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          
          <Input label="Preferência de Horário *" placeholder="Ex: Manhãs, Terças à tarde..." value={formData.preferredSchedule} onChange={e => setFormData({...formData, preferredSchedule: e.target.value})} required />
          <Input label="Motivo da Consulta *" placeholder="Ex: Troca letras, Gaguez..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required />
          <Input label="Data de Inscrição" type="date" value={formData.registrationDate} onChange={e => setFormData({...formData, registrationDate: e.target.value})} required />
          <TextArea label="Observações" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Conversion to Utente Modal */}
      <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Inscrever Utente" maxWidth="2xl">
         <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-sm text-green-800 flex items-center">
            <Check size={16} className="mr-2" />
            A converter <strong>{entryToConvert?.name}</strong> em utente ativo.
         </div>
         
         <form onSubmit={handleConvertSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pre-filled read-only fields for context */}
                <Input label="Nome" value={convertFormData.name} disabled className="bg-gray-100 cursor-not-allowed" />
                <Input label="Responsável" value={convertFormData.responsibleName} disabled className="bg-gray-100 cursor-not-allowed" />
                
                {/* Fields to configure for the new utente */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Profissional Atribuído *</label>
                   {isAdmin ? (
                       <select 
                         className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                         value={convertFormData.profissionalId}
                         onChange={e => setConvertFormData({...convertFormData, profissionalId: e.target.value})}
                         required
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
            
            <Input label="Diagnóstico Inicial" value={convertFormData.diagnosis} onChange={e => setConvertFormData({...convertFormData, diagnosis: e.target.value})} />
            <Input label="Morada" value={convertFormData.address} onChange={e => setConvertFormData({...convertFormData, address: e.target.value})} />
            <TextArea label="Notas Clínicas (Inclui obs. da lista de espera)" rows={3} value={convertFormData.clinicalNotes} onChange={e => setConvertFormData({...convertFormData, clinicalNotes: e.target.value})} />

            <div className="flex justify-end gap-3 mt-6">
               <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Confirmar Inscrição</Button>
            </div>
         </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remover da Lista" maxWidth="sm">
          <div className="text-center p-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Remover Candidato?</h3>
              <p className="text-sm text-gray-500 mb-6">
                  Tem a certeza que deseja remover este candidato da lista de espera? Esta ação é irreversível.
              </p>
              <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                  <Button variant="danger" onClick={confirmDelete}>Remover</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
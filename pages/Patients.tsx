import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Patient, UserRole } from '../types';
import { Plus, Search, Edit2, User } from 'lucide-react';

export const Patients: React.FC = () => {
  const { patients, users, addPatient, updatePatient, currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const initialFormState: Omit<Patient, 'id'> = {
    name: '',
    birthDate: '',
    age: 0,
    phone: '',
    email: '',
    responsibleName: '',
    therapistId: '',
    costPerSession: 0,
    diagnosis: '',
    address: '',
    clinicalNotes: '',
    active: true
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData(patient);
    } else {
      setEditingPatient(null);
      // If therapist, auto-assign current user id
      setFormData({
          ...initialFormState,
          therapistId: isAdmin ? '' : currentUser?.id || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      updatePatient({ ...formData, id: editingPatient.id });
    } else {
      addPatient({ ...formData, id: Math.random().toString(36).substr(2, 9) });
    }
    setIsModalOpen(false);
  };

  // Filter: Search term AND (Admin sees all OR Therapist sees own)
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.responsibleName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = isAdmin ? true : p.therapistId === currentUser?.id;

    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Pacientes</h1>
          <p className="text-gray-500">{filteredPatients.length} paciente(s) encontrado(s)</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Paciente
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar pacientes..."
            className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e3a5f]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div key={patient.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                 <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg mr-3">
                    {patient.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">{patient.name}</h3>
                   <p className="text-xs text-gray-500">{patient.age} anos • {patient.diagnosis}</p>
                 </div>
              </div>
              <button onClick={() => handleOpenModal(patient)} className="text-gray-400 hover:text-[#1e3a5f]">
                <Edit2 size={16} />
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
               <p><span className="font-medium text-gray-900">Resp:</span> {patient.responsibleName}</p>
               <p><span className="font-medium text-gray-900">Tel:</span> {patient.phone}</p>
               {isAdmin && <p><span className="font-medium text-gray-900">Valor/Sessão:</span> €{patient.costPerSession}</p>}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <span className={`px-2 py-1 rounded-md text-xs font-medium ${patient.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-800'}`}>
                 {patient.active ? 'Ativo' : 'Inativo'}
               </span>
               <div className="flex items-center text-xs text-gray-500">
                 <User size={12} className="mr-1" />
                 {users.find(u => u.id === patient.therapistId)?.name || 'N/A'}
               </div>
            </div>
          </div>
        ))}
        
        {filteredPatients.length === 0 && (
           <div className="col-span-full text-center py-12 text-gray-400">
             Nenhum paciente encontrado.
           </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPatient ? "Editar Paciente" : "Novo Paciente"} maxWidth="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Data de Nascimento *" type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
            <Input label="Idade" type="number" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} />
            <Input label="Nome do Responsável *" value={formData.responsibleName} onChange={e => setFormData({...formData, responsibleName: e.target.value})} required />
            <Input label="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta</label>
               {isAdmin ? (
                   <select 
                     className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                     value={formData.therapistId}
                     onChange={e => setFormData({...formData, therapistId: e.target.value})}
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
                <Input label="Custo por Sessão (€)" type="number" value={formData.costPerSession} onChange={e => setFormData({...formData, costPerSession: parseFloat(e.target.value)})} />
             )}
          </div>
          
          <Input label="Diagnóstico" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
          <Input label="Morada" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <TextArea label="Observações Clínicas" rows={3} value={formData.clinicalNotes} onChange={e => setFormData({...formData, clinicalNotes: e.target.value})} />
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
            <label htmlFor="active" className="text-sm text-gray-700">Paciente Ativo</label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
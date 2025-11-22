import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { User, UserRole } from '../types';
import { Plus, UserCog, Trash2, AlertTriangle } from 'lucide-react';

export const Therapists: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<User | null>(null);
  
  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [therapistToDelete, setTherapistToDelete] = useState<string | null>(null);

  const initialForm: User = {
      id: '',
      name: '',
      email: '',
      password: '',
      role: UserRole.THERAPIST,
      specialty: '',
      licenseNumber: '',
      phone: '',
      paymentPerSession: 0,
      active: true,
      bio: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenModal = (therapist?: User) => {
      if (therapist) {
          setEditingTherapist(therapist);
          setFormData(therapist);
      } else {
          setEditingTherapist(null);
          setFormData(initialForm);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTherapist) {
          updateUser({ ...formData });
          showToast('Terapeuta atualizado com sucesso!');
      } else {
          addUser({
              ...formData,
              id: Math.random().toString(36).substr(2, 9)
          });
          showToast('Terapeuta criado com sucesso!');
      }
      setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setTherapistToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (therapistToDelete) {
        deleteUser(therapistToDelete);
        showToast('Terapeuta removido com sucesso!', 'info');
        setIsDeleteModalOpen(false);
        setTherapistToDelete(null);
    }
  };

  const therapists = users.filter(u => u.role === UserRole.THERAPIST);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Gestão de Terapeutas</h1>
          <p className="text-gray-500">{therapists.length} terapeuta(s) registado(s)</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Terapeuta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {therapists.map(therapist => (
              <div key={therapist.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                      {/* Updated Avatar Colors */}
                      <div className="h-14 w-14 rounded-full bg-blue-50 text-[#1e3a5f] flex items-center justify-center text-xl font-bold mr-4 border border-blue-100">
                          {therapist.name.charAt(0)}
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-900">{therapist.name}</h3>
                          <p className="text-sm text-gray-500">{therapist.specialty}</p>
                      </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><span className="font-medium text-[#1e3a5f]">Cédula:</span> {therapist.licenseNumber}</p>
                      <p><span className="font-medium text-[#1e3a5f]">Tel:</span> {therapist.phone}</p>
                      <p><span className="font-medium text-[#1e3a5f]">Email:</span> {therapist.email}</p>
                      <p className="text-[#1e3a5f] font-bold pt-2">Pagamento/Sessão: €{therapist.paymentPerSession}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${therapist.active ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                          {therapist.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenModal(therapist)} title="Editar">
                            <UserCog size={16} className="text-gray-400 hover:text-[#1e3a5f]" />
                        </Button>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:bg-red-50"
                            onClick={() => handleDeleteClick(therapist.id)}
                            title="Apagar"
                        >
                            <Trash2 size={16} className="text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                  </div>
              </div>
          ))}
          {therapists.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">Nenhum terapeuta registado.</div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTherapist ? "Editar Terapeuta" : "Novo Terapeuta"}>
          <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Email (Login) *" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <Input label="Password *" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Especialidade" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                 <Input label="Nº Cédula" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 <Input label="Pagamento por Sessão (€)" type="number" value={formData.paymentPerSession} onChange={e => setFormData({...formData, paymentPerSession: parseFloat(e.target.value)})} />
              </div>

              <TextArea label="Biografia" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
              
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="activeTherapist" 
                    checked={formData.active} 
                    onChange={e => setFormData({...formData, active: e.target.checked})} 
                  />
                  <label htmlFor="activeTherapist" className="text-sm text-gray-700">Conta Ativa</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                   <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                   <Button type="submit">Guardar</Button>
              </div>
          </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminação" maxWidth="sm">
          <div className="text-center p-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Apagar Terapeuta?</h3>
              <p className="text-sm text-gray-500 mb-6">
                  Tem a certeza que deseja apagar este terapeuta? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancelar
                  </Button>
                  <Button variant="danger" onClick={confirmDelete}>
                      Apagar
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
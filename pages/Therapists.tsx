import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { User, UserRole } from '../types';
import { Plus, UserCog } from 'lucide-react';

export const Therapists: React.FC = () => {
  const { users, addUser, updateUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<User | null>(null);

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
      } else {
          addUser({
              ...formData,
              id: Math.random().toString(36).substr(2, 9)
          });
      }
      setIsModalOpen(false);
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
                      <div className="h-14 w-14 rounded-full bg-blue-100 text-[#1e3a5f] flex items-center justify-center text-xl font-bold mr-4">
                          {therapist.name.charAt(0)}
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-900">{therapist.name}</h3>
                          <p className="text-sm text-gray-500">{therapist.specialty}</p>
                      </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><span className="font-medium">Cédula:</span> {therapist.licenseNumber}</p>
                      <p><span className="font-medium">Tel:</span> {therapist.phone}</p>
                      <p><span className="font-medium">Email:</span> {therapist.email}</p>
                      <p className="text-[#1e3a5f] font-bold pt-2">Pagamento/Sessão: €{therapist.paymentPerSession}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${therapist.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {therapist.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenModal(therapist)}>
                          <UserCog size={16} />
                      </Button>
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
    </div>
  );
};
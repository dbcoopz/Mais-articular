
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { User, UserRole } from '../types';
import { Plus, UserCog, Trash2, AlertTriangle, Briefcase } from 'lucide-react';

export const Profissionais: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, specialties, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<User | null>(null);
  
  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profissionalToDelete, setProfissionalToDelete] = useState<string | null>(null);

  const initialForm: User = {
      id: '',
      name: '',
      email: '',
      password: '',
      role: UserRole.PROFISSIONAL,
      specialtyId: '', // Changed from specialty string to ID
      licenseNumber: '',
      phone: '',
      paymentPerSession: 0,
      active: true,
      bio: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenModal = (profissional?: User) => {
      if (profissional) {
          setEditingProfissional(profissional);
          setFormData(profissional);
      } else {
          setEditingProfissional(null);
          setFormData(initialForm);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingProfissional) {
          updateUser({ ...formData });
          showToast('Profissional atualizado com sucesso!');
      } else {
          addUser({
              ...formData,
              id: Math.random().toString(36).substr(2, 9)
          });
          showToast('Profissional criado com sucesso!');
      }
      setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setProfissionalToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (profissionalToDelete) {
        deleteUser(profissionalToDelete);
        showToast('Profissional removido com sucesso!', 'info');
        setIsDeleteModalOpen(false);
        setProfissionalToDelete(null);
    }
  };

  const profissionais = users.filter(u => u.role === UserRole.PROFISSIONAL);

  const getSpecialtyName = (id?: string) => {
      const spec = specialties.find(s => s.id === id);
      return spec ? spec.name : 'Sem especialidade';
  };

  const getSpecialtyColor = (id?: string) => {
      const spec = specialties.find(s => s.id === id);
      return spec ? spec.color : 'bg-gray-100 text-gray-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Gestão de Profissionais</h1>
          <p className="text-gray-500">{profissionais.length} profissional(s) registado(s)</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Profissional
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map(profissional => {
              const specColor = getSpecialtyColor(profissional.specialtyId);
              return (
                <div key={profissional.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                        <div className="h-14 w-14 rounded-full bg-blue-50 text-[#1e3a5f] flex items-center justify-center text-xl font-bold mr-4 border border-blue-100">
                            {profissional.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{profissional.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${specColor}`}>
                                {getSpecialtyName(profissional.specialtyId)}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p><span className="font-medium text-[#1e3a5f]">Cédula:</span> {profissional.licenseNumber || '-'}</p>
                        <p><span className="font-medium text-[#1e3a5f]">Tel:</span> {profissional.phone || '-'}</p>
                        <p><span className="font-medium text-[#1e3a5f]">Email:</span> {profissional.email}</p>
                        <p className="text-[#1e3a5f] font-bold pt-2">Pagamento/Sessão: €{profissional.paymentPerSession}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${profissional.active ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
                            {profissional.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenModal(profissional)} title="Editar">
                                <UserCog size={16} className="text-gray-400 hover:text-[#1e3a5f]" />
                            </Button>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-red-50"
                                onClick={() => handleDeleteClick(profissional.id)}
                                title="Apagar"
                            >
                                <Trash2 size={16} className="text-gray-400 hover:text-red-600" />
                            </Button>
                        </div>
                    </div>
                </div>
              );
          })}
          {profissionais.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">Nenhum profissional registado.</div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProfissional ? "Editar Profissional" : "Novo Profissional"}>
          <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Email (Login) *" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <Input label="Password *" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade *</label>
                    <select 
                        className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                        value={formData.specialtyId}
                        onChange={e => setFormData({...formData, specialtyId: e.target.value})}
                        required
                    >
                        <option value="">Selecione...</option>
                        {specialties.map(spec => (
                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                        ))}
                    </select>
                 </div>
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
                    id="activeProfissional" 
                    checked={formData.active} 
                    onChange={e => setFormData({...formData, active: e.target.checked})} 
                  />
                  <label htmlFor="activeProfissional" className="text-sm text-gray-700">Conta Ativa</label>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Apagar Profissional?</h3>
              <p className="text-sm text-gray-500 mb-6">
                  Tem a certeza que deseja apagar este profissional? Esta ação não pode ser desfeita.
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

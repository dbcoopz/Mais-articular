import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { User, UserRole } from '../types';
import { Plus, ShieldCheck, UserCog, Trash2, Mail, Phone } from 'lucide-react';

export const Administrators: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  const initialForm: User = {
      id: '',
      name: '',
      email: '',
      password: '',
      role: UserRole.ADMIN,
      phone: '',
      active: true,
      bio: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenModal = (admin?: User) => {
      if (admin) {
          setEditingAdmin(admin);
          setFormData(admin);
      } else {
          setEditingAdmin(null);
          setFormData(initialForm);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingAdmin) {
          updateUser({ ...formData });
      } else {
          addUser({
              ...formData,
              id: Math.random().toString(36).substr(2, 9)
          });
      }
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('Tem a certeza que deseja apagar este administrador? Esta ação é irreversível.')) {
          deleteUser(id);
      }
  };

  const admins = users.filter(u => u.role === UserRole.ADMIN);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Gestão de Administradores</h1>
          <p className="text-gray-500">{admins.length} administrador(es) registado(s)</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Novo Administrador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map(admin => (
              <div key={admin.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                      <div className="h-14 w-14 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xl font-bold mr-4">
                          {admin.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                          <h3 className="font-bold text-gray-900 truncate">{admin.name}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                              <ShieldCheck size={12} className="mr-1 text-blue-600" />
                              Administrador
                          </div>
                      </div>
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                      <p className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400"/> 
                          <span className="truncate">{admin.email}</span>
                      </p>
                      {admin.phone && (
                          <p className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400"/> 
                              <span>{admin.phone}</span>
                          </p>
                      )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${admin.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {admin.active ? 'Ativo' : 'Inativo'}
                      </span>
                      
                      <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenModal(admin)} title="Editar">
                              <UserCog size={16} />
                          </Button>
                          {/* Prevent deleting oneself */}
                          {admin.id !== currentUser?.id && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(admin.id)}
                                title="Apagar"
                              >
                                  <Trash2 size={16} />
                              </Button>
                          )}
                      </div>
                  </div>
              </div>
          ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAdmin ? "Editar Administrador" : "Novo Administrador"}>
          <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Email (Login) *" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <Input label="Password *" type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              <Input label="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />

              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="activeAdmin" 
                    checked={formData.active} 
                    onChange={e => setFormData({...formData, active: e.target.checked})} 
                    disabled={editingAdmin?.id === currentUser?.id} // Prevent deactivating oneself
                  />
                  <label htmlFor="activeAdmin" className="text-sm text-gray-700">Conta Ativa</label>
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
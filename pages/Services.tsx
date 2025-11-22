
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { SessionType, Specialty } from '../types';
import { Plus, Edit2, Trash2, AlertTriangle, Briefcase, Filter, Tag, Clock, Euro, Palette, MoreHorizontal } from 'lucide-react';

export const Services: React.FC = () => {
  const { 
    sessionTypes, addSessionType, updateSessionType, deleteSessionType, 
    specialties, addSpecialty, updateSpecialty, deleteSpecialty, 
    showToast 
  } = useApp();
  
  // Service Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isServiceDeleteModalOpen, setIsServiceDeleteModalOpen] = useState(false);
  
  // Specialty Modals
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isSpecialtyDeleteModalOpen, setIsSpecialtyDeleteModalOpen] = useState(false);

  // Form & Selection States
  const [editingService, setEditingService] = useState<SessionType | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<string | null>(null);

  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL');

  const initialServiceForm: Omit<SessionType, 'id'> = {
    name: '',
    specialtyId: '',
    defaultDuration: 45,
    defaultCost: 40,
    active: true
  };
  const [serviceFormData, setServiceFormData] = useState(initialServiceForm);

  const initialSpecialtyForm: Omit<Specialty, 'id'> = {
    name: '',
    color: 'bg-gray-100 text-gray-800'
  };
  const [specialtyFormData, setSpecialtyFormData] = useState(initialSpecialtyForm);

  // --- Service Handlers ---
  const handleOpenServiceModal = (type?: SessionType) => {
    if (type) {
      setEditingService(type);
      setServiceFormData(type);
    } else {
      setEditingService(null);
      setServiceFormData(initialServiceForm);
    }
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateSessionType({ ...serviceFormData, id: editingService.id });
      showToast('Serviço atualizado com sucesso!');
    } else {
      addSessionType({ ...serviceFormData, id: Math.random().toString(36).substr(2, 9) });
      showToast('Serviço criado com sucesso!');
    }
    setIsServiceModalOpen(false);
  };

  const handleServiceDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setIsServiceDeleteModalOpen(true);
  };

  const confirmServiceDelete = () => {
    if (serviceToDelete) {
      deleteSessionType(serviceToDelete);
      showToast('Serviço removido com sucesso!', 'info');
      setIsServiceDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };
  
  // --- Specialty Handlers ---
  const handleOpenSpecialtyModal = (spec?: Specialty) => {
    if (spec) {
      setEditingSpecialty(spec);
      setSpecialtyFormData(spec);
    } else {
      setEditingSpecialty(null);
      setSpecialtyFormData(initialSpecialtyForm);
    }
    setIsSpecialtyModalOpen(true);
  };

  const handleSpecialtySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSpecialty) {
      updateSpecialty({ ...specialtyFormData, id: editingSpecialty.id });
      showToast('Especialidade atualizada com sucesso!');
    } else {
      addSpecialty({ ...specialtyFormData, id: `spec${Date.now()}` });
      showToast('Especialidade criada com sucesso!');
    }
    setIsSpecialtyModalOpen(false);
  };

  const handleSpecialtyDeleteClick = (id: string) => {
    setSpecialtyToDelete(id);
    setIsSpecialtyDeleteModalOpen(true);
  };

  const confirmSpecialtyDelete = () => {
    if (specialtyToDelete) {
      deleteSpecialty(specialtyToDelete);
      showToast('Especialidade e serviços associados removidos!', 'info');
      setIsSpecialtyDeleteModalOpen(false);
      setSpecialtyToDelete(null);
    }
  };

  const filteredServices = useMemo(() => {
    if (specialtyFilter === 'ALL') {
      return sessionTypes;
    }
    return sessionTypes.filter(st => st.specialtyId === specialtyFilter);
  }, [sessionTypes, specialtyFilter]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Serviços e Especialidades</h1>
          <p className="text-gray-500">Configure os tipos de consulta disponíveis na clínica.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => handleOpenSpecialtyModal()} variant="secondary">
              <Tag size={18} className="mr-2" /> Nova Especialidade
            </Button>
            <Button onClick={() => handleOpenServiceModal()}>
              <Plus size={18} className="mr-2" /> Novo Serviço
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Services List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <Filter size={18} className="text-gray-400 ml-2" />
              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
              <div className="flex-1 flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  <button 
                    onClick={() => setSpecialtyFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${specialtyFilter === 'ALL' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Todos
                  </button>
                  {specialties.map(spec => (
                      <button 
                        key={spec.id}
                        onClick={() => setSpecialtyFilter(spec.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors border ${specialtyFilter === spec.id ? 'border-transparent ring-2 ring-[#1e3a5f] ring-offset-1' : 'border-transparent hover:border-gray-200'}`}
                        style={{ backgroundColor: specialtyFilter === spec.id ? 'white' : '', color: 'inherit' }}
                      >
                         <span className={`px-2 py-0.5 rounded-md ${spec.color}`}>{spec.name}</span>
                      </button>
                  ))}
              </div>
          </div>

          <div className="space-y-3">
            {filteredServices.map(type => {
              const specialty = specialties.find(s => s.id === type.specialtyId);
              return (
                <div key={type.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-1 sm:mt-0 ${specialty?.color || 'bg-gray-100 text-gray-500'}`}>
                        <Briefcase size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{type.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        {specialty && (
                            <span className={`px-1.5 py-0.5 rounded ${specialty.color} mix-blend-multiply`}>
                                {specialty.name}
                            </span>
                        )}
                        <span className="flex items-center gap-1"><Clock size={12}/> {type.defaultDuration} min</span>
                        <span className="flex items-center gap-1 font-medium text-[#1e3a5f] bg-blue-50 px-1.5 py-0.5 rounded"><Euro size={12}/> {type.defaultCost.toFixed(2)}</span>
                        {!type.active && <span className="text-red-500 font-medium">Inativo</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-3 sm:mt-0 pl-14 sm:pl-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenServiceModal(type)} title="Editar">
                      <Edit2 size={16} className="text-gray-400 hover:text-[#1e3a5f]" />
                    </Button>
                    <Button size="sm" variant="ghost" className="hover:bg-red-50" onClick={() => handleServiceDeleteClick(type.id)} title="Apagar">
                      <Trash2 size={16} className="text-gray-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredServices.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="mx-auto h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Briefcase className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">Nenhum serviço encontrado.</p>
                <Button variant="ghost" size="sm" onClick={() => handleOpenServiceModal()} className="mt-2 text-[#1e3a5f]">
                    Criar Serviço
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Specialties Management */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-[#1e3a5f]" /> 
                    Gerir Especialidades
                </h3>
                <div className="space-y-2">
                    {specialties.map(spec => (
                    <div key={spec.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-3 h-3 rounded-full ${spec.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                            <span className="text-sm font-medium text-gray-700 truncate">{spec.name}</span>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenSpecialtyModal(spec)} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] rounded"><Edit2 size={12} /></button>
                            <button onClick={() => handleSpecialtyDeleteClick(spec.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                        </div>
                    </div>
                    ))}
                    <button 
                        onClick={() => handleOpenSpecialtyModal()}
                        className="w-full py-2 mt-2 text-xs font-medium text-gray-500 hover:text-[#1e3a5f] border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={12} /> Adicionar Outra
                    </button>
                </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p className="font-bold mb-1 flex items-center gap-2"><AlertTriangle size={14}/> Dica</p>
                <p className="opacity-80">As especialidades ajudam a organizar os serviços e filtram a lista. Cada serviço deve pertencer a uma especialidade.</p>
            </div>
        </div>
      </div>

      {/* Service Modal */}
      <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title={editingService ? "Editar Serviço" : "Novo Serviço"}>
        <form onSubmit={handleServiceSubmit} className="space-y-4">
          <Input label="Nome do Serviço *" value={serviceFormData.name} onChange={e => setServiceFormData({ ...serviceFormData, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade *</label>
            <select
                className="w-full bg-white text-gray-900 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
                value={serviceFormData.specialtyId}
                onChange={e => setServiceFormData({ ...serviceFormData, specialtyId: e.target.value })}
                required
            >
                <option value="">Selecione...</option>
                {specialties.map(spec => (
                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duração (min) *" type="number" value={serviceFormData.defaultDuration} onChange={e => setServiceFormData({ ...serviceFormData, defaultDuration: parseInt(e.target.value) })} required />
            <Input label="Custo (€) *" type="number" step="0.01" value={serviceFormData.defaultCost} onChange={e => setServiceFormData({ ...serviceFormData, defaultCost: parseFloat(e.target.value) })} required />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <input 
                type="checkbox" 
                id="service-active" 
                checked={serviceFormData.active} 
                onChange={e => setServiceFormData({ ...serviceFormData, active: e.target.checked })} 
                className="rounded text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <label htmlFor="service-active" className="text-sm font-medium text-gray-700">Serviço Ativo</label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsServiceModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Specialty Modal */}
      <Modal isOpen={isSpecialtyModalOpen} onClose={() => setIsSpecialtyModalOpen(false)} title={editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}>
        <form onSubmit={handleSpecialtySubmit} className="space-y-4">
          <Input label="Nome da Especialidade *" value={specialtyFormData.name} onChange={e => setSpecialtyFormData({...specialtyFormData, name: e.target.value})} required />
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Etiqueta</label>
              <div className="grid grid-cols-3 gap-2">
                  {[
                      { label: 'Azul', value: 'bg-blue-100 text-blue-800' },
                      { label: 'Roxo', value: 'bg-purple-100 text-purple-800' },
                      { label: 'Verde', value: 'bg-green-100 text-green-800' },
                      { label: 'Rosa', value: 'bg-pink-100 text-pink-800' },
                      { label: 'Laranja', value: 'bg-orange-100 text-orange-800' },
                      { label: 'Cinza', value: 'bg-gray-100 text-gray-800' },
                  ].map((color) => (
                      <div 
                        key={color.value}
                        onClick={() => setSpecialtyFormData({...specialtyFormData, color: color.value})}
                        className={`cursor-pointer p-2 rounded-lg border text-center text-xs font-bold transition-all ${specialtyFormData.color === color.value ? 'ring-2 ring-[#1e3a5f] ring-offset-1 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                          <span className={`px-2 py-0.5 rounded ${color.value}`}>{color.label}</span>
                      </div>
                  ))}
              </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsSpecialtyModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modals */}
      <Modal isOpen={isServiceDeleteModalOpen} onClose={() => setIsServiceDeleteModalOpen(false)} title="Apagar Serviço?" maxWidth="sm">
          <div className="text-center p-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Apagar Serviço?</h3>
              <p className="text-sm text-gray-500 mb-6">
                  Tem a certeza que deseja apagar este serviço? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={() => setIsServiceDeleteModalOpen(false)}>Cancelar</Button>
                  <Button variant="danger" onClick={confirmServiceDelete}>Apagar</Button>
              </div>
          </div>
      </Modal>
      
      <Modal isOpen={isSpecialtyDeleteModalOpen} onClose={() => setIsSpecialtyDeleteModalOpen(false)} title="Apagar Especialidade?" maxWidth="sm">
          <div className="text-center p-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Apagar Especialidade?</h3>
              <p className="text-sm text-gray-500 mb-6">
                <strong>Atenção:</strong> Apagar uma especialidade irá também remover todos os serviços associados a ela.
              </p>
              <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={() => setIsSpecialtyDeleteModalOpen(false)}>Cancelar</Button>
                  <Button variant="danger" onClick={confirmSpecialtyDelete}>Apagar Tudo</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

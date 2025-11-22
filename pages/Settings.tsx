
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Download, Upload, AlertTriangle, Database, HardDrive, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { users, utentes, sessions, appointments, waitingList, sessionTypes, specialties, restoreData, clearAllData, showToast } = useApp();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      users,
      utentes,
      sessions,
      appointments,
      waitingList,
      sessionTypes,
      specialties,
      exportDate: new Date().toISOString(),
      appVersion: '1.0'
    };

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `backup_mais_articular_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup descarregado com sucesso!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          if (e.target?.result) {
            const parsedData = JSON.parse(e.target.result as string);
            restoreData(parsedData);
            setImportSuccess(true);
            showToast('Dados restaurados com sucesso!');
            setTimeout(() => setImportSuccess(false), 3000);
          }
        } catch (error) {
          showToast('Erro ao ler ficheiro de backup. Certifique-se que é um ficheiro .json válido.', 'error');
        }
      };
    }
  };

  const handleReset = () => {
    clearAllData();
    // No need for toast here as page reloads
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Configurações</h1>
        <p className="text-gray-500">Gestão de sistema e dados</p>
      </div>

      <div className="space-y-6">
        {/* Backup Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Uniform Color */}
              <div className="p-2 bg-blue-50 text-[#1e3a5f] rounded-lg">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Cópia de Segurança (Backup)</h2>
                <p className="text-sm text-gray-500">Exporte e importe os seus dados para garantir segurança.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
             <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors">
                   <div className="flex items-center gap-2 mb-2 text-[#1e3a5f] font-bold">
                      <Download size={20} /> Exportar Dados
                   </div>
                   <p className="text-sm text-gray-600 mb-4">
                      Descarregue um ficheiro .json com todos os dados (utentes, sessões, etc.). Guarde este ficheiro num local seguro (ex: Google Drive, Pen USB).
                   </p>
                   <Button onClick={handleExport} variant="outline" className="w-full">
                      Baixar Backup
                   </Button>
                </div>

                <div className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors relative">
                   <div className="flex items-center gap-2 mb-2 text-[#1e3a5f] font-bold">
                      <Upload size={20} /> Restaurar Dados
                   </div>
                   <p className="text-sm text-gray-600 mb-4">
                      Carregue um ficheiro de backup anterior para restaurar o estado do sistema. 
                      <span className="text-red-500 font-bold"> Atenção: Isto substitui os dados atuais.</span>
                   </p>
                   
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".json"
                   />
                   
                   {importSuccess ? (
                     <div className="w-full py-2 bg-green-100 text-green-800 rounded-md text-center text-sm font-bold flex items-center justify-center gap-2">
                        <Check size={18} /> Restaurado com sucesso!
                     </div>
                   ) : (
                     <Button onClick={handleImportClick} variant="outline" className="w-full">
                        Carregar Ficheiro
                     </Button>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Danger Zone - Keeping Red as it indicates Danger */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-6 border-b border-red-50 bg-red-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Zona de Perigo</h2>
                <p className="text-sm text-gray-500">Ações irreversíveis que afetam todos os dados.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-gray-900">Reset de Fábrica</h3>
                   <p className="text-sm text-gray-500 mt-1">Apaga todos os utentes, sessões e configurações. Mantém apenas os utilizadores iniciais.</p>
                </div>
                <Button variant="danger" onClick={() => setIsResetModalOpen(true)}>
                   Apagar Tudo
                </Button>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Confirmar Reset Total" maxWidth="md">
          <div className="p-4 text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tem a certeza absoluta?</h3>
              <p className="text-gray-600 mb-6">
                 Esta ação irá <strong>apagar permanentemente</strong> todos os dados registados na aplicação neste dispositivo (Utentes, Sessões, Faturação, Lista de Espera). 
                 <br/><br/>
                 Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center gap-4">
                  <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
                  <Button variant="danger" onClick={handleReset}>Sim, Apagar Tudo</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Calendar, Clock, FileText, Phone, Mail, User, Paperclip, Trash2, Plus, Upload, Tag, MapPin } from 'lucide-react';
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

  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem a certeza que deseja apagar este documento?')) {
      deletePatientDocument(patient.id, docId);
      showToast('Documento removido.', 'info');
    }
  };

  const handleOpenDoc = (doc: any) => {
      // Simulation of opening a file
      // In a real app, this would be window.open(doc.url)
      alert(`A abrir documento: ${doc.name}`);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost
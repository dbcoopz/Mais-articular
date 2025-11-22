
import { User, UserRole, Patient, Session, Appointment, WaitingListEntry, SessionType } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Marco André',
    email: 'admin@maisarticular.com',
    password: 'admin',
    role: UserRole.ADMIN,
    active: true,
    bio: 'Administrador do Sistema'
  },
  {
    id: 'u2',
    name: 'Matilde Costa',
    email: 'matilde@maisarticular.com',
    password: 'user',
    role: UserRole.THERAPIST,
    specialty: 'Terapia da Fala Infantil',
    licenseNumber: 'TF12345',
    phone: '+351 912 345 678',
    paymentPerSession: 25,
    active: true,
    bio: 'Especialista em desenvolvimento infantil.'
  },
  {
    id: 'u3',
    name: 'Terapeuta Demo',
    email: 'terapeuta@maisarticular.com',
    password: 'demo',
    role: UserRole.THERAPIST,
    specialty: 'Terapia da Fala Geral',
    licenseNumber: 'TF99999',
    phone: '+351 910 000 000',
    paymentPerSession: 30,
    active: true,
    bio: 'Conta de demonstração para terapeutas.'
  }
];

export const INITIAL_SESSION_TYPES: SessionType[] = [
  {
    id: 'st1',
    name: 'Sessão Terapia da Fala (45min)',
    defaultDuration: 45,
    defaultCost: 45,
    active: true
  },
  {
    id: 'st2',
    name: 'Avaliação Inicial',
    defaultDuration: 60,
    defaultCost: 60,
    active: true
  },
  {
    id: 'st3',
    name: 'Sessão de Acompanhamento (30min)',
    defaultDuration: 30,
    defaultCost: 35,
    active: true
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'João Silva',
    birthDate: '2018-05-15',
    age: 7,
    phone: '911222333',
    email: 'pai.joao@example.com',
    responsibleName: 'Carlos Silva',
    therapistId: 'u2',
    costPerSession: 0,
    customPrices: {}, // Usa preços padrão
    diagnosis: 'Dislalia',
    address: 'Rua das Flores, 123, Lisboa',
    clinicalNotes: 'Dificuldade na articulação do /r/.',
    active: true,
    documents: [
      { id: 'd1', name: 'Relatório Escolar.pdf', type: 'PDF', uploadDate: '2025-10-01', size: '2.4 MB' }
    ]
  },
  {
    id: 'p2',
    name: 'Ana Pereira',
    birthDate: '2019-08-20',
    age: 6,
    phone: '911444555',
    email: 'mae.ana@example.com',
    responsibleName: 'Maria Pereira',
    therapistId: 'u2',
    costPerSession: 0,
    customPrices: { 'st1': 40 }, // Exemplo: Preço especial para sessão normal
    diagnosis: 'Atraso de Desenvolvimento de Linguagem',
    address: 'Av. da Liberdade, 45, Lisboa',
    clinicalNotes: 'Iniciando intervenção.',
    active: true,
    documents: []
  }
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 's1',
    patientId: 'p1',
    therapistId: 'u2',
    sessionTypeId: 'st1',
    date: '2025-11-17',
    startTime: '14:00',
    durationMinutes: 45,
    activities: 'Treino do fonema /r/ em posição inicial.',
    progressNotes: 'Boa evolução.',
    homework: 'Repetir lista de palavras.',
    status: 'COMPLETED',
    cost: 45,
    therapistPayment: 25
  },
  {
    id: 's2',
    patientId: 'p2',
    therapistId: 'u2',
    sessionTypeId: 'st2',
    date: '2025-11-18',
    startTime: '10:00',
    durationMinutes: 60,
    activities: 'Avaliação inicial.',
    progressNotes: 'Realizada anamnese.',
    homework: '',
    status: 'COMPLETED',
    cost: 40,
    therapistPayment: 25
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    therapistId: 'u2',
    sessionTypeId: 'st1',
    date: '2025-11-20',
    time: '14:00',
    durationMinutes: 45,
    notes: 'Sessão regular',
    status: 'PENDING'
  }
];

export const INITIAL_WAITING_LIST: WaitingListEntry[] = [
  {
    id: 'w1',
    name: 'Miguel Oliveira',
    birthDate: '2020-02-10',
    age: 5,
    responsibleName: 'Sónia Oliveira',
    phone: '915555666',
    email: 'sonia.o@example.com',
    preferredSchedule: 'Finais de tarde (após 17h30)',
    reason: 'Gaguez',
    registrationDate: '2025-10-15',
    notes: 'Referenciado pela escola.'
  }
];

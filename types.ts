
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFISSIONAL = 'PROFISSIONAL'
}

// Specialty is now an interface to be managed dynamically
export interface Specialty {
  id: string;
  name: string;
  color: string; // e.g., 'bg-blue-100 text-blue-800'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text
  role: UserRole;
  specialtyId?: string; // Changed from specialty string to ID relation
  licenseNumber?: string; // Nº Cédula
  phone?: string;
  paymentPerSession?: number;
  bio?: string;
  active: boolean;
}

export interface UtenteDocument {
  id: string;
  name: string;
  type: string; // 'PDF', 'IMG', etc.
  uploadDate: string;
  url?: string; // In a real app, this is the storage URL
  size?: string;
}

export interface Utente {
  id: string;
  name: string;
  birthDate: string; // ISO string YYYY-MM-DD
  age: number;
  phone: string;
  email: string;
  responsibleName: string;
  profissionalId: string;
  customPrices?: Record<string, number>; // Chave: SessionType ID, Valor: Preço Personalizado
  diagnosis: string;
  address: string;
  clinicalNotes: string;
  active: boolean;
  documents?: UtenteDocument[]; // New field
}

export interface SessionType {
  id: string;
  name: string;
  specialtyId: string; // Changed from specialty: Specialty
  defaultDuration: number;
  defaultCost: number;
  active: boolean;
}

export interface Session {
  id: string;
  utenteId: string;
  profissionalId: string;
  sessionTypeId?: string; // Ligação ao tipo de sessão
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  activities: string;
  progressNotes: string;
  homework: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED';
  cost: number; // Snapshot of cost at time of session
  therapistPayment: number; // Snapshot of payment at time of session
}

export interface Appointment {
  id: string;
  utenteId: string;
  profissionalId: string;
  sessionTypeId?: string; // Ligação ao tipo de sessão
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  notes: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  groupId?: string; // ID to link recurring appointments
}

export interface WaitingListEntry {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  responsibleName: string;
  phone: string;
  email: string;
  preferredSchedule: string; // Ex: "Manhã", "Pós-Laboral"
  reason: string; // Motivo da consulta
  registrationDate: string; // Data de inscrição na lista
  notes?: string;
}

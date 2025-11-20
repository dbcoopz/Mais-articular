export enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text
  role: UserRole;
  specialty?: string;
  licenseNumber?: string; // Nº Cédula
  phone?: string;
  paymentPerSession?: number;
  bio?: string;
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO string YYYY-MM-DD
  age: number;
  phone: string;
  email: string;
  responsibleName: string;
  therapistId: string;
  costPerSession: number;
  diagnosis: string;
  address: string;
  clinicalNotes: string;
  active: boolean;
}

export interface Session {
  id: string;
  patientId: string;
  therapistId: string;
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
  patientId: string;
  therapistId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  notes: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

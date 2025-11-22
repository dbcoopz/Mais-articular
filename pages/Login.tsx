import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, showToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      showToast('Bem-vindo de volta!', 'success');
      navigate('/dashboard');
    } else {
      showToast('Credenciais inválidas ou conta inativa.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-material-enter">
        <div className="flex flex-col items-center mb-8">
          {/* Logo Replacement */}
          <img 
            src="/logo.png" 
            alt="Mais Articular" 
            className="max-w-[280px] w-full h-auto object-contain mb-4"
            onError={(e) => {
              // Fallback just in case image is missing during dev
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback Text if image fails to load */}
          <h1 className="hidden text-3xl font-bold text-[#1e3a5f] mb-2">MAIS ARTICULAR</h1>
          
          <p className="text-gray-500">Gestão de Terapia da Fala</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email" 
            type="email" 
            placeholder="admin@maisarticular.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button type="submit" fullWidth size="lg">
            Entrar
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-1">
           <p className="text-xs text-gray-400">Admin: "admin@maisarticular.com" / "admin"</p>
           <p className="text-xs text-gray-400">Terapeuta: "terapeuta@maisarticular.com" / "demo"</p>
        </div>
      </div>
    </div>
  );
};
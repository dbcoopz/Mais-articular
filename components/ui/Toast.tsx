import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000); // Auto close after 3 seconds

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColors = {
    success: 'bg-white border-green-500',
    error: 'bg-white border-red-500',
    info: 'bg-white border-blue-500',
  };

  const textColors = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`
      flex items-center p-4 mb-3 w-full max-w-xs rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out animate-material-enter
      ${bgColors[type]}
    `}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className={`ml-3 text-sm font-medium ${textColors[type]}`}>
        {message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        onClick={() => onClose(id)}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
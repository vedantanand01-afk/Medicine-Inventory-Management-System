import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
          border: 'border-emerald-500 bg-white shadow-emerald-500/10',
          text: 'text-slate-800',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          border: 'border-rose-500 bg-white shadow-rose-500/10',
          text: 'text-slate-800',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          border: 'border-amber-500 bg-white shadow-amber-500/10',
          text: 'text-slate-800',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
          border: 'border-blue-500 bg-white shadow-blue-500/10',
          text: 'text-slate-800',
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md rounded-xl border-l-4 shadow-lg border border-slate-200/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${style.border}`}
    >
      {style.icon}
      <p className={`text-sm font-medium flex-1 ${style.text}`}>{message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-200 ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-100'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
              : 'bg-zinc-900/95 border-zinc-700 text-zinc-100'
          }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />}

          <div className="flex-1 text-sm">
            {toast.title && <div className="font-semibold mb-0.5">{toast.title}</div>}
            <div className="text-zinc-200 text-xs leading-relaxed">{toast.message}</div>
            {toast.action && (
              <button
                type="button"
                onClick={toast.action.onClick}
                className="mt-2 text-xs font-semibold underline hover:no-underline text-purple-300 hover:text-white"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

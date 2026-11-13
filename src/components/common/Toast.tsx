import React from 'react';
import { useGreenToken } from '../../context/GreenTokenContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, ExternalLink } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useGreenToken();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderColor = 'border-emerald-500/40';
        let bgGlow = 'rgba(16, 185, 129, 0.15)';

        if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/40';
          bgGlow = 'rgba(245, 158, 11, 0.15)';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/40';
          bgGlow = 'rgba(244, 63, 94, 0.15)';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
          borderColor = 'border-cyan-500/40';
          bgGlow = 'rgba(6, 182, 212, 0.15)';
        }

        return (
          <div
            key={toast.id}
            style={{ backgroundColor: 'rgba(8, 25, 16, 0.95)', boxShadow: `0 10px 25px -5px ${bgGlow}` }}
            className={`pointer-events-auto backdrop-blur-md rounded-xl p-4 border ${borderColor} text-emerald-100 flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-3`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold text-white tracking-wide mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-emerald-200/90 leading-relaxed break-words">
                {toast.message}
              </p>
              {toast.txHash && (
                <div className="mt-2 pt-2 border-t border-emerald-900/50 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400/80">
                    TX: {toast.txHash.substring(0, 10)}...{toast.txHash.substring(toast.txHash.length - 8)}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${toast.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-300 hover:text-emerald-100 flex items-center gap-1 transition-colors"
                  >
                    Stellar Expert <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-emerald-400/60 hover:text-emerald-200 p-1 -mr-1 -mt-1 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};


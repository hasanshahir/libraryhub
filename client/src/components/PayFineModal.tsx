import React, { useState } from 'react';
import { Fine, payFine } from '../services/api';
import { X, CreditCard, Banknote, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface PayFineModalProps {
  isOpen: boolean;
  fine: Fine | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayFineModal: React.FC<PayFineModalProps> = ({
  isOpen,
  fine,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<'ONLINE_MOCK' | 'CASH'>('ONLINE_MOCK');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !fine) return null;

  const handlePay = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await payFine(fine.id, method);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/60">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Settle Library Fine</h3>
              <p className="text-xs text-slate-400">Clear overdue penalty fee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Outstanding Fine</p>
              <h4 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                ${Number(fine.amount).toFixed(2)}
              </h4>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="inline-block px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold mb-1">
                {fine.daysOverdue} Days Overdue
              </span>
              <p className="line-clamp-1 max-w-[180px] text-slate-300">
                {fine.borrowRecord?.book?.title || 'Book loan'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('ONLINE_MOCK')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  method === 'ONLINE_MOCK'
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Simulated Card Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CASH')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  method === 'CASH'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <Banknote className="h-5 w-5" />
                <span>Cash at Desk</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Process ${Number(fine.amount).toFixed(2)} Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Book, borrowBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, AlertCircle, CheckCircle, Loader2, BookOpen } from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  book,
  onClose,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [days, setDays] = useState(14);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(days));

  const handleBorrow = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await borrowBook({
        bookId: book.id,
        days,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to borrow book';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/60">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Borrow Book</h3>
              <p className="text-xs text-slate-400">Confirm checkout terms & due date</p>
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

        <div className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex gap-3">
            {book.coverUrl && (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-12 h-16 object-cover rounded-lg shrink-0"
              />
            )}
            <div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{book.title}</h4>
              <p className="text-xs text-slate-400">by {book.author}</p>
              <span className="inline-block text-[10px] text-emerald-400 font-medium mt-1">
                ✓ {book.availableCopies} copies currently available
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Borrow Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 21, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                    days === d
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-4 w-4 text-brand-400" /> Return Due Date:
              </span>
              <span className="font-bold text-white font-mono">
                {dueDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Borrower:</span>
              <span className="font-medium text-slate-200">
                {user?.name} ({user?.membershipId})
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-400/90 flex items-center gap-1">
              <span>⚠️ Overdue fine policy: $1.50 per day after the due date.</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleBorrow}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm Checkout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

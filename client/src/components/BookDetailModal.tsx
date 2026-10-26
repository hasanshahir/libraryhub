import React from 'react';
import { Book } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, BookOpen, Clock, Calendar, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface BookDetailModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onBorrow: (book: Book) => void;
  onReserve: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  isOpen,
  book,
  onClose,
  onBorrow,
  onReserve,
}) => {
  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="w-full sm:w-48 h-64 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                <BookOpen className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-xs">No Cover Image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  {book.category}
                </span>
                {isAvailable ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Available ({book.availableCopies} left)
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Waitlist Queue
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">{book.title}</h2>
              <p className="text-sm text-slate-300 mt-1">by <span className="font-semibold text-slate-100">{book.author}</span></p>

              <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">ISBN Number</span>
                  <span className="font-mono font-semibold text-slate-200">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Publisher</span>
                  <span className="text-slate-200">{book.publisher || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Year</span>
                  <span className="text-slate-200">{book.publishYear || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Inventory Stock</span>
                  <span className="text-slate-200">{book.availableCopies} / {book.totalCopies} copies</span>
                </div>
              </div>

              {book.description && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Synopsis
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                    {book.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
              {isAvailable ? (
                <button
                  onClick={() => {
                    onClose();
                    onBorrow(book);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Borrow This Book</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onReserve(book);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Join Waitlist Queue</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

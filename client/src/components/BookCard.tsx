import React from 'react';
import { Book } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Clock, Trash2, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onBorrow: (book: Book) => void;
  onReserve: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onSelect: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onBorrow,
  onReserve,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const { isLibrarian, isAuthenticated } = useAuth();
  const isAvailable = book.availableCopies > 0;
  const pendingReservationsCount = book._count?.reservations || 0;

  return (
    <div className="group relative rounded-2xl glass-card hover:border-brand-500/40 bg-slate-900/40 hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-brand-500/10">
      {/* Top Banner & Cover Image */}
      <div
        onClick={() => onSelect(book)}
        className="relative h-56 w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to placeholder if broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
          <span className="inline-block text-[11px] font-semibold tracking-wide text-brand-300 bg-brand-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-brand-500/30 w-fit mb-1">
            {book.category}
          </span>
        </div>

        {/* Copy Availability Pill */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              {book.availableCopies} of {book.totalCopies} Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md shadow-sm">
              <AlertCircle className="h-3 w-3" />
              Out of Stock {pendingReservationsCount > 0 ? `(${pendingReservationsCount} waiting)` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Book Metadata Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelect(book)}
            className="text-base font-bold text-white group-hover:text-brand-300 transition-colors cursor-pointer line-clamp-1"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">by {book.author}</p>

          {book.description && (
            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>ISBN: {book.isbn}</span>
            {book.publishYear && <span>{book.publishYear}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {isAvailable ? (
            <button
              onClick={() => onBorrow(book)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Borrow Book
            </button>
          ) : (
            <button
              onClick={() => onReserve(book)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              Reserve (Join Queue)
            </button>
          )}

          {isLibrarian && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(book)}
                title="Edit Book"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(book)}
                title="Delete Book"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

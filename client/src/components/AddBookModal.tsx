import React, { useState, useEffect } from 'react';
import { Book, lookupIsbn, createBook, updateBook } from '../services/api';
import { createBookSchema } from '../schemas';
import { X, Search, Sparkles, Loader2, BookPlus, AlertCircle } from 'lucide-react';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBook?: Book | null;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingBook,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    description: '',
    coverUrl: '',
    publishYear: new Date().getFullYear(),
    publisher: '',
    totalCopies: 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingBook) {
      setFormData({
        title: editingBook.title,
        author: editingBook.author,
        isbn: editingBook.isbn,
        category: editingBook.category,
        description: editingBook.description || '',
        coverUrl: editingBook.coverUrl || '',
        publishYear: editingBook.publishYear || new Date().getFullYear(),
        publisher: editingBook.publisher || '',
        totalCopies: editingBook.totalCopies,
      });
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Computer Science',
        description: '',
        coverUrl: '',
        publishYear: new Date().getFullYear(),
        publisher: '',
        totalCopies: 3,
      });
    }
    setErrors({});
    setLookupMessage(null);
  }, [editingBook, isOpen]);

  if (!isOpen) return null;

  const handleIsbnLookup = async () => {
    if (!formData.isbn || formData.isbn.trim().length < 9) {
      setErrors((prev) => ({ ...prev, isbn: 'Please enter a valid 10 or 13-digit ISBN' }));
      return;
    }

    setIsLookingUp(true);
    setLookupMessage(null);
    setErrors({});

    try {
      const data = await lookupIsbn(formData.isbn);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          author: data.author || prev.author,
          category: data.category || prev.category,
          publisher: data.publisher || prev.publisher,
          publishYear: data.publishYear || prev.publishYear,
          description: data.description || prev.description,
          coverUrl: data.coverUrl || prev.coverUrl,
        }));
        setLookupMessage('✨ Successfully auto-filled details from Open Library API!');
      }
    } catch (err: any) {
      setLookupMessage('⚠️ Could not find ISBN on Open Library. You can enter details manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with shared Zod schema
    const result = createBookSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBook) {
        await updateBook(editingBook.id, formData);
      } else {
        await createBook(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save book';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-slate-700/60 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <BookPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingBook ? 'Edit Book Details' : 'Add New Book to Catalogue'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingBook
                  ? 'Update inventory copies or catalog metadata'
                  : 'Enter ISBN for Open Library autofill or fill fields manually'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.form && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.form}
          </div>
        )}

        {lookupMessage && (
          <div className="mt-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-400" />
            {lookupMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* ISBN & Autofill Row */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ISBN (International Standard Book Number)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 9780132350884"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                disabled={!!editingBook}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
              {!editingBook && (
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  disabled={isLookingUp}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/20 disabled:opacity-50 transition-all shrink-0"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>Autofill via ISBN</span>
                </button>
              )}
            </div>
            {errors.isbn && <p className="text-rose-400 text-xs mt-1">{errors.isbn}</p>}
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Book Title *</label>
              <input
                type="text"
                placeholder="Clean Code"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Author(s) *</label>
              <input
                type="text"
                placeholder="Robert C. Martin"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.author && <p className="text-rose-400 text-xs mt-1">{errors.author}</p>}
            </div>
          </div>

          {/* Category & Total Copies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Fiction">Fiction</option>
                <option value="History">History</option>
                <option value="Business">Business</option>
                <option value="Psychology">Psychology</option>
                <option value="Science">Science</option>
                <option value="Philosophy">Philosophy</option>
                <option value="General">General</option>
              </select>
              {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Inventory Copies *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
              {errors.totalCopies && <p className="text-rose-400 text-xs mt-1">{errors.totalCopies}</p>}
            </div>
          </div>

          {/* Publisher & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Publisher</label>
              <input
                type="text"
                placeholder="Prentice Hall"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Publication Year</label>
              <input
                type="number"
                placeholder="2008"
                value={formData.publishYear}
                onChange={(e) => setFormData({ ...formData, publishYear: parseInt(e.target.value) || 2026 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500 font-mono text-xs"
            />
            {errors.coverUrl && <p className="text-rose-400 text-xs mt-1">{errors.coverUrl}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Synopsis</label>
            <textarea
              rows={3}
              placeholder="A brief overview of the book..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingBook ? 'Update Book' : 'Add Book to Catalogue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

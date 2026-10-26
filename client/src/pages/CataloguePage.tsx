import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBooks, fetchBookCategories, Book } from '../services/api';
import { BookCard } from '../components/BookCard';
import { Search, Filter, Sparkles, BookOpen, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface CataloguePageProps {
  onBorrow: (book: Book) => void;
  onReserve: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onSelect: (book: Book) => void;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({
  onBorrow,
  onReserve,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchBookCategories,
  });

  // Fetch books
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['books', search, category, availableOnly, sortBy, sortOrder, page],
    queryFn: () =>
      fetchBooks({
        search,
        category,
        availableOnly,
        sortBy,
        sortOrder,
        page,
        limit: 12,
      }),
  });

  const books: Book[] = data?.books || [];
  const pagination = data?.pagination || { totalBooks: 0, totalPages: 1, currentPage: 1 };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Smart Library Catalog & Transaction Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Discover, Borrow & <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">Reserve Books</span> Effortlessly.
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Real-time availability, zero-stock reservation waitlists, automated due date tracking, and Open Library catalog indexing.
          </p>

          {/* Search bar */}
          <div className="mt-8 relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by book title, author, ISBN or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-brand-500 shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter and Category Ribbon */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => {
              setCategory('All');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              category === 'All'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.name}
              onClick={() => {
                setCategory(cat.name);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                category === cat.name
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Controls: Available Only toggle & Sort */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <button
            onClick={() => {
              setAvailableOnly(!availableOnly);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              availableOnly
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full flex items-center justify-center border ${
                availableOnly ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
              }`}
            >
              {availableOnly && <Check className="h-2 w-2 text-slate-950 font-bold" />}
            </div>
            <span>Available Now</span>
          </button>

          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so as any);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="createdAt:desc">Newest Additions</option>
            <option value="title:asc">Title (A-Z)</option>
            <option value="author:asc">Author (A-Z)</option>
            <option value="availableCopies:desc">Most Copies Available</option>
          </select>
        </div>
      </section>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800/60 p-4"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-rose-500/20">
          <p className="text-rose-400 font-semibold text-sm">Failed to load book catalogue.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Retry Loading
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="p-16 text-center rounded-3xl glass-card border border-slate-800">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Books Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or switching categories.
          </p>
          {(search || category !== 'All' || availableOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setAvailableOnly(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onBorrow={onBorrow}
                onReserve={onReserve}
                onEdit={onEdit}
                onDelete={onDelete}
                onSelect={onSelect}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-800 pt-6">
              <span className="text-xs text-slate-400">
                Showing Page <span className="font-bold text-slate-200">{pagination.currentPage}</span> of{' '}
                <span className="font-bold text-slate-200">{pagination.totalPages}</span> ({pagination.totalBooks} total books)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

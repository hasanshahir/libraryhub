import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CataloguePage } from './pages/CataloguePage';
import { LibrarianDashboardPage } from './pages/LibrarianDashboardPage';
import { MemberDashboardPage } from './pages/MemberDashboardPage';
import { AddBookModal } from './components/AddBookModal';
import { BorrowModal } from './components/BorrowModal';
import { PayFineModal } from './components/PayFineModal';
import { BookDetailModal } from './components/BookDetailModal';
import { AuthModal } from './components/AuthModal';
import { Book, Fine, reserveBook, deleteBook } from './services/api';
import { Library, Github, ExternalLink, Shield, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

function MainApp() {
  const { user, isAuthenticated, isLibrarian } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'catalogue' | 'member-portal' | 'librarian-dashboard'>('catalogue');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [borrowTarget, setBorrowTarget] = useState<Book | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Book | null>(null);

  const [isPayFineOpen, setIsPayFineOpen] = useState(false);
  const [payFineTarget, setPayFineTarget] = useState<Fine | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reserve mutation
  const reserveMutation = useMutation({
    mutationFn: (bookId: string) => reserveBook(bookId),
    onSuccess: (data: any) => {
      showToast(data.message || 'Joined reservation queue successfully!');
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['member-dashboard'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to place reservation', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (bookId: string) => deleteBook(bookId),
    onSuccess: () => {
      showToast('Book removed from catalogue');
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['librarian-dashboard'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete book', 'error');
    },
  });

  const handleBorrowClick = (book: Book) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    setBorrowTarget(book);
    setIsBorrowOpen(true);
  };

  const handleReserveClick = (book: Book) => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    reserveMutation.mutate(book.id);
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setIsAddBookOpen(true);
  };

  const handleDeleteClick = (book: Book) => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from the catalogue?`)) {
      deleteMutation.mutate(book.id);
    }
  };

  const handleSelectBook = (book: Book) => {
    setDetailTarget(book);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/20'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-500/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        openAuthModal={() => setIsAuthOpen(true)}
        openAddBookModal={() => {
          setEditingBook(null);
          setIsAddBookOpen(true);
        }}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'catalogue' && (
          <CataloguePage
            onBorrow={handleBorrowClick}
            onReserve={handleReserveClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onSelect={handleSelectBook}
          />
        )}

        {activeTab === 'member-portal' && (
          <MemberDashboardPage
            onPayFine={(fine: Fine) => {
              setPayFineTarget(fine);
              setIsPayFineOpen(true);
            }}
            onExploreBooks={() => setActiveTab('catalogue')}
          />
        )}

        {activeTab === 'librarian-dashboard' && (
          <LibrarianDashboardPage
            onOpenAddBook={() => {
              setEditingBook(null);
              setIsAddBookOpen(true);
            }}
            onPayFine={(fine: Fine) => {
              setPayFineTarget(fine);
              setIsPayFineOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-brand-400" />
            <span className="font-bold text-slate-300">LibraryHub</span>
            <span>— Week 2 Full Stack Assignment</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>TypeScript</span>
            <span>•</span>
            <span>PostgreSQL & Prisma</span>
            <span>•</span>
            <span>Express.js</span>
            <span>•</span>
            <span>React + TanStack Query</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/hasanshahir"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddBookModal
        isOpen={isAddBookOpen}
        editingBook={editingBook}
        onClose={() => {
          setIsAddBookOpen(false);
          setEditingBook(null);
        }}
        onSuccess={() => {
          showToast(editingBook ? 'Book updated successfully' : 'Book added to library catalogue');
          qc.invalidateQueries({ queryKey: ['books'] });
          qc.invalidateQueries({ queryKey: ['categories'] });
          qc.invalidateQueries({ queryKey: ['librarian-dashboard'] });
        }}
      />

      <BorrowModal
        isOpen={isBorrowOpen}
        book={borrowTarget}
        onClose={() => {
          setIsBorrowOpen(false);
          setBorrowTarget(null);
        }}
        onSuccess={() => {
          showToast('Book borrowed successfully! Due in 14 days.');
          qc.invalidateQueries({ queryKey: ['books'] });
          qc.invalidateQueries({ queryKey: ['member-dashboard'] });
          qc.invalidateQueries({ queryKey: ['librarian-dashboard'] });
        }}
      />

      <BookDetailModal
        isOpen={isDetailOpen}
        book={detailTarget}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailTarget(null);
        }}
        onBorrow={(book) => handleBorrowClick(book)}
        onReserve={(book) => handleReserveClick(book)}
      />

      <PayFineModal
        isOpen={isPayFineOpen}
        fine={payFineTarget}
        onClose={() => {
          setIsPayFineOpen(false);
          setPayFineTarget(null);
        }}
        onSuccess={() => {
          showToast('Fine payment cleared successfully!');
          qc.invalidateQueries({ queryKey: ['member-dashboard'] });
          qc.invalidateQueries({ queryKey: ['librarian-dashboard'] });
          qc.invalidateQueries({ queryKey: ['all-fines'] });
        }}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

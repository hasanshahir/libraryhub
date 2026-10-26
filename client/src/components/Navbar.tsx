import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, UserCheck, Shield, LogOut, LogIn, ExternalLink, Library } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  openAddBookModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openAddBookModal,
}) => {
  const { user, isAuthenticated, isLibrarian, logout, quickLoginAs } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* Quick Demo Switcher Banner */}
      <div className="bg-gradient-to-r from-brand-900/60 via-slate-900 to-indigo-950/60 border-b border-brand-500/20 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">Demo Quick-Access:</span>
            <span>Switch roles instantly to test RBAC & transactional features:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => quickLoginAs('LIBRARIAN')}
              className={`px-2.5 py-0.5 rounded font-medium transition-all ${
                isLibrarian
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              🛡️ Demo Librarian
            </button>
            <button
              onClick={() => quickLoginAs('MEMBER')}
              className={`px-2.5 py-0.5 rounded font-medium transition-all ${
                isAuthenticated && !isLibrarian
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              👤 Demo Member
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab('catalogue')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Library<span className="text-brand-400">Hub</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Week 2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Enterprise Library Management</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'catalogue'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Book Catalogue
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('member-portal')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'member-portal'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                My Loans & Fines
              </button>
            )}

            {isLibrarian && (
              <button
                onClick={() => setActiveTab('librarian-dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'librarian-dashboard'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-brand-300 hover:text-brand-200 hover:bg-brand-950/40'
                }`}
              >
                <Shield className="h-4 w-4" />
                Librarian Dashboard
              </button>
            )}

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 flex items-center gap-1.5"
            >
              <span>Swagger API</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </a>
          </nav>

          {/* Action Right */}
          <div className="flex items-center gap-3">
            {isLibrarian && (
              <button
                onClick={openAddBookModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
              >
                + Add Book
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1.5">
                    {user?.name}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isLibrarian
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">{user?.membershipId}</div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition-all"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

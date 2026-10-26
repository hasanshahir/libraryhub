import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMemberDashboard,
  returnBook,
  cancelReservation,
  BorrowRecord,
  Fine,
  Reservation,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Calendar,
  AlertCircle,
  CreditCard,
  Clock,
  CheckCircle2,
  Bell,
  Trash2,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface MemberDashboardPageProps {
  onPayFine: (fine: Fine) => void;
  onExploreBooks: () => void;
}

export const MemberDashboardPage: React.FC<MemberDashboardPageProps> = ({
  onPayFine,
  onExploreBooks,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-dashboard'],
    queryFn: fetchMemberDashboard,
  });

  const returnMutation = useMutation({
    mutationFn: (borrowRecordId: string) => returnBook(borrowRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) => cancelReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400 mx-auto" />
        <p className="text-slate-400 text-sm mt-3">Loading member portal...</p>
      </div>
    );
  }

  const activeLoans = data?.activeLoans || [];
  const overdueLoans = data?.overdueLoans || [];
  const pendingReservations = data?.pendingReservations || [];
  const unpaidFines = data?.unpaidFines || [];
  const totalUnpaidFines = data?.totalUnpaidFines || 0;
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Member Header */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Library Card: {user?.membershipId}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Member
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your borrowed books, active waitlist queues, notifications, and library fines.
          </p>
        </div>

        {totalUnpaidFines > 0 ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-rose-300 font-semibold block uppercase tracking-wider">
                Outstanding Overdue Fines
              </span>
              <span className="text-xl font-black text-white font-mono">
                ${totalUnpaidFines.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-300 font-semibold block uppercase tracking-wider">
                Account Standing
              </span>
              <span className="text-sm font-bold text-white">Good Standing (No Fines)</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Active Loans & Overdue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white">
              Currently Borrowed Books ({activeLoans.length + overdueLoans.length})
            </h2>
          </div>
          <button
            onClick={onExploreBooks}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
          >
            + Browse More Books
          </button>
        </div>

        {activeLoans.length === 0 && overdueLoans.length === 0 ? (
          <div className="p-10 rounded-2xl glass-card text-center border border-slate-800">
            <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No books currently checked out</p>
            <p className="text-xs text-slate-500 mt-1">Explore our catalog to borrow your next read.</p>
            <button
              onClick={onExploreBooks}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md"
            >
              Browse Catalogue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...overdueLoans, ...activeLoans].map((loan) => {
              const now = new Date();
              const due = new Date(loan.dueDate);
              const isOverdue = loan.status === 'OVERDUE' || now > due;
              const daysDiff = Math.ceil(Math.abs(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={loan.id}
                  className={`p-4 rounded-2xl glass-card border flex gap-4 transition-all ${
                    isOverdue
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-slate-800 hover:border-brand-500/40'
                  }`}
                >
                  {loan.book.coverUrl && (
                    <img
                      src={loan.book.coverUrl}
                      alt={loan.book.title}
                      className="w-16 h-24 object-cover rounded-xl shadow shrink-0"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {loan.book.category}
                        </span>
                        {isOverdue ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue ({daysDiff} days late)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Due in {daysDiff} days
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                        {loan.book.title}
                      </h4>
                      <p className="text-xs text-slate-400">by {loan.book.author}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Due: {due.toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => returnMutation.mutate(loan.id)}
                        disabled={returnMutation.isPending}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow transition-all flex items-center gap-1"
                      >
                        {returnMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Return Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reservation Queue Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">
            Active Reservation Queues ({pendingReservations.length})
          </h2>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="p-6 rounded-2xl glass-card text-center border border-slate-800 text-xs text-slate-400">
            You have no active book reservations. When a book is out of stock, join its queue to get hold priority upon return!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReservations.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl glass-card border border-amber-500/30 bg-amber-950/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Waitlist Position: #{res.queuePosition}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(res.reservedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{res.book.title}</h4>
                  <p className="text-xs text-slate-400">by {res.book.author}</p>

                  <p className="text-xs text-amber-300/90 mt-2 bg-amber-500/10 p-2 rounded-lg">
                    {res.queuePosition === 1
                      ? '🎯 You are next in line! You will be automatically notified as soon as a copy is returned.'
                      : `⏳ There are ${res.queuePosition - 1} borrowers ahead of you in queue.`}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={() => cancelReservationMutation.mutate(res.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Cancel Reservation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unpaid Fines Section */}
      {unpaidFines.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">Outstanding Fines ({unpaidFines.length})</h2>
          </div>

          <div className="rounded-2xl glass-card p-4 border border-rose-500/30 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-mono tracking-wider text-[11px] border-b border-slate-800 pb-2">
                <tr>
                  <th className="p-2.5">Book Title</th>
                  <th className="p-2.5">Days Late</th>
                  <th className="p-2.5">Fine Amount</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unpaidFines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-semibold text-white">
                      {fine.borrowRecord?.book?.title || 'Book loan'}
                    </td>
                    <td className="p-2.5 text-rose-300 font-semibold">{fine.daysOverdue} days late</td>
                    <td className="p-2.5 font-mono font-bold text-rose-400 text-sm">
                      ${Number(fine.amount).toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onPayFine(fine)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1.5 ml-auto"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay Fine</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Notifications Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Notification History</h2>
        </div>

        <div className="rounded-2xl glass-card p-4 border border-slate-800 divide-y divide-slate-800/80">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 text-center">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-white">{n.title}</h5>
                  <p className="text-slate-400 mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

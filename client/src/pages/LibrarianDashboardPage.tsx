import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLibrarianDashboard,
  fetchAllBorrowRecords,
  fetchAllFines,
  fetchMembersList,
  returnBook,
  waiveFine,
  toggleMemberActive,
  BorrowRecord,
  Fine,
} from '../services/api';
import {
  BookOpen,
  Users,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface LibrarianDashboardProps {
  onOpenAddBook: () => void;
  onPayFine: (fine: Fine) => void;
}

export const LibrarianDashboardPage: React.FC<LibrarianDashboardProps> = ({
  onOpenAddBook,
  onPayFine,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'OVERDUE' | 'LOANS' | 'FINES' | 'MEMBERS'>('OVERVIEW');
  const [loansFilter, setLoansFilter] = useState('ALL');
  const [finesFilter, setFinesFilter] = useState('ALL');
  const [memberSearch, setMemberSearch] = useState('');

  // Waive fine modal state
  const [waiveTarget, setWaiveTarget] = useState<Fine | null>(null);
  const [waiveReason, setWaiveReason] = useState('First-time courtesy waiver');
  const [isWaiving, setIsWaiving] = useState(false);

  // Dashboard Overview Query
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['librarian-dashboard'],
    queryFn: fetchLibrarianDashboard,
  });

  // All Loans Query
  const { data: loansData, isLoading: isLoansLoading } = useQuery({
    queryKey: ['all-loans', loansFilter],
    queryFn: () => fetchAllBorrowRecords({ status: loansFilter === 'ALL' ? undefined : loansFilter }),
    enabled: activeTab === 'LOANS',
  });

  // All Fines Query
  const { data: finesData, isLoading: isFinesLoading } = useQuery({
    queryKey: ['all-fines', finesFilter],
    queryFn: () => fetchAllFines(finesFilter === 'ALL' ? undefined : finesFilter),
    enabled: activeTab === 'FINES',
  });

  // Members Query
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['members-list', memberSearch],
    queryFn: () => fetchMembersList({ search: memberSearch }),
    enabled: activeTab === 'MEMBERS',
  });

  // Return Book Mutation
  const returnMutation = useMutation({
    mutationFn: (borrowRecordId: string) => returnBook(borrowRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarian-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['all-loans'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  // Toggle Member Status Mutation
  const memberToggleMutation = useMutation({
    mutationFn: (userId: string) => toggleMemberActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
    },
  });

  const handleWaiveSubmit = async () => {
    if (!waiveTarget) return;
    setIsWaiving(true);
    try {
      await waiveFine(waiveTarget.id, waiveReason);
      setWaiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['all-fines'] });
      queryClient.invalidateQueries({ queryKey: ['librarian-dashboard'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to waive fine');
    } finally {
      setIsWaiving(false);
    }
  };

  const metrics = dashboardData?.metrics || {
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    activeBorrowsCount: 0,
    overdueCount: 0,
    totalMembers: 0,
    finesCollected: 0,
    finesPending: 0,
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="h-4 w-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Librarian Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time circulation metrics, transactional checkouts, fines collection & member directory.
          </p>
        </div>

        <button
          onClick={onOpenAddBook}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>+ Add Book to Inventory</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Catalogue Titles</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">{metrics.totalBooks}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.availableCopies} available / {metrics.totalCopies} total copies
            </p>
          </div>
        </div>

        {/* Active & Overdue */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Loans</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">{metrics.activeBorrowsCount}</h3>
            <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
              {metrics.overdueCount} books currently overdue
            </p>
          </div>
        </div>

        {/* Fines Collected */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Fines Collected</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">
              ${Number(metrics.finesCollected).toFixed(2)}
            </h3>
            <p className="text-[11px] text-rose-400 font-semibold mt-0.5">
              ${Number(metrics.finesPending).toFixed(2)} pending collection
            </p>
          </div>
        </div>

        {/* Registered Members */}
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Members</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">{metrics.totalMembers}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Approved library cards</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        {[
          { id: 'OVERVIEW', label: '📊 Overview & Leaderboards' },
          { id: 'OVERDUE', label: `⚠️ Overdue Loans (${metrics.overdueCount})` },
          { id: 'LOANS', label: '📖 All Circulation Records' },
          { id: 'FINES', label: '💰 Fines & Waiving Ledger' },
          { id: 'MEMBERS', label: '👥 Member Directory' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Borrowed Books */}
          <div className="rounded-2xl glass-card p-6 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-400" />
                <h3 className="text-base font-bold text-white">Most Borrowed Books</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Ranked by loans</span>
            </div>

            <div className="mt-4 space-y-3">
              {(dashboardData?.mostBorrowedBooks || []).map((b: any, index: number) => (
                <div
                  key={b.bookId}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-brand-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs items-center justify-center font-mono">
                      #{index + 1}
                    </span>
                    {b.coverUrl && (
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-8 h-11 object-cover rounded shadow"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{b.title}</h4>
                      <p className="text-[11px] text-slate-400">{b.author} • {b.category}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-bold shrink-0">
                    {b.borrowCount} loans
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Circulation Transactions */}
          <div className="rounded-2xl glass-card p-6 border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Recent Circulation Activity</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Live feed</span>
            </div>

            <div className="mt-4 space-y-3">
              {(dashboardData?.recentLoans || []).map((r: any) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">{r.book.title}</h4>
                    <p className="text-slate-400 mt-0.5">
                      Borrowed by <span className="text-slate-200">{r.user.name}</span> ({r.user.membershipId})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {new Date(r.borrowDate).toLocaleDateString()}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        r.status === 'BORROWED'
                          ? 'bg-brand-500/20 text-brand-300'
                          : r.status === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERDUE LIST */}
      {activeTab === 'OVERDUE' && (
        <div className="rounded-2xl glass-card p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Overdue Borrow Records</h3>
              <p className="text-xs text-slate-400">
                Books past due date incurring $1.50/day fine. Fines update automatically.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Book Title</th>
                  <th className="p-3">Borrower</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Days Late</th>
                  <th className="p-3">Accrued Fine</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(dashboardData?.overdueRecords || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      🎉 No overdue loans at the moment! All active books are on schedule.
                    </td>
                  </tr>
                ) : (
                  (dashboardData?.overdueRecords || []).map((rec: any) => {
                    const fine = rec.fines?.[0];
                    return (
                      <tr key={rec.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">
                          {rec.book.title}
                          <span className="block text-[11px] font-mono text-slate-500">
                            ISBN: {rec.book.isbn}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-200">{rec.user.name}</span>
                          <span className="block text-[11px] text-slate-400">
                            {rec.user.email} • {rec.user.phone || 'No phone'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {new Date(rec.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                            {fine?.daysOverdue || '1+'} days late
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-400">
                          ${Number(fine?.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => returnMutation.mutate(rec.id)}
                            disabled={returnMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow transition-all"
                          >
                            Process Return
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL LOANS */}
      {activeTab === 'LOANS' && (
        <div className="rounded-2xl glass-card p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Circulation Ledger</h3>
              <p className="text-xs text-slate-400">Complete historical record of book checkouts</p>
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'BORROWED', 'OVERDUE', 'RETURNED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setLoansFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    loansFilter === st
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoansLoading ? (
              <div className="p-8 text-center text-slate-400">Loading circulation records...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Book</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Borrowed</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Returned</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(loansData?.records || []).map((loan: BorrowRecord) => (
                    <tr key={loan.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white">{loan.book.title}</td>
                      <td className="p-3 text-slate-300">
                        {loan.user?.name} ({loan.user?.membershipId})
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(loan.borrowDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'BORROWED'
                              ? 'bg-brand-500/20 text-brand-300'
                              : loan.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {loan.status !== 'RETURNED' && (
                          <button
                            onClick={() => returnMutation.mutate(loan.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FINES */}
      {activeTab === 'FINES' && (
        <div className="rounded-2xl glass-card p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Fine Assessment & Waiving Ledger</h3>
              <p className="text-xs text-slate-400">Inspect fees, clear payments, or waive penalties</p>
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'UNPAID', 'PAID', 'WAIVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFinesFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    finesFilter === f
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {isFinesLoading ? (
              <div className="p-8 text-center text-slate-400">Loading fine ledger...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Member</th>
                    <th className="p-3">Book Loan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Days Overdue</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reference / Reason</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(finesData?.fines || []).map((fine: Fine) => (
                    <tr key={fine.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white">
                        {fine.user?.name}
                        <span className="block text-[11px] font-mono text-slate-400">
                          {fine.user?.membershipId}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {fine.borrowRecord?.book?.title || 'Book loan'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        ${Number(fine.amount).toFixed(2)}
                      </td>
                      <td className="p-3">{fine.daysOverdue} days</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fine.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : fine.status === 'UNPAID'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {fine.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {fine.paymentReference || '—'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {fine.status === 'UNPAID' && (
                          <>
                            <button
                              onClick={() => onPayFine(fine)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                            >
                              Collect Pay
                            </button>
                            <button
                              onClick={() => setWaiveTarget(fine)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold"
                            >
                              Waive
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="rounded-2xl glass-card p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Registered Library Members</h3>
              <p className="text-xs text-slate-400">
                Track active borrows, outstanding fees, and manage privileges
              </p>
            </div>
            <input
              type="text"
              placeholder="Search member name or ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            {isMembersLoading ? (
              <div className="p-8 text-center text-slate-400">Loading members...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Member Name</th>
                    <th className="p-3">Card / ID</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Active Loans</th>
                    <th className="p-3">Unpaid Fines</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(membersData?.members || []).map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white">{m.name}</td>
                      <td className="p-3 font-mono text-brand-300 font-bold">{m.membershipId}</td>
                      <td className="p-3 text-slate-400">{m.email}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-200">
                          {m.activeLoansCount} active
                        </span>
                      </td>
                      <td className="p-3">
                        {m.totalUnpaidFines > 0 ? (
                          <span className="font-mono font-bold text-rose-400">
                            ${Number(m.totalUnpaidFines).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Clear ($0.00)</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {m.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => memberToggleMutation.mutate(m.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            m.isActive
                              ? 'bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {m.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Waive Fine Modal */}
      {waiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white">Waive Overdue Fine</h3>
            <p className="text-xs text-slate-400 mt-1">
              Waive fine of <span className="font-mono text-emerald-400">${Number(waiveTarget.amount).toFixed(2)}</span> for member {waiveTarget.user?.name}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Waive Justification / Reason *
              </label>
              <textarea
                rows={3}
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setWaiveTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleWaiveSubmit}
                disabled={isWaiving}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow"
              >
                {isWaiving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Confirm Fine Waiver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token fallback if present
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('libraryhub_token') : null;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration or unauthorized redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'LIBRARIAN' | 'MEMBER';
  membershipId: string;
  phone?: string;
  isActive?: boolean;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  description?: string;
  coverUrl?: string;
  publishYear?: number;
  publisher?: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  _count?: {
    borrowRecords: number;
    reservations: number;
  };
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  userId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  book: Book;
  user?: User;
  fines?: Fine[];
  accruedFine?: number;
  isOverdue?: boolean;
  daysOverdue?: number;
}

export interface Fine {
  id: string;
  borrowRecordId: string;
  userId: string;
  amount: number | string;
  daysOverdue: number;
  status: 'UNPAID' | 'PAID' | 'WAIVED';
  paidAt?: string | null;
  paymentReference?: string | null;
  createdAt: string;
  borrowRecord?: {
    id: string;
    dueDate: string;
    returnDate?: string;
    book: Book;
  };
  user?: User;
}

export interface Reservation {
  id: string;
  bookId: string;
  userId: string;
  reservedAt: string;
  status: 'PENDING' | 'NOTIFIED' | 'FULFILLED' | 'CANCELLED';
  queuePosition: number;
  expiresAt?: string | null;
  book: Book;
  user?: User;
}

export interface DashboardMetrics {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  activeBorrowsCount: number;
  overdueCount: number;
  totalMembers: number;
  finesCollected: number;
  finesPending: number;
}

export interface MostBorrowedBook {
  bookId: string;
  borrowCount: number;
  title: string;
  author: string;
  category: string;
  coverUrl?: string;
}

export interface MemberDashboardData {
  activeLoans: BorrowRecord[];
  overdueLoans: BorrowRecord[];
  pendingReservations: Reservation[];
  unpaidFines: Fine[];
  totalUnpaidFines: number;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

// API methods
export const fetchBooks = async (params: {
  search?: string;
  category?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const { data } = await api.get('/books', { params });
  return data.data;
};

export const fetchBookCategories = async () => {
  const { data } = await api.get('/books/categories');
  return data.data;
};

export const fetchBookById = async (id: string) => {
  const { data } = await api.get(`/books/${id}`);
  return data.data;
};

export const createBook = async (bookData: any) => {
  const { data } = await api.post('/books', bookData);
  return data.data;
};

export const updateBook = async (id: string, bookData: any) => {
  const { data } = await api.put(`/books/${id}`, bookData);
  return data.data;
};

export const deleteBook = async (id: string) => {
  const { data } = await api.delete(`/books/${id}`);
  return data;
};

export const lookupIsbn = async (isbn: string) => {
  const { data } = await api.get(`/books/isbn/${isbn}`);
  return data.data;
};

export const borrowBook = async (payload: { bookId: string; days?: number; userId?: string }) => {
  const { data } = await api.post('/borrow/borrow', payload);
  return data;
};

export const returnBook = async (borrowRecordId: string) => {
  const { data } = await api.post('/borrow/return', { borrowRecordId });
  return data;
};

export const fetchMyBorrowHistory = async () => {
  const { data } = await api.get('/borrow/history');
  return data.data;
};

export const fetchAllBorrowRecords = async (params?: { status?: string; page?: number; limit?: number }) => {
  const { data } = await api.get('/borrow/all', { params });
  return data.data;
};

export const fetchOverdueList = async () => {
  const { data } = await api.get('/borrow/overdue');
  return data.data;
};

export const reserveBook = async (bookId: string) => {
  const { data } = await api.post('/reservations/reserve', { bookId });
  return data;
};

export const cancelReservation = async (reservationId: string) => {
  const { data } = await api.post('/reservations/cancel', { reservationId });
  return data;
};

export const fetchMyReservations = async () => {
  const { data } = await api.get('/reservations/my');
  return data.data;
};

export const fetchMyFines = async () => {
  const { data } = await api.get('/fines/my');
  return data.data;
};

export const fetchAllFines = async (status?: string) => {
  const { data } = await api.get('/fines/all', { params: { status } });
  return data.data;
};

export const payFine = async (fineId: string, paymentMethod = 'ONLINE_MOCK') => {
  const { data } = await api.post('/fines/pay', { fineId, paymentMethod });
  return data;
};

export const waiveFine = async (fineId: string, reason: string) => {
  const { data } = await api.post('/fines/waive', { fineId, reason });
  return data;
};

export const fetchLibrarianDashboard = async () => {
  const { data } = await api.get('/dashboard/librarian');
  return data.data;
};

export const fetchMemberDashboard = async (): Promise<MemberDashboardData> => {
  const { data } = await api.get('/dashboard/member');
  return data.data;
};

export const fetchMembersList = async (params?: { search?: string; page?: number; limit?: number }) => {
  const { data } = await api.get('/users/members', { params });
  return data.data;
};

export const toggleMemberActive = async (id: string) => {
  const { data } = await api.patch(`/users/members/${id}/toggle`);
  return data;
};

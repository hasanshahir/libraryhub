# 📚 LibraryHub — Full-Stack Library Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 Executive Overview

**LibraryHub** is an enterprise-grade library management platform built from the ground up for modern educational institutions, universities, and public libraries. It completely eliminates manual registers and lost books by digitizing catalog search, transactional borrowing, waitlist reservations, automated fine calculations, and circulation reporting.

- **GitHub Repository**: [https://github.com/hasanshahir/libraryhub](https://github.com/hasanshahir/libraryhub)
- **Live Demo Deployment**: [https://libraryhub-blond.vercel.app](https://libraryhub-blond.vercel.app)
- **Interactive Swagger API Docs**: Available at [https://libraryhub-blond.vercel.app/api/docs](https://libraryhub-blond.vercel.app/api/docs)

---

## 🔑 Demo Access Credentials

The application features a **1-Click Demo Quick-Switcher** directly in the top header. You can also sign in with the following verified credentials:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Librarian (Admin)** | `librarian@libraryhub.com` | `Librarian@123` | Full inventory control, Open Library ISBN autofill, overdue ledger, fine waiver & collection, member directory |
| **Member (Borrower)** | `member@libraryhub.com` | `Member@123` | Search catalogue, borrow books, enter reservation queue when copies = 0, track return deadlines, simulate fine payment |

---

## 🚀 Key Features & Acceptance Criteria

### 1. Robust Role-Based Access Control (RBAC)
- **Strict 403 Forbidden Middleware**: Members attempting to access librarian endpoints (`/api/dashboard/librarian`, `/api/users/members`, book creation, etc.) immediately receive HTTP 403 Forbidden responses.
- **Dual Authentication**: Secure `httpOnly` JWT cookies paired with Bearer token authentication headers for maximum client compatibility.

### 2. ACID-Compliant Transactional Borrowing (`prisma.$transaction`)
- **Strict Invariant**: Available copies are guarded atomically inside database transactions. Book copies can **never drop below zero**.
- **Delinquency Block**: Members with more than **$25.00** in outstanding unpaid library fines are prevented from borrowing until fines are cleared.
- **Duplicate Loan Guard**: Members cannot borrow duplicate copies of the same book simultaneously.

### 3. Automated Return & Fine Calculation Engine
- **Daily Overdue Calculation**: Returns past the due date trigger automatic overdue fines calculated at **$1.50 per day**.
- **Fine Settlement & Waiving**: Members can settle fines via simulated payment methods; Librarians have authority to formally waive penalties with logged audit justifications.

### 4. Zero-Stock Reservation Waitlist Queue
- When all copies of a popular book are borrowed (`availableCopies === 0`), members can **Join the Reservation Queue**.
- The system assigns sequential queue positions (`#1 in line`, `#2 in line`).
- As soon as a borrowed copy is returned, the system automatically marks the reservation as `NOTIFIED`, places a 48-hour hold, and sends an alert.

### 5. Open Library API ISBN Lookup (Bonus Feature)
- Librarians can input any 10 or 13-digit ISBN barcode and click **"Autofill via ISBN"**.
- Queries Open Library's public API to automatically populate Title, Author, Category, Publisher, Year, Description, and High-Resolution Cover Art.

### 6. Interactive Swagger / OpenAPI Documentation
- Fully interactive Swagger UI served at `/api/docs` with schema models and live request testing.

---

## 🗄️ Database Architecture & Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ BorrowRecord : "borrows"
    User ||--o{ Reservation : "reserves"
    User ||--o{ Fine : "incurs"
    User ||--o{ Notification : "receives"
    Book ||--o{ BorrowRecord : "loaned in"
    Book ||--o{ Reservation : "queued in"
    BorrowRecord ||--o{ Fine : "generates"

    User {
        String id PK
        String email UK
        String password
        String name
        Role role "LIBRARIAN | MEMBER"
        String membershipId UK
        String phone
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Book {
        String id PK
        String isbn UK
        String title
        String author
        String category
        String description
        String coverUrl
        Int publishYear
        String publisher
        Int totalCopies
        Int availableCopies
        DateTime createdAt
        DateTime updatedAt
    }

    BorrowRecord {
        String id PK
        String bookId FK
        String userId FK
        DateTime borrowDate
        DateTime dueDate
        DateTime returnDate
        BorrowStatus status "BORROWED | RETURNED | OVERDUE"
        DateTime createdAt
    }

    Reservation {
        String id PK
        String bookId FK
        String userId FK
        Int queuePosition
        ReservationStatus status "PENDING | NOTIFIED | FULFILLED | CANCELLED"
        DateTime reservedAt
        DateTime expiresAt
    }

    Fine {
        String id PK
        String borrowRecordId FK
        String userId FK
        Decimal amount
        Int daysOverdue
        FineStatus status "UNPAID | PAID | WAIVED"
        DateTime paidAt
        String paymentReference
    }

    Notification {
        String id PK
        String userId FK
        String title
        String message
        String type
        Boolean isRead
        DateTime createdAt
    }
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Language** | TypeScript (v5.7+) | End-to-end type safety on both backend and frontend |
| **Backend Framework** | Node.js + Express (v4.21+) | RESTful API server with custom middleware architecture |
| **Database** | PostgreSQL | Hosted high-performance serverless cloud Postgres (Neon) |
| **ORM** | Prisma ORM (v5.22+) | Schema modeling, declarative migrations, and transactional client |
| **Validation** | Zod (v3.24+) | Shared validation schemas executed across client and server |
| **Frontend Framework** | React 18 + Vite | Modern reactive single-page client with instant HMR |
| **Data Fetching** | TanStack Query v5 | Server-state management, automated cache invalidation, optimistic updates |
| **Styling** | Tailwind CSS v3 | Curated dark-slate color palette, glassmorphism, responsive grid |
| **Icons & Design** | Lucide React | High-contrast visual iconography |
| **API Docs** | Swagger UI Express | OpenAPI 3.0 interactive specification |

---

## 💻 Local Setup & Development Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node.js `v24`)
- npm `v9+` or `v10+`
- PostgreSQL database instance (or free serverless Neon PostgreSQL connection)

### 1. Clone Repository
```bash
git clone https://github.com/hasanshahir/libraryhub.git
cd libraryhub
```

### 2. Configure Environment Variables
Inside `server/`, create `.env` (or copy `.env.example`):
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
PORT=5000
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
DAILY_FINE_RATE=1.50
```

### 3. Install Dependencies & Setup Database
```bash
# Setup backend
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed

# Setup frontend
cd ../client
npm install
```

### 4. Run Locally
Run backend and frontend servers:
```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Client
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 Key REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register member or librarian account with unique membership ID
- `POST /api/auth/login` — Sign in and issue `httpOnly` cookie and JWT token
- `POST /api/auth/logout` — Clear session cookie
- `GET  /api/auth/me` — Retrieve active authenticated user profile and live loan counts

### Books Catalogue
- `GET    /api/books` — Search books with query, category, availability filter, pagination & sorting
- `GET    /api/books/:id` — Book details with reservation queue status
- `GET    /api/books/categories` — Distinct book categories and inventory counts
- `GET    /api/books/isbn/:isbn` — Open Library API book lookup and autofill
- `POST   /api/books` — Add new book *(Librarian only)*
- `PUT    /api/books/:id` — Update book inventory & metadata *(Librarian only)*
- `DELETE /api/books/:id` — Delete book if zero active loans exist *(Librarian only)*

### Transactional Borrowing & Fines
- `POST /api/borrow/borrow` — Atomic book checkout with copy count validation
- `POST /api/borrow/return` — Return book, calculate overdue fine, and alert waitlist queue
- `GET  /api/borrow/history` — Current member's borrowing history
- `GET  /api/borrow/overdue` — Overdue loans list
- `GET  /api/borrow/all` — Circulation ledger *(Librarian only)*
- `POST /api/reservations/reserve` — Join waitlist queue when book is out of stock
- `POST /api/reservations/cancel` — Leave waitlist queue and readjust queue positions
- `GET  /api/fines/my` — Current member's fines
- `POST /api/fines/pay` — Settle unpaid fine via simulated payment
- `POST /api/fines/waive` — Waive fine with justification *(Librarian only)*

### Dashboard & Analytics
- `GET /api/dashboard/librarian` — Metrics, most borrowed books, overdue list, total fines collected *(Librarian only)*
- `GET /api/dashboard/member` — Member summary of loans, deadlines, and reservations

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
Developed for Week 2 Full-Stack Development Assignment by **Hasan Shahir**.

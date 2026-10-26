export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'LibraryHub API Documentation',
    version: '1.0.0',
    description: 'Complete RESTful API for LibraryHub Library Management System built with TypeScript, Express, PostgreSQL & Prisma ORM.',
    contact: {
      name: 'LibraryHub Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Base Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['LIBRARIAN', 'MEMBER'] },
          membershipId: { type: 'string' },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          isbn: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          coverUrl: { type: 'string' },
          publishYear: { type: 'integer' },
          publisher: { type: 'string' },
          totalCopies: { type: 'integer' },
          availableCopies: { type: 'integer' },
        },
      },
      BorrowRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          bookId: { type: 'string' },
          userId: { type: 'string' },
          borrowDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          returnDate: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['BORROWED', 'RETURNED', 'OVERDUE'] },
        },
      },
      Fine: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          borrowRecordId: { type: 'string' },
          userId: { type: 'string' },
          amount: { type: 'number' },
          daysOverdue: { type: 'integer' },
          status: { type: 'string', enum: ['UNPAID', 'PAID', 'WAIVED'] },
        },
      },
      Reservation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          bookId: { type: 'string' },
          userId: { type: 'string' },
          queuePosition: { type: 'integer' },
          status: { type: 'string', enum: ['PENDING', 'NOTIFIED', 'FULFILLED', 'CANCELLED'] },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { cookieAuth: [] },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new member or librarian account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Hasan Shahir' },
                  email: { type: 'string', example: 'hasan@example.com' },
                  password: { type: 'string', example: 'Password@123' },
                  role: { type: 'string', enum: ['MEMBER', 'LIBRARIAN'], default: 'MEMBER' },
                  phone: { type: 'string', example: '+1-555-0199' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registered successfully' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive JWT cookie & token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'librarian@libraryhub.com' },
                  password: { type: 'string', example: 'Librarian@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logged in successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile and session data',
        responses: {
          200: { description: 'Current profile returned' },
          401: { description: 'Unauthenticated' },
        },
      },
    },
    '/books': {
      get: {
        tags: ['Books'],
        summary: 'Search and filter books in catalogue with pagination',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'availableOnly', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: { 200: { description: 'Books catalogue list' } },
      },
      post: {
        tags: ['Books'],
        summary: 'Add a new book (Librarian only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'author', 'isbn', 'category', 'totalCopies'],
                properties: {
                  title: { type: 'string', example: 'Designing Data-Intensive Applications' },
                  author: { type: 'string', example: 'Martin Kleppmann' },
                  isbn: { type: 'string', example: '9781449373320' },
                  category: { type: 'string', example: 'Computer Science' },
                  totalCopies: { type: 'integer', example: 3 },
                  coverUrl: { type: 'string' },
                  publishYear: { type: 'integer', example: 2017 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Book created' },
          403: { description: 'Forbidden (Librarian only)' },
        },
      },
    },
    '/books/isbn/{isbn}': {
      get: {
        tags: ['Books'],
        summary: 'Lookup book details via Open Library API (Bonus feature)',
        parameters: [
          { name: 'isbn', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Book metadata autofill' } },
      },
    },
    '/borrow/borrow': {
      post: {
        tags: ['Borrow'],
        summary: 'Borrow a book with transactional copy checks',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId'],
                properties: {
                  bookId: { type: 'string' },
                  days: { type: 'integer', default: 14 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Book borrowed successfully' },
          400: { description: 'No copies available or outstanding fine lock' },
        },
      },
    },
    '/borrow/return': {
      post: {
        tags: ['Borrow'],
        summary: 'Return a borrowed book, calculate fines, and notify waitlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['borrowRecordId'],
                properties: {
                  borrowRecordId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Book returned' } },
      },
    },
    '/reservations/reserve': {
      post: {
        tags: ['Reservations'],
        summary: 'Reserve an out-of-stock book to enter queue',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId'],
                properties: { bookId: { type: 'string' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Joined reservation queue' } },
      },
    },
    '/fines/pay': {
      post: {
        tags: ['Fines'],
        summary: 'Pay an unpaid fine with payment verification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fineId'],
                properties: {
                  fineId: { type: 'string' },
                  paymentMethod: { type: 'string', example: 'ONLINE_MOCK' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Fine settled' } },
      },
    },
    '/dashboard/librarian': {
      get: {
        tags: ['Dashboard'],
        summary: 'Librarian dashboard metrics: most borrowed, overdue, fines collected',
        responses: {
          200: { description: 'Metrics summary' },
          403: { description: 'Forbidden (Librarian only)' },
        },
      },
    },
  },
};

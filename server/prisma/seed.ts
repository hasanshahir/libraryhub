import { PrismaClient, Role, BorrowStatus, ReservationStatus, FineStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LibraryHub database seeding...');

  // Clean existing data in reverse order of relationships
  await prisma.notification.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.borrowRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  const hashedPasswordLibrarian = await bcrypt.hash('Librarian@123', 10);
  const hashedPasswordMember = await bcrypt.hash('Member@123', 10);

  // 1. Create Users
  const librarian = await prisma.user.create({
    data: {
      email: 'librarian@libraryhub.com',
      password: hashedPasswordLibrarian,
      name: 'Eleanor Vance (Head Librarian)',
      role: Role.LIBRARIAN,
      membershipId: 'LIB-2026-001',
      phone: '+1-555-0100',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'member@libraryhub.com',
      password: hashedPasswordMember,
      name: 'Hasan Shahir (Demo Member)',
      role: Role.MEMBER,
      membershipId: 'MEM-2026-001',
      phone: '+1-555-0101',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'sarah.connor@example.com',
      password: hashedPasswordMember,
      name: 'Sarah Connor',
      role: Role.MEMBER,
      membershipId: 'MEM-2026-002',
      phone: '+1-555-0102',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'alex.rivera@example.com',
      password: hashedPasswordMember,
      name: 'Alex Rivera',
      role: Role.MEMBER,
      membershipId: 'MEM-2026-003',
      phone: '+1-555-0103',
    },
  });

  console.log('✅ Created Demo Users (1 Librarian, 3 Members).');

  // 2. Realistic Book Catalogue
  const booksData = [
    {
      isbn: '9780132350884',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      category: 'Computer Science',
      description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
      coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80',
      publishYear: 2008,
      publisher: 'Prentice Hall',
      totalCopies: 4,
      availableCopies: 2,
    },
    {
      isbn: '9780201633610',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      category: 'Computer Science',
      description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      publishYear: 1994,
      publisher: 'Addison-Wesley Professional',
      totalCopies: 3,
      availableCopies: 1,
    },
    {
      isbn: '9780321125217',
      title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
      author: 'Eric Evans',
      category: 'Computer Science',
      description: 'This is not a book about specific technologies. It offers readers a systematic approach to domain-driven design, presenting an extensive set of modeling principles and practices.',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      publishYear: 2003,
      publisher: 'Addison-Wesley',
      totalCopies: 2,
      availableCopies: 0, // Out of stock to demonstrate reservation queue!
    },
    {
      isbn: '9781449331818',
      title: 'Learning JavaScript Design Patterns',
      author: 'Addy Osmani',
      category: 'Computer Science',
      description: 'With Learning JavaScript Design Patterns, you’ll explore written architectural patterns and practical object-oriented design patterns applied specifically to JavaScript.',
      coverUrl: 'https://images.unsplash.com/photo-1507842229452-94f7d43efca5?w=600&auto=format&fit=crop&q=80',
      publishYear: 2012,
      publisher: "O'Reilly Media",
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      isbn: '9780062316097',
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      category: 'History',
      description: 'From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution—a #1 international bestseller that explores the ways in which biology and history have defined us.',
      coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      publishYear: 2014,
      publisher: 'Harper',
      totalCopies: 3,
      availableCopies: 2,
    },
    {
      isbn: '9780743273565',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      description: 'The Great Gatsby, F. Scott Fitzgerald’s third book, stands as the supreme achievement of his career. First published in 1925, this quintessential novel of the Jazz Age has been acclaimed by generations of readers.',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
      publishYear: 1925,
      publisher: "Charles Scribner's Sons",
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      isbn: '9780451524935',
      title: '1984',
      author: 'George Orwell',
      category: 'Fiction',
      description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real.',
      coverUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80',
      publishYear: 1949,
      publisher: 'Secker & Warburg',
      totalCopies: 6,
      availableCopies: 3,
    },
    {
      isbn: '9780307887894',
      title: 'The Lean Startup',
      author: 'Eric Ries',
      category: 'Business',
      description: 'Most startups fail. But many of those failures are preventable. The Lean Startup is a new approach being adopted across the globe, changing the way companies are built and new products are launched.',
      coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80',
      publishYear: 2011,
      publisher: 'Crown Business',
      totalCopies: 3,
      availableCopies: 2,
    },
    {
      isbn: '9780143127741',
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      category: 'Psychology',
      description: 'The international bestseller by Daniel Kahneman, winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.',
      coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
      publishYear: 2011,
      publisher: 'Farrar, Straus and Giroux',
      totalCopies: 2,
      availableCopies: 1,
    },
    {
      isbn: '9780679783268',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      category: 'Fiction',
      description: 'A romantic masterpiece of manners and matrimony in 19th-century England, following the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.',
      coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80',
      publishYear: 1813,
      publisher: 'T. Egerton',
      totalCopies: 3,
      availableCopies: 3,
    },
  ];

  const createdBooks = [];
  for (const b of booksData) {
    const book = await prisma.book.create({ data: b });
    createdBooks.push(book);
  }
  console.log(`✅ Created ${createdBooks.length} realistic Books.`);

  const cleanCode = createdBooks[0];
  const designPatterns = createdBooks[1];
  const ddd = createdBooks[2];
  const sapiens = createdBooks[4];
  const book1984 = createdBooks[6];

  // 3. Create Borrow Records (Active, Overdue with Fines, Returned)
  const now = new Date();

  // Active borrow by member1 (due in 5 days)
  const activeDueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const borrow1 = await prisma.borrowRecord.create({
    data: {
      bookId: cleanCode.id,
      userId: member1.id,
      borrowDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      dueDate: activeDueDate,
      status: BorrowStatus.BORROWED,
    },
  });

  // Overdue borrow by member1 (due 4 days ago -> generates unpaid fine!)
  const overdueDueDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const borrow2 = await prisma.borrowRecord.create({
    data: {
      bookId: designPatterns.id,
      userId: member1.id,
      borrowDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      dueDate: overdueDueDate,
      status: BorrowStatus.OVERDUE,
    },
  });

  // Calculate unpaid fine for member1: 4 days * $1.50 = $6.00
  const fine1 = await prisma.fine.create({
    data: {
      borrowRecordId: borrow2.id,
      userId: member1.id,
      amount: 6.00,
      daysOverdue: 4,
      status: FineStatus.UNPAID,
    },
  });

  // Active borrow by member2 for DDD (making it 0 copies available)
  const borrow3 = await prisma.borrowRecord.create({
    data: {
      bookId: ddd.id,
      userId: member2.id,
      borrowDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      status: BorrowStatus.BORROWED,
    },
  });

  const borrow4 = await prisma.borrowRecord.create({
    data: {
      bookId: ddd.id,
      userId: member3.id,
      borrowDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      status: BorrowStatus.BORROWED,
    },
  });

  // Returned record with paid fine for member3
  const returnedDueDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const returnedDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 3 days late
  const borrow5 = await prisma.borrowRecord.create({
    data: {
      bookId: book1984.id,
      userId: member3.id,
      borrowDate: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000),
      dueDate: returnedDueDate,
      returnDate: returnedDate,
      status: BorrowStatus.RETURNED,
    },
  });

  await prisma.fine.create({
    data: {
      borrowRecordId: borrow5.id,
      userId: member3.id,
      amount: 4.50,
      daysOverdue: 3,
      status: FineStatus.PAID,
      paidAt: returnedDate,
      paymentReference: 'PAY-MOCK-98231',
    },
  });

  console.log('✅ Created Borrow Records and Fine history.');

  // 4. Reservation Queue (Since DDD has 0 copies, member1 is in the reservation queue!)
  await prisma.reservation.create({
    data: {
      bookId: ddd.id,
      userId: member1.id,
      queuePosition: 1,
      status: ReservationStatus.PENDING,
    },
  });

  console.log('✅ Created Reservation Queue for out-of-stock books.');

  // 5. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: member1.id,
        title: 'Overdue Notice',
        message: 'Your borrowed book "Design Patterns" was due on ' + overdueDueDate.toLocaleDateString() + '. An overdue fine of $6.00 has accrued.',
        type: 'OVERDUE_ALERT',
        isRead: false,
      },
      {
        userId: member1.id,
        title: 'Upcoming Due Date',
        message: 'Your borrowed book "Clean Code" is due in 5 days on ' + activeDueDate.toLocaleDateString() + '.',
        type: 'DUE_REMINDER',
        isRead: true,
      },
    ],
  });

  console.log('✅ Created Notifications.');
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

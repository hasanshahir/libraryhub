import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_V9kMs8BHaDtU@ep-red-base-b5e8dtw2.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

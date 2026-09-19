import { PrismaConfig } from 'prisma';

export default {
  datasource: {
    url: process.env.DATABASE_URL
  }
} satisfies PrismaConfig;
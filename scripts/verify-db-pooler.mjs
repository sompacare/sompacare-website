#!/usr/bin/env node
/** Verify Prisma can query via DATABASE_URL (e.g. Supabase pooler). */
import { PrismaClient } from "@prisma/client";

const direct = process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL;
if (!process.env.DATABASE_URL?.trim()) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("DATABASE_URL pooler/direct query OK");
} catch (e) {
  console.error("Query failed:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

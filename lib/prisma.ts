import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { assertDatabaseConfigured, DatabaseConfigurationError } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function unavailablePrisma(error: DatabaseConfigurationError): PrismaClient {
  const reject = () => {
    throw error;
  };
  const unavailable = new Proxy(reject, {
    get: () => unavailable,
    apply: reject
  });
  return unavailable as unknown as PrismaClient;
}

function createPrismaClient() {
  try {
    const connectionString = assertDatabaseConfigured();
    const pgPool =
      globalForPrisma.pgPool ??
      new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: {
          rejectUnauthorized: false
        }
      });

    const adapter = new PrismaPg(pgPool);
    if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pgPool;
    return new PrismaClient({ adapter });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) return unavailablePrisma(error);
    throw error;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

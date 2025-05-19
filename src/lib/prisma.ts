import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const extendedPrisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
}).$extends(withAccelerate());

export const prisma = globalForPrisma.prisma ?? (extendedPrisma as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

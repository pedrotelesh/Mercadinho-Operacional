import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminName = "admin.plus";
  const adminPass = "senha@admin";
  const hash = await bcrypt.hash(adminPass, 10);
  const admin = await prisma.user.upsert({
    where: { name: adminName },
    update: {},
    create: {
      name: adminName,
      password: hash,
      isAdmin: true,
      balance: 0,
    },
  });
  console.log("Usuário admin pronto:", admin.name);
}

main().finally(() => prisma.$disconnect());

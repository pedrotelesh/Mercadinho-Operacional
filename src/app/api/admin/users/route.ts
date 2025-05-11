import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: lista todos os usuários (apenas para admin)
export async function GET(req: NextRequest) {
  // Verifica se o usuário é admin
  const isAdmin = req.headers.get("x-admin") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, balance: true, isAdmin: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

// PATCH: adiciona ou remove saldo de um usuário (apenas para admin, amount pode ser negativo para remover)
export async function PATCH(req: NextRequest) {
  // Verifica se o usuário é admin
  const isAdmin = req.headers.get("x-admin") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { userId, amount } = await req.json();
  if (typeof userId !== "number" || typeof amount !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: amount } },
  });
  return NextResponse.json(user);
}

// POST: cria um novo usuário (apenas para admin)
export async function POST(req: NextRequest) {
  const isAdmin = req.headers.get("x-admin") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { name, password, balance, isAdmin: newIsAdmin } = await req.json();
    if (!name || !password) {
      return NextResponse.json(
        { error: "Nome e senha são obrigatórios" },
        { status: 400 }
      );
    }
    // Verifica se já existe usuário com esse nome
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Nome de usuário já existe" },
        { status: 400 }
      );
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        password: hash,
        balance: typeof balance === "number" ? balance : 0,
        isAdmin: !!newIsAdmin,
      },
      select: { id: true, name: true, balance: true, isAdmin: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

// DELETE: remove um usuário (apenas para admin)
export async function DELETE(req: NextRequest) {
  const isAdmin = req.headers.get("x-admin") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { userId } = await req.json();
    if (typeof userId !== "number") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover usuário" }, { status: 500 });
  }
}

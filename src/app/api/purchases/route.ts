import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: lista todas as compras (admin)
export async function GET() {
  const purchases = await prisma.purchase.findMany({
    include: { user: true, product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(purchases);
}

// POST: cria uma nova compra (usuário)
export async function POST(req: NextRequest) {
  const { userId, productId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!user || !product) {
    return NextResponse.json({ error: "Usuário ou produto não encontrado" }, { status: 400 });
  }
  if (product.estoque <= 0) {
    return NextResponse.json({ error: "Produto sem estoque" }, { status: 400 });
  }
  if (user.balance < product.price) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }
  // Atualiza saldo do usuário
  await prisma.user.update({
    where: { id: userId },
    data: { balance: { decrement: product.price } },
  });
  // Decrementa estoque do produto
  await prisma.product.update({
    where: { id: productId },
    data: { estoque: { decrement: 1 } },
  });
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      productId,
      status: "completed",
      seenByAdmin: false,
    },
  });
  return NextResponse.json(purchase);
}

// DELETE: remove uma compra e reembolsa o usuário (admin)
export async function DELETE(req: NextRequest) {
  const isAdmin = req.headers.get("x-admin") === "true";
  if (!isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { purchaseId } = await req.json();
    if (typeof purchaseId !== "number") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    // Busca a compra
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true, product: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }
    // Reembolsa o usuário
    await prisma.user.update({
      where: { id: purchase.userId },
      data: { balance: { increment: purchase.product.price } },
    });
    // Remove a compra
    await prisma.purchase.delete({ where: { id: purchaseId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover compra" }, { status: 500 });
  }
}

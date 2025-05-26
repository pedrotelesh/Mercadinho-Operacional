import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: lista todos os produtos
export async function GET() {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

// POST: cria um novo produto (admin)
export async function POST(req: NextRequest) {
  const { name, description, price, imageUrl, estoque, tipo } = await req.json();
  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      imageUrl,
      estoque: typeof estoque === 'number' && estoque >= 0 ? estoque : 0,
      tipo: typeof tipo === 'string' ? tipo : '',
    },
  });
  return NextResponse.json(product);
}

// PATCH: adiciona ou remove estoque de um produto
export async function PATCH(req: NextRequest) {
  const { id, amount } = await req.json();
  if (typeof id !== "number" || typeof amount !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  // Busca produto
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  const novoEstoque = product.estoque + amount;
  if (novoEstoque < 0) return NextResponse.json({ error: "Estoque não pode ser negativo" }, { status: 400 });
  const updated = await prisma.product.update({ where: { id }, data: { estoque: novoEstoque } });
  return NextResponse.json(updated);
}

// DELETE: remove um produto pelo id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (typeof id !== "number") {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  // Remove todas as compras relacionadas antes de deletar o produto
  await prisma.purchase.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

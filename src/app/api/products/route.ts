import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: lista todos os produtos
export async function GET() {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

// POST: cria um novo produto (admin)
export async function POST(req: NextRequest) {
  const { name, description, price, imageUrl } = await req.json();
  const product = await prisma.product.create({
    data: { name, description, price, imageUrl },
  });
  return NextResponse.json(product);
}

// DELETE: remove um produto pelo id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (typeof id !== "number") {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

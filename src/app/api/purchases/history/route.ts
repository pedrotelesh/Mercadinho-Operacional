import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: histórico de compras do usuário
export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get("userId"));
  if (!userId) {
    return NextResponse.json({ error: "ID do usuário não informado" }, { status: 400 });
  }
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(purchases);
}

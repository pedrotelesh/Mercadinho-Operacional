import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: marca uma compra como vista/não vista pelo admin
export async function PATCH(req: NextRequest) {
  const { purchaseId, seen } = await req.json();
  if (typeof purchaseId !== "number" || typeof seen !== "boolean") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { seenByAdmin: seen },
  });
  return NextResponse.json({ success: true });
}

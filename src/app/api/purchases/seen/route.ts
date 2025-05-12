import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: marca uma compra como vista/não vista pelo admin
export async function PATCH(req: NextRequest) {
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido ou ausente" }, { status: 400 });
  }
  const { purchaseId, seen } = data;
  if (typeof purchaseId !== "number" || typeof seen !== "boolean") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { seenByAdmin: seen },
  });
  return NextResponse.json({ success: true });
}

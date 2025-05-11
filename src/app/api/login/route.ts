import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { name: username } });
  if (!user) {
    return NextResponse.json({ error: "" }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    name: user.name,
    isAdmin: user.isAdmin,
    balance: user.balance,
  });
}

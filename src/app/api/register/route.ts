// Esta rota não será mais usada, retorna erro sempre
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Cadastro de usuários só pode ser feito pelo administrador." }, { status: 403 });
}

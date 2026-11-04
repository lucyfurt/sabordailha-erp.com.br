import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "GERENTE"].includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const mov = await prisma.caixaMovimento.findUnique({ where: { id: params.id } });
  if (!mov) return NextResponse.json({ error: "Movimento não encontrado" }, { status: 404 });

  await prisma.caixaMovimento.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

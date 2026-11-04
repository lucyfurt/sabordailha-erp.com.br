import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const catSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  icone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    include: { _count: { select: { produtos: true } } },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = catSchema.parse(body);

    const cat = await prisma.categoria.create({ data });
    return NextResponse.json(cat, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro" }, { status: 500 });
  }
}

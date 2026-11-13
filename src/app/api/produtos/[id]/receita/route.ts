import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const receitaItemSchema = z.object({
  materialId: z.string(),
  quantidade: z.number().positive(),
});

// GET /api/produtos/[id]/receita — lista receita do produto
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const itens = await prisma.receitaItem.findMany({
    where: { produtoId: params.id },
    include: { material: { select: { id: true, nome: true, unidade: true, custoUnitario: true } } },
  });

  return NextResponse.json(itens);
}

// POST /api/produtos/[id]/receita — salva receita completa (substitui)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const itens = z.array(receitaItemSchema).parse(body);

    // Substitui receita atual em transação
    await prisma.$transaction([
      prisma.receitaItem.deleteMany({ where: { produtoId: params.id } }),
      ...itens.map((item) =>
        prisma.receitaItem.create({
          data: { produtoId: params.id, materialId: item.materialId, quantidade: item.quantidade },
        })
      ),
    ]);

    const saved = await prisma.receitaItem.findMany({
      where: { produtoId: params.id },
      include: { material: { select: { id: true, nome: true, unidade: true, custoUnitario: true } } },
    });

    return NextResponse.json(saved);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao salvar receita" }, { status: 500 });
  }
}

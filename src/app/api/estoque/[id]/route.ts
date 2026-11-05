import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  unidade: z.string().optional(),
  quantidadeMin: z.number().min(0).optional(),
  custoUnitario: z.number().optional(),
  fornecedorId: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      fornecedor: { select: { nome: true } },
      movimentacoes: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
  return NextResponse.json(material);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const material = await prisma.material.update({
      where: { id: params.id },
      data,
      include: { fornecedor: { select: { nome: true } } },
    });
    return NextResponse.json(material);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    // Soft delete — apenas desativa o material
    await prisma.material.update({
      where: { id: params.id },
      data: { ativo: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao remover" }, { status: 500 });
  }
}

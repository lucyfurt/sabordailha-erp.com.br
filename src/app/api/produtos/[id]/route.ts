import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  categoriaId: z.string().optional(),
  ativo: z.boolean().optional(),
  custoEstimado: z.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const produto = await prisma.produto.update({
      where: { id: params.id },
      data,
      include: { categoria: true },
    });
    return NextResponse.json(produto);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await prisma.produto.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao remover produto" }, { status: 500 });
  }
}

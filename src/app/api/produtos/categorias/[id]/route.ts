import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const cat = await prisma.categoria.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { produtos: true } } },
    });
    return NextResponse.json(cat);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verifica se há produtos ativos vinculados
  const count = await prisma.produto.count({
    where: { categoriaId: params.id, ativo: true },
  });

  if (count > 0) {
    return NextResponse.json(
      { error: `Não é possível remover: há ${count} produto(s) ativo(s) nesta categoria.` },
      { status: 400 }
    );
  }

  // Soft delete
  await prisma.categoria.update({
    where: { id: params.id },
    data: { ativo: false },
  });

  return NextResponse.json({ success: true });
}

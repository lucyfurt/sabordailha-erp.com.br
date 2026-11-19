import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota pública — retorna apenas os dados que o cliente pode ver na tela de confirmação.
// Sem autenticação, mas sem expor dados internos (sem userId, custo, etc.).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      numero: true,
      status: true,
      tipoPedido: true,
      horarioEntrega: true,
      taxaEntrega: true,
      total: true,
      observacao: true,
      createdAt: true,
      nomeCliente: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          subtotal: true,
          observacao: true,
          produto: { select: { nome: true } },
        },
      },
    },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  return NextResponse.json(pedido);
}

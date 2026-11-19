import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota pública — retorna apenas os dados que o cliente pode ver na tela de confirmação.
// Sem autenticação, mas sem expor dados internos (sem userId, custo, etc.).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: {
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

  // Retorna apenas os campos que o cliente pode ver
  return NextResponse.json({
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    nomeCliente: pedido.nomeCliente,
    observacao: pedido.observacao,
    total: pedido.total,
    createdAt: pedido.createdAt,
    // Campos novos — serão undefined se o db:push ainda não rodou (compatível)
    tipoPedido: (pedido as any).tipoPedido ?? "RETIRADA",
    horarioEntrega: (pedido as any).horarioEntrega ?? null,
    taxaEntrega: (pedido as any).taxaEntrega ?? 0,
    itens: pedido.itens,
  });
}

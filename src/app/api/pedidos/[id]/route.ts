import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ABERTO", "EM_PREPARO", "PRONTO", "ENTREGUE", "AGUARDANDO_PAGTO", "CANCELADO", "PAGO"]),
  formaPagto: z.enum(["DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "PIX", "VOUCHER", "MISTO", "PENDENTE"]).optional(),
  formaEntrega: z.enum(["RETIRADA", "DELIVERY"]).optional(),
  enderecoEntrega: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: {
      itens: { include: { produto: { include: { categoria: true } } } },
      user: { select: { name: true } },
    },
  });

  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  return NextResponse.json(pedido);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = updateStatusSchema.parse(body);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    const updateData: any = { status: data.status };
    if (data.formaPagto) updateData.formaPagto = data.formaPagto;
    if (data.formaEntrega) updateData.formaEntrega = data.formaEntrega;
    if (data.enderecoEntrega !== undefined) updateData.enderecoEntrega = data.enderecoEntrega;

    // Pagamento pendente: vai para AGUARDANDO_PAGTO, sem mexer no caixa
    if (data.status === "AGUARDANDO_PAGTO") {
      const updated = await prisma.pedido.update({
        where: { id: params.id },
        data: updateData,
        include: { itens: { include: { produto: true } } },
      });
      return NextResponse.json(updated);
    }

    // Fechamento com pagamento: registra no caixa
    if (data.status === "PAGO" && pedido.status !== "PAGO") {
      updateData.fechadoEm = new Date();

      // Garante que formaPagto final nunca seja PENDENTE no caixa
      const formaPagtoFinal =
        (data.formaPagto && data.formaPagto !== "PENDENTE")
          ? data.formaPagto
          : (pedido.formaPagto && pedido.formaPagto !== "PENDENTE")
            ? pedido.formaPagto
            : "DINHEIRO";

      await prisma.$transaction([
        prisma.pedido.update({ where: { id: params.id }, data: updateData }),
        prisma.caixaMovimento.create({
          data: {
            tipo: "ENTRADA",
            categoria: "VENDA",
            descricao: `Pedido #${pedido.numero} - ${formaPagtoFinal}`,
            valor: pedido.total,
            formaPagto: formaPagtoFinal,
            pedidoId: params.id,
            userId: (session.user as any).id,
          },
        }),
      ]);

      const updated = await prisma.pedido.findUnique({
        where: { id: params.id },
        include: { itens: { include: { produto: true } } },
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.pedido.update({
      where: { id: params.id },
      data: updateData,
      include: { itens: { include: { produto: true } } },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao atualizar pedido" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (pedido.status === "PAGO" || pedido.status === "AGUARDANDO_PAGTO") {
    return NextResponse.json({ error: "Não é possível remover um pedido já concluído ou aguardando pagamento" }, { status: 400 });
  }

  // Remove o pedido e seus vínculos em uma transação.
  // - Itens são apagados (cascade no schema).
  // - Movimentos de estoque vinculados têm o pedidoId zerado (relação opcional).
  // - Movimentos de caixa vinculados têm o pedidoId zerado para não ficar órfão.
  await prisma.$transaction([
    prisma.itemPedido.deleteMany({ where: { pedidoId: params.id } }),
    prisma.estoqueMovimento.updateMany({ where: { pedidoId: params.id }, data: { pedidoId: null } }),
    prisma.caixaMovimento.updateMany({ where: { pedidoId: params.id }, data: { pedidoId: null } }),
    prisma.pedido.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ success: true });
}

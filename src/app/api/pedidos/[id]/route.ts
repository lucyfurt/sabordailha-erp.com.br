import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ABERTO", "EM_PREPARO", "PRONTO", "ENTREGUE", "PAGAMENTO_PENDENTE", "CANCELADO", "PAGO"]),
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

    // Pagamento pendente: vai para PAGAMENTO_PENDENTE, sem mexer no caixa
    if (data.status === "PAGAMENTO_PENDENTE") {
      const updated = await prisma.pedido.update({
        where: { id: params.id },
        data: updateData,
        include: { itens: { include: { produto: true } } },
      });
      return NextResponse.json(updated);
    }

    // Ao entregar: baixa automática no estoque conforme receita de cada produto
    if (data.status === "ENTREGUE" && pedido.status !== "ENTREGUE" && pedido.status !== "PAGO") {
      const pedidoComItens = await prisma.pedido.findUnique({
        where: { id: params.id },
        include: {
          itens: {
            include: {
              produto: { include: { receitaItens: true } },
            },
          },
        },
      });

      if (pedidoComItens) {
        // Monta lista de baixas: { materialId, quantidade total a descontar }
        const baixas: Record<string, number> = {};
        for (const item of pedidoComItens.itens) {
          for (const ri of item.produto.receitaItens) {
            const matId = ri.materialId;
            baixas[matId] = (baixas[matId] || 0) + Number(ri.quantidade) * item.quantidade;
          }
        }

        // Busca materiais afetados
        const materialIds = Object.keys(baixas);
        if (materialIds.length > 0) {
          const materiais = await prisma.material.findMany({ where: { id: { in: materialIds } } });
          const matMap = Object.fromEntries(materiais.map((m) => [m.id, m]));

          await prisma.$transaction([
            prisma.pedido.update({ where: { id: params.id }, data: updateData }),
            ...materialIds.map((matId) =>
              prisma.estoqueMovimento.create({
                data: {
                  materialId: matId,
                  tipo: "SAIDA",
                  quantidade: baixas[matId],
                  motivo: `Pedido #${pedido.numero}`,
                  pedidoId: params.id,
                },
              })
            ),
            ...materialIds.map((matId) => {
              const mat = matMap[matId];
              const novaQtd = Math.max(0, Number(mat.quantidadeAtual) - baixas[matId]);
              return prisma.material.update({ where: { id: matId }, data: { quantidadeAtual: novaQtd } });
            }),
          ]);

          const updated = await prisma.pedido.findUnique({
            where: { id: params.id },
            include: { itens: { include: { produto: true } } },
          });
          return NextResponse.json(updated);
        }
      }
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

const editPedidoSchema = z.object({
  nomeCliente: z.string().optional(),
  observacao: z.string().optional(),
  formaEntrega: z.enum(["RETIRADA", "DELIVERY"]).optional(),
  enderecoEntrega: z.string().optional().nullable(),
  horarioEntrega: z.string().optional().nullable(),
  taxaEntrega: z.number().min(0).optional(),
  itens: z.array(z.object({
    produtoId: z.string(),
    quantidade: z.number().int().min(1),
    observacao: z.string().optional(),
  })).min(1).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = editPedidoSchema.parse(body);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    if (pedido.status === "PAGO") {
      return NextResponse.json({ error: "Não é possível editar um pedido já pago" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.nomeCliente !== undefined) updateData.nomeCliente = data.nomeCliente;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.formaEntrega !== undefined) updateData.formaEntrega = data.formaEntrega;
    if (data.enderecoEntrega !== undefined) updateData.enderecoEntrega = data.enderecoEntrega;
    if (data.horarioEntrega !== undefined) updateData.horarioEntrega = data.horarioEntrega;

    if (data.itens) {
      const produtoIds = data.itens.map((i) => i.produtoId);
      const produtos = await prisma.produto.findMany({
        where: { id: { in: produtoIds }, ativo: true },
      });
      const produtoMap = Object.fromEntries(produtos.map((p) => [p.id, p]));

      let subtotal = 0;
      const itensData = data.itens.map((item) => {
        const produto = produtoMap[item.produtoId];
        if (!produto) throw new Error(`Produto ${item.produtoId} não encontrado`);
        const precoUnit = Number(produto.preco);
        const itemSubtotal = precoUnit * item.quantidade;
        subtotal += itemSubtotal;
        return { produtoId: item.produtoId, quantidade: item.quantidade, precoUnit, subtotal: itemSubtotal, observacao: item.observacao };
      });

      const formaEntregaFinal = data.formaEntrega ?? pedido.formaEntrega;
      const taxaEntrega = formaEntregaFinal === "DELIVERY"
        ? (data.taxaEntrega ?? Number(pedido.taxaEntrega))
        : 0;

      updateData.taxaEntrega = taxaEntrega;
      updateData.total = subtotal - Number(pedido.desconto) + taxaEntrega;

      await prisma.$transaction([
        prisma.itemPedido.deleteMany({ where: { pedidoId: params.id } }),
        prisma.pedido.update({
          where: { id: params.id },
          data: { ...updateData, itens: { create: itensData } },
        }),
      ]);
    } else {
      if (data.taxaEntrega !== undefined) updateData.taxaEntrega = data.taxaEntrega;
      if (data.formaEntrega === "RETIRADA") {
        updateData.taxaEntrega = 0;
        updateData.total = Number(pedido.total) - Number(pedido.taxaEntrega);
      } else if (data.taxaEntrega !== undefined) {
        const diff = data.taxaEntrega - Number(pedido.taxaEntrega);
        updateData.total = Number(pedido.total) + diff;
      }
      await prisma.pedido.update({ where: { id: params.id }, data: updateData });
    }

    const updated = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: { itens: { include: { produto: true } } },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao editar pedido" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (pedido.status === "PAGO" || pedido.status === "PAGAMENTO_PENDENTE") {
    return NextResponse.json({ error: "Não é possível remover um pedido já concluído ou com pagamento pendente" }, { status: 400 });
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

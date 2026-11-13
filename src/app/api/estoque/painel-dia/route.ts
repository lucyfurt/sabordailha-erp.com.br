import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dataParam = searchParams.get("data"); // YYYY-MM-DD

  const dia = dataParam ? new Date(dataParam) : new Date();
  const inicio = new Date(dia);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(dia);
  fim.setHours(23, 59, 59, 999);

  // Pedidos pagos/entregues no dia com itens e receita
  const pedidos = await prisma.pedido.findMany({
    where: {
      status: { in: ["PAGO", "ENTREGUE"] },
      updatedAt: { gte: inicio, lte: fim },
    },
    include: {
      itens: {
        include: {
          produto: {
            include: {
              receitaItens: {
                include: { material: { select: { id: true, nome: true, unidade: true } } },
              },
            },
          },
        },
      },
    },
  });

  // Agrupa vendas por produto
  const vendasPorProduto: Record<string, { nome: string; quantidade: number; total: number }> = {};
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const id = item.produtoId;
      if (!vendasPorProduto[id]) {
        vendasPorProduto[id] = { nome: item.produto.nome, quantidade: 0, total: 0 };
      }
      vendasPorProduto[id].quantidade += item.quantidade;
      vendasPorProduto[id].total += Number(item.subtotal);
    }
  }

  // Agrupa consumo de materiais
  const consumoPorMaterial: Record<string, { nome: string; unidade: string; consumido: number }> = {};
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      for (const ri of item.produto.receitaItens) {
        const id = ri.materialId;
        if (!consumoPorMaterial[id]) {
          consumoPorMaterial[id] = { nome: ri.material.nome, unidade: ri.material.unidade, consumido: 0 };
        }
        consumoPorMaterial[id].consumido += Number(ri.quantidade) * item.quantidade;
      }
    }
  }

  // Sobras e desperdícios do dia
  const movimentos = await prisma.estoqueMovimento.findMany({
    where: {
      tipo: { in: ["SOBRA", "DESPERDICIO"] },
      createdAt: { gte: inicio, lte: fim },
    },
    include: { material: { select: { id: true, nome: true, unidade: true } } },
  });

  const sobrasPorMaterial: Record<string, { nome: string; unidade: string; sobra: number; desperdicio: number }> = {};
  for (const mov of movimentos) {
    const id = mov.materialId;
    if (!sobrasPorMaterial[id]) {
      sobrasPorMaterial[id] = { nome: mov.material.nome, unidade: mov.material.unidade, sobra: 0, desperdicio: 0 };
    }
    if (mov.tipo === "SOBRA") sobrasPorMaterial[id].sobra += Number(mov.quantidade);
    if (mov.tipo === "DESPERDICIO") sobrasPorMaterial[id].desperdicio += Number(mov.quantidade);
  }

  return NextResponse.json({
    data: dia.toISOString().split("T")[0],
    totalPedidos: pedidos.length,
    vendas: Object.values(vendasPorProduto).sort((a, b) => b.quantidade - a.quantidade),
    consumo: Object.values(consumoPorMaterial).sort((a, b) => a.nome.localeCompare(b.nome)),
    sobrasDesperdicios: Object.values(sobrasPorMaterial).sort((a, b) => a.nome.localeCompare(b.nome)),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subDays, format, eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") || "MENSAL";
  const dateStr = searchParams.get("data") || new Date().toISOString();
  const date = new Date(dateStr);

  let start: Date, end: Date;

  if (tipo === "DIARIO") {
    start = startOfDay(date);
    end = endOfDay(date);
  } else if (tipo === "SEMANAL") {
    start = startOfWeek(date, { weekStartsOn: 1 });
    end = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    start = startOfMonth(date);
    end = endOfMonth(date);
  }

  const [movimentos, pedidos, topProdutos, categoriasCaixa] = await Promise.all([
    // Todos os movimentos do período
    prisma.caixaMovimento.findMany({
      where: { dataMovimento: { gte: start, lte: end } },
      orderBy: { dataMovimento: "asc" },
    }),

    // Pedidos do período
    prisma.pedido.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELADO" },
      },
      include: {
        itens: { include: { produto: true } },
      },
    }),

    // Top produtos
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: {
        pedido: {
          createdAt: { gte: start, lte: end },
          status: { not: "CANCELADO" },
        },
      },
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 10,
    }),

    // Categorias do caixa
    prisma.caixaMovimento.groupBy({
      by: ["categoria", "tipo"],
      where: { dataMovimento: { gte: start, lte: end } },
      _sum: { valor: true },
    }),
  ]);

  // Enriquecer top produtos com nomes
  const prodIds = topProdutos.map((p) => p.produtoId);
  const prods = await prisma.produto.findMany({
    where: { id: { in: prodIds } },
    select: { id: true, nome: true },
  });
  const prodMap = Object.fromEntries(prods.map((p) => [p.id, p.nome]));

  // Gráfico diário (últimos dias do período)
  const days = eachDayOfInterval({ start, end });
  const graficoEntradas = days.map((day) => {
    const dayMovs = movimentos.filter(
      (m) =>
        m.tipo === "ENTRADA" &&
        new Date(m.dataMovimento) >= startOfDay(day) &&
        new Date(m.dataMovimento) <= endOfDay(day)
    );
    const saidas = movimentos.filter(
      (m) =>
        m.tipo === "SAIDA" &&
        new Date(m.dataMovimento) >= startOfDay(day) &&
        new Date(m.dataMovimento) <= endOfDay(day)
    );
    return {
      data: format(day, tipo === "DIARIO" ? "HH:mm" : "dd/MM", { locale: ptBR }),
      entradas: dayMovs.reduce((s, m) => s + Number(m.valor), 0),
      saidas: saidas.reduce((s, m) => s + Number(m.valor), 0),
    };
  });

  const totalEntradas = movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + Number(m.valor), 0);
  const pedidosCancelados = await prisma.pedido.count({
    where: { createdAt: { gte: start, lte: end }, status: "CANCELADO" },
  });

  return NextResponse.json({
    periodo: { start, end, tipo },
    resumo: {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      totalPedidos: pedidos.length,
      pedidosCancelados,
      ticketMedio: pedidos.length > 0
        ? pedidos.reduce((s, p) => s + Number(p.total), 0) / pedidos.length
        : 0,
    },
    grafico: graficoEntradas,
    topProdutos: topProdutos.map((p) => ({
      nome: prodMap[p.produtoId] || "?",
      quantidade: Number(p._sum.quantidade || 0),
      total: Number(p._sum.subtotal || 0),
    })),
    categorias: categoriasCaixa.map((c) => ({
      categoria: c.categoria,
      tipo: c.tipo,
      total: Number(c._sum.valor || 0),
    })),
    formasPagto: await prisma.pedido.groupBy({
      by: ["formaPagto"],
      where: {
        createdAt: { gte: start, lte: end },
        status: "PAGO",
        formaPagto: { not: null },
      },
      _count: true,
      _sum: { total: true },
    }),
  });
}

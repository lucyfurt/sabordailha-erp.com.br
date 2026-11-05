import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { DashboardClient } from "./DashboardClient";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    faturamentoHoje,
    faturamentoMes,
    pedidosHoje,
    pedidosAbertos,
    materiaisAbaixoMin,
    ultimosPedidos,
    fluxoHoje,
    topProdutos,
  ] = await Promise.all([
    prisma.caixaMovimento.aggregate({
      where: { tipo: "ENTRADA", categoria: "VENDA", dataMovimento: { gte: todayStart, lte: todayEnd } },
      _sum: { valor: true },
    }),
    prisma.caixaMovimento.aggregate({
      where: { tipo: "ENTRADA", categoria: "VENDA", dataMovimento: { gte: monthStart, lte: monthEnd } },
      _sum: { valor: true },
    }),
    prisma.pedido.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELADO" } },
    }),
    prisma.pedido.count({
      where: { status: { in: ["ABERTO", "EM_PREPARO"] } },
    }),
    prisma.material.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, quantidadeAtual: true, quantidadeMin: true, unidade: true },
    }),
    prisma.pedido.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        itens: { include: { produto: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.caixaMovimento.findMany({
      where: { dataMovimento: { gte: todayStart, lte: todayEnd } },
      orderBy: { dataMovimento: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: {
        pedido: { createdAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELADO" } },
      },
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    }),
  ]);

  const produtoIds = topProdutos.map((p) => p.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds } },
    select: { id: true, nome: true },
  });
  const produtoMap = Object.fromEntries(produtos.map((p) => [p.id, p.nome]));

  const saidasHoje = await prisma.caixaMovimento.aggregate({
    where: { tipo: "SAIDA", dataMovimento: { gte: todayStart, lte: todayEnd } },
    _sum: { valor: true },
  });

  const criticos = materiaisAbaixoMin
    .filter((m) => Number(m.quantidadeAtual) <= Number(m.quantidadeMin))
    .slice(0, 5);

  return {
    faturamentoHoje: Number(faturamentoHoje._sum.valor || 0),
    faturamentoMes: Number(faturamentoMes._sum.valor || 0),
    saidasHoje: Number(saidasHoje._sum.valor || 0),
    pedidosHoje,
    pedidosAbertos,
    materiaisAbaixoMin: criticos,
    ultimosPedidos,
    fluxoHoje,
    topProdutos: topProdutos.map((p) => ({
      nome: produtoMap[p.produtoId] || "?",
      quantidade: p._sum.quantidade || 0,
      total: Number(p._sum.subtotal || 0),
    })),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData();

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`Olá, ${session?.user?.name?.split(" ")[0]} 👋`}
        subtitle="Aqui está o resumo do dia"
      />
      <div className="flex-1 p-3 md:p-6">
        <DashboardClient data={data} />
      </div>
    </div>
  );
}

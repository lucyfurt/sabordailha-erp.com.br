import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

// Dashboard do estoque: indicadores do período + lista inteligente de compras + alertas.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodo = Math.max(1, parseInt(searchParams.get("periodo") || "30"));
  const inicio = subDays(new Date(), periodo);

  const [materiais, movs] = await Promise.all([
    prisma.material.findMany({
      where: { ativo: true },
      include: { fornecedor: { select: { nome: true } } },
    }),
    prisma.estoqueMovimento.findMany({ where: { createdAt: { gte: inicio } } }),
  ]);

  // Custo de referência por material (custo médio ou unitário)
  const custoMap = new Map(materiais.map((m) => [m.id, Number(m.custoMedio || m.custoUnitario || 0)]));

  let consumoValor = 0;
  let perdasValor = 0;
  let comprasValor = 0;
  const consumoQtd: Record<string, number> = {};

  for (const m of movs) {
    const tipo = String(m.tipo);
    const custo = custoMap.get(m.materialId) || 0;
    const qtd = Number(m.quantidade);

    if (tipo === "SAIDA") {
      consumoValor += qtd * custo;
      consumoQtd[m.materialId] = (consumoQtd[m.materialId] || 0) + qtd;
    } else if (tipo === "PERDA" || tipo === "DESPERDICIO") {
      perdasValor += qtd * custo;
    } else if (tipo === "ENTRADA" && m.custoTotal) {
      comprasValor += Number(m.custoTotal);
    }
  }

  // Indicadores gerais
  let valorTotal = 0;
  let baixo = 0;
  let semEstoque = 0;
  for (const m of materiais) {
    const qtd = Number(m.quantidadeAtual);
    const min = Number(m.quantidadeMin);
    valorTotal += qtd * (custoMap.get(m.id) || 0);
    if (qtd === 0) semEstoque++;
    if (min > 0 && qtd <= min) baixo++;
  }

  // Lista inteligente de compras + alertas
  const itensComprar: any[] = [];
  const alertas: any[] = [];

  for (const m of materiais) {
    const qtd = Number(m.quantidadeAtual);
    const min = Number(m.quantidadeMin);
    const consumoTotal = consumoQtd[m.id] || 0;
    const consumoMedioDia = consumoTotal / periodo;
    const coberturaDias = consumoMedioDia > 0 ? Math.floor(qtd / consumoMedioDia) : null;
    const sugerido = min > 0 && qtd < min ? min - qtd : 0;

    if (sugerido > 0) {
      itensComprar.push({
        id: m.id, nome: m.nome, unidade: m.unidade,
        atual: qtd, minimo: min, sugerido,
        consumoMedioDia, coberturaDias,
        fornecedor: m.fornecedor?.nome || null,
      });
    }

    if (qtd === 0) {
      alertas.push({ id: m.id, nome: m.nome, situacao: "Sem estoque", atual: qtd, minimo: min, unidade: m.unidade, acao: "Registrar compra" });
    } else if (min > 0 && qtd <= min) {
      alertas.push({ id: m.id, nome: m.nome, situacao: "Estoque baixo", atual: qtd, minimo: min, unidade: m.unidade, acao: "Registrar compra" });
    } else if (coberturaDias !== null && coberturaDias <= 3) {
      alertas.push({ id: m.id, nome: m.nome, situacao: `Cobertura ~${coberturaDias} dias`, atual: qtd, minimo: min, unidade: m.unidade, acao: "Registrar compra" });
    }
  }

  itensComprar.sort((a, b) => b.sugerido - a.sugerido);

  return NextResponse.json({
    periodo,
    valorTotal,
    totalProdutos: materiais.length,
    estoqueBaixo: baixo,
    semEstoque,
    comprasPeriodo: comprasValor,
    consumoPeriodo: consumoValor,
    perdasPeriodo: perdasValor,
    // Vencimento ainda não disponível (requer controle de lotes — Fase 4)
    vencendo: null,
    vencidos: null,
    itensComprar,
    alertas,
  });
}

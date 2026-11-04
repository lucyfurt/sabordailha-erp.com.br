import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMovSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  categoria: z.enum([
    "VENDA", "COMPRA_MATERIAL", "SALARIO", "ALUGUEL", "AGUA", "LUZ",
    "GAS", "MANUTENCAO", "MARKETING", "OUTROS_ENTRADA", "OUTROS_SAIDA",
  ]),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  formaPagto: z.enum(["DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "PIX", "VOUCHER", "MISTO"]).optional(),
  fornecedorId: z.string().optional(),
  referencia: z.string().optional(),
  observacao: z.string().optional(),
  dataMovimento: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (tipo) where.tipo = tipo;
  if (dataInicio || dataFim) {
    where.dataMovimento = {};
    if (dataInicio) where.dataMovimento.gte = new Date(dataInicio);
    if (dataFim) where.dataMovimento.lte = new Date(dataFim);
  }

  const [movimentos, total, resumo] = await Promise.all([
    prisma.caixaMovimento.findMany({
      where,
      include: {
        user: { select: { name: true } },
        fornecedor: { select: { nome: true } },
      },
      orderBy: { dataMovimento: "desc" },
      skip,
      take: limit,
    }),
    prisma.caixaMovimento.count({ where }),
    prisma.caixaMovimento.groupBy({
      by: ["tipo"],
      where,
      _sum: { valor: true },
    }),
  ]);

  const totalEntradas = resumo.find((r) => r.tipo === "ENTRADA")?._sum.valor || 0;
  const totalSaidas = resumo.find((r) => r.tipo === "SAIDA")?._sum.valor || 0;

  return NextResponse.json({
    movimentos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    resumo: {
      entradas: Number(totalEntradas),
      saidas: Number(totalSaidas),
      saldo: Number(totalEntradas) - Number(totalSaidas),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createMovSchema.parse(body);

    const movimento = await prisma.caixaMovimento.create({
      data: {
        ...data,
        valor: data.valor,
        dataMovimento: data.dataMovimento ? new Date(data.dataMovimento) : new Date(),
        userId: (session.user as any).id,
      },
      include: {
        user: { select: { name: true } },
        fornecedor: { select: { nome: true } },
      },
    });

    return NextResponse.json(movimento, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao registrar movimento" }, { status: 500 });
  }
}

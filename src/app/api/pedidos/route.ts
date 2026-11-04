import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPedidoSchema = z.object({
  mesa: z.string().optional(),
  nomeCliente: z.string().optional(),
  observacao: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string(),
    quantidade: z.number().int().min(1),
    observacao: z.string().optional(),
  })).min(1),
  formaPagto: z.enum(["DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "PIX", "VOUCHER", "MISTO"]).optional(),
  desconto: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: {
        itens: { include: { produto: { select: { nome: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.pedido.count({ where }),
  ]);

  return NextResponse.json({ pedidos, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createPedidoSchema.parse(body);

    // Buscar preços dos produtos
    const produtoIds = data.itens.map((i) => i.produtoId);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds }, ativo: true },
    });
    const produtoMap = Object.fromEntries(produtos.map((p) => [p.id, p]));

    // Calcular total
    let total = 0;
    const itensData = data.itens.map((item) => {
      const produto = produtoMap[item.produtoId];
      if (!produto) throw new Error(`Produto ${item.produtoId} não encontrado`);
      const precoUnit = Number(produto.preco);
      const subtotal = precoUnit * item.quantidade;
      total += subtotal;
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnit,
        subtotal,
        observacao: item.observacao,
      };
    });

    total -= data.desconto;

    const pedido = await prisma.pedido.create({
      data: {
        mesa: data.mesa,
        nomeCliente: data.nomeCliente,
        observacao: data.observacao,
        total,
        desconto: data.desconto,
        formaPagto: data.formaPagto,
        userId: (session.user as any).id,
        itens: { create: itensData },
      },
      include: {
        itens: { include: { produto: true } },
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao criar pedido" }, { status: 500 });
  }
}

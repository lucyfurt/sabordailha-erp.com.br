import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getHorarioFuncionamento } from "@/lib/horario";

const pedidoPublicoSchema = z.object({
  nomeCliente: z.string().min(1, "Informe seu nome"),
  tipoPedido: z.enum(["RETIRADA", "DELIVERY"]),
  endereco: z.string().optional(),
  localizacao: z.string().optional(), // link do Google Maps / WhatsApp
  horarioEntrega: z.string().optional(),
  observacao: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string(),
    quantidade: z.number().int().min(1),
    observacao: z.string().optional(),
  })).min(1, "Adicione pelo menos um item"),
});

// Rota pública — sem autenticação.
export async function POST(req: NextRequest) {
  // Verificar horário de funcionamento
  const { aberto, mensagem } = getHorarioFuncionamento();
  if (!aberto) {
    return NextResponse.json({ error: mensagem }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = pedidoPublicoSchema.parse(body);

    // Buscar produtos e validar disponibilidade
    const produtoIds = data.itens.map((i) => i.produtoId);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds }, ativo: true },
    });

    const produtoMap = Object.fromEntries(produtos.map((p) => [p.id, p]));

    // Verificar se todos os produtos existem e estão disponíveis
    for (const item of data.itens) {
      const p = produtoMap[item.produtoId];
      if (!p) {
        return NextResponse.json({ error: `Produto não encontrado` }, { status: 400 });
      }
      if (!(p as any).disponivel && (p as any).disponivel !== undefined) {
        return NextResponse.json(
          { error: `"${p.nome}" está esgotado no momento. Por favor, remova-o do pedido.` },
          { status: 400 }
        );
      }
    }

    // Calcular total
    let total = 0;
    const itensData = data.itens.map((item) => {
      const p = produtoMap[item.produtoId];
      const precoUnit = Number(p.preco);
      const subtotal = precoUnit * item.quantidade;
      total += subtotal;
      return { produtoId: item.produtoId, quantidade: item.quantidade, precoUnit, subtotal, observacao: item.observacao };
    });

    // Montar observação completa incluindo tipo, endereço/localização e horário
    // (campos tipoPedido/horarioEntrega/taxaEntrega só existem após db:push)
    let obsCompleta = "";
    if (data.tipoPedido === "DELIVERY") {
      obsCompleta += `[DELIVERY]`;
      if (data.horarioEntrega) obsCompleta += ` Horário: ${data.horarioEntrega}`;
      if (data.endereco) obsCompleta += `\nEndereço: ${data.endereco}`;
      if (data.localizacao) obsCompleta += `\nLocalização: ${data.localizacao}`;
    } else {
      obsCompleta += `[RETIRADA]`;
    }
    if (data.observacao) obsCompleta += `\n${data.observacao}`;
    obsCompleta = obsCompleta.trim();

    // Tenta criar com os campos novos; se o banco ainda não tiver as colunas,
    // cria só com os campos que sempre existiram.
    let pedido: any;
    try {
      pedido = await (prisma.pedido as any).create({
        data: {
          nomeCliente: data.nomeCliente,
          tipoPedido: data.tipoPedido,
          horarioEntrega: data.tipoPedido === "DELIVERY" ? (data.horarioEntrega || null) : null,
          taxaEntrega: 0,
          observacao: obsCompleta || null,
          total,
          itens: { create: itensData },
        },
        include: { itens: { include: { produto: { select: { nome: true } } } } },
      });
    } catch (e: any) {
      // Fallback: banco ainda sem as colunas novas — cria sem elas
      if (e.message?.includes("Unknown argument")) {
        pedido = await prisma.pedido.create({
          data: {
            nomeCliente: data.nomeCliente,
            observacao: obsCompleta || null,
            total,
            itens: { create: itensData },
          },
          include: { itens: { include: { produto: { select: { nome: true } } } } },
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ pedidoId: pedido.id, numero: pedido.numero, total }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao criar pedido" }, { status: 500 });
  }
}

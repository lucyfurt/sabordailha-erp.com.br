import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const materialSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  categoria: z.string().default("Ingrediente"),
  unidade: z.string().min(1),
  quantidadeMin: z.number().min(0).default(0),
  custoUnitario: z.number().optional(),
  tamEmbalagem: z.number().optional(),
  unidadeEmbalagem: z.string().optional(),
  fornecedorId: z.string().optional(),
});

const movSchema = z.object({
  materialId: z.string(),
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE", "PERDA", "SOBRA", "DESPERDICIO"]),
  quantidade: z.number().positive(),
  motivo: z.string().optional(),
  custoTotal: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const critico = searchParams.get("critico") === "true";
  const search = searchParams.get("search") || "";
  const categoria = searchParams.get("categoria") || "";

  const where: any = { ativo: true };
  if (search) where.nome = { contains: search, mode: "insensitive" };
  if (categoria) where.categoria = categoria;

  const materiais = await prisma.material.findMany({
    where,
    include: {
      fornecedor: { select: { nome: true } },
      movimentacoes: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { nome: "asc" },
  });

  const result = critico
    ? materiais.filter((m) => Number(m.quantidadeAtual) <= Number(m.quantidadeMin))
    : materiais;

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "mov") {
      // Registrar movimentação
      const data = movSchema.parse(body.data);
      const material = await prisma.material.findUnique({ where: { id: data.materialId } });
      if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });

      let novaQtd = Number(material.quantidadeAtual);
      if (data.tipo === "ENTRADA") novaQtd += data.quantidade;
      else if (data.tipo === "SAIDA" || data.tipo === "PERDA" || data.tipo === "SOBRA" || data.tipo === "DESPERDICIO") novaQtd -= data.quantidade;
      else novaQtd = data.quantidade; // AJUSTE: seta a quantidade

      if (novaQtd < 0) {
        return NextResponse.json({ error: "Quantidade insuficiente em estoque" }, { status: 400 });
      }

      const [mov] = await prisma.$transaction([
        prisma.estoqueMovimento.create({
          data: {
            materialId: data.materialId,
            tipo: data.tipo,
            quantidade: data.quantidade,
            motivo: data.motivo,
            custoTotal: data.custoTotal,
          },
        }),
        prisma.material.update({
          where: { id: data.materialId },
          data: {
            quantidadeAtual: novaQtd,
            // Atualiza custo unitário e custo médio ponderado ao comprar
            ...(data.tipo === "ENTRADA" && data.custoTotal ? (() => {
              const custoNovo = data.custoTotal / data.quantidade;
              const qtdAnterior = Number(material.quantidadeAtual);
              const custoAnterior = Number(material.custoMedio || material.custoUnitario || custoNovo);
              // Custo médio ponderado = (qtdAnterior * custoAnterior + qtdNova * custoNovo) / (qtdAnterior + qtdNova)
              const custoMedio = qtdAnterior > 0
                ? (qtdAnterior * custoAnterior + data.quantidade * custoNovo) / (qtdAnterior + data.quantidade)
                : custoNovo;
              return { custoUnitario: custoNovo, custoMedio };
            })() : {}),
          },
        }),
      ]);

      // Se for compra (ENTRADA com custo), registrar no caixa
      if (data.tipo === "ENTRADA" && data.custoTotal) {
        await prisma.caixaMovimento.create({
          data: {
            tipo: "SAIDA",
            categoria: "COMPRA_MATERIAL",
            descricao: `Compra: ${material.nome} (${data.quantidade} ${material.unidade})`,
            valor: data.custoTotal,
            userId: (session.user as any).id,
          },
        });
      }

      return NextResponse.json(mov, { status: 201 });
    } else {
      // Criar material
      const data = materialSchema.parse(body);
      const material = await prisma.material.create({
        data: { ...data, quantidadeAtual: 0 },
        include: { fornecedor: { select: { nome: true } } },
      });
      return NextResponse.json(material, { status: 201 });
    }
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro" }, { status: 500 });
  }
}

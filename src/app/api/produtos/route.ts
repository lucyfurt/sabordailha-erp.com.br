import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const produtoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  categoriaId: z.string(),
  imagem: z.string().optional(),
  custoEstimado: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoriaId = searchParams.get("categoriaId");
  const search = searchParams.get("search") || "";
  const ativo = searchParams.get("ativo");

  const where: any = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (search) where.nome = { contains: search, mode: "insensitive" };
  if (ativo !== null && ativo !== undefined) where.ativo = ativo === "true";

  const produtos = await prisma.produto.findMany({
    where,
    include: { categoria: true },
    orderBy: [{ categoria: { nome: "asc" } }, { nome: "asc" }],
  });

  return NextResponse.json(produtos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = produtoSchema.parse(body);

    const produto = await prisma.produto.create({
      data,
      include: { categoria: true },
    });
    return NextResponse.json(produto, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro ao criar produto" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fornecedorSchema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  endereco: z.string().optional(),
  contato: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const fornecedores = await prisma.fornecedor.findMany({
    where: { ativo: true },
    include: {
      _count: { select: { materiais: true } },
    },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(fornecedores);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = fornecedorSchema.parse(body);

    const forn = await prisma.fornecedor.create({
      data: { ...data, email: data.email || undefined },
    });
    return NextResponse.json(forn, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Erro" }, { status: 500 });
  }
}

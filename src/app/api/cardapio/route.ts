import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHorarioFuncionamento } from "@/lib/horario";

// Rota pública — sem autenticação.
// Retorna produtos ativos agrupados por categoria, com status de abertura.
// Cache desabilitado para refletir mudanças de disponibilidade em tempo real.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { aberto, mensagem } = getHorarioFuncionamento();

  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    include: { categoria: true },
    orderBy: [{ categoria: { nome: "asc" } }, { nome: "asc" }],
  });

  // Agrupa por categoria
  const categoriasMap: Record<string, { id: string; nome: string; icone?: string | null; produtos: any[] }> = {};
  for (const p of produtos) {
    const cat = p.categoria;
    if (!categoriasMap[cat.id]) {
      categoriasMap[cat.id] = { id: cat.id, nome: cat.nome, icone: cat.icone, produtos: [] };
    }
    categoriasMap[cat.id].produtos.push({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: Number(p.preco),
      disponivel: (p as any).disponivel ?? true,
    });
  }

  return NextResponse.json({
    aberto,
    mensagem,
    categorias: Object.values(categoriasMap),
  });
}

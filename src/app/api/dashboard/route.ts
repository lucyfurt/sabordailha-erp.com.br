import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Últimos 7 dias para gráfico de faturamento
  const hoje = new Date();
  const graficoDias = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const day = subDays(hoje, 6 - i);
      return prisma.caixaMovimento
        .aggregate({
          where: {
            tipo: "ENTRADA",
            categoria: "VENDA",
            dataMovimento: { gte: startOfDay(day), lte: endOfDay(day) },
          },
          _sum: { valor: true },
        })
        .then((r) => ({
          data: format(day, "dd/MM"),
          valor: Number(r._sum.valor || 0),
        }));
    })
  );

  return NextResponse.json({ graficoDias });
}

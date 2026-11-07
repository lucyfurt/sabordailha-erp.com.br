"use client";

import { formatCurrency, formatDateTime, PEDIDO_STATUS_LABELS, PEDIDO_STATUS_COLORS } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  faturamentoHoje: number;
  faturamentoMes: number;
  saidasHoje: number;
  pedidosHoje: number;
  pedidosAbertos: number;
  materiaisAbaixoMin: any[];
  ultimosPedidos: any[];
  fluxoHoje: any[];
  topProdutos: { nome: string; quantidade: number; total: number }[];
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const saldoHoje = data.faturamentoHoje - data.saidasHoje;

  const statCards = [
    {
      title: "Faturamento Hoje",
      value: formatCurrency(data.faturamentoHoje),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      desc: `Saídas: ${formatCurrency(data.saidasHoje)}`,
    },
    {
      title: "Saldo do Dia",
      value: formatCurrency(saldoHoje),
      icon: TrendingUp,
      color: saldoHoje >= 0 ? "text-blue-600" : "text-red-600",
      bg: saldoHoje >= 0 ? "bg-blue-50" : "bg-red-50",
      desc: "Entradas − Saídas",
    },
    {
      title: "Pedidos Hoje",
      value: data.pedidosHoje.toString(),
      icon: ShoppingBag,
      color: "text-orange-600",
      bg: "bg-orange-50",
      desc: `${data.pedidosAbertos} em andamento`,
    },
    {
      title: "Faturamento do Mês",
      value: formatCurrency(data.faturamentoMes),
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Mês atual",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Alertas */}
      {data.materiaisAbaixoMin.length > 0 && (
        <div className="flex items-start gap-3 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-amber-800 text-sm">
              {data.materiaisAbaixoMin.length} material(is) abaixo do estoque mínimo
            </p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              {data.materiaisAbaixoMin.map((m) => m.nome).join(", ")}
              <Link href="/estoque" className="ml-2 underline font-medium whitespace-nowrap">
                Ver estoque →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards — 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <p className="text-xs font-medium text-gray-500 leading-tight">{card.title}</p>
                <div className={`p-1.5 md:p-2 rounded-lg ${card.bg} flex-shrink-0`}>
                  <card.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-lg md:text-2xl font-bold ${card.color} truncate`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1 hidden sm:block">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Top Produtos */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Produtos do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProdutos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Nenhum pedido ainda hoje
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topProdutos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any, name: string) =>
                      name === "total" ? [formatCurrency(value), "Faturado"] : [value, "Qtd"]
                    }
                  />
                  <Bar dataKey="quantidade" fill="#f97316" radius={[4, 4, 0, 0]} name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estoque Crítico */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.materiaisAbaixoMin.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                ✅ Tudo em ordem
              </p>
            ) : (
              <div className="space-y-3">
                {data.materiaisAbaixoMin.map((mat) => (
                  <div key={mat.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{mat.nome}</p>
                      <p className="text-xs text-gray-400">
                        Mín: {Number(mat.quantidadeMin)} {mat.unidade}
                      </p>
                    </div>
                    <Badge variant="warning" className="flex-shrink-0">
                      {Number(mat.quantidadeAtual)} {mat.unidade}
                    </Badge>
                  </div>
                ))}
                <Link href="/estoque" className="block text-xs text-orange-600 hover:underline mt-2">
                  Ver todos →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Pedidos */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Últimos Pedidos
            <Link href="/pedidos" className="ml-auto text-xs text-orange-600 font-normal hover:underline">
              Ver todos →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.ultimosPedidos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-2">
              {data.ultimosPedidos.map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="text-sm font-bold text-gray-700 flex-shrink-0">#{pedido.numero}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {pedido.nomeCliente || "Sem id."}
                      </p>
                      <p className="text-xs text-gray-400 hidden sm:block">
                        {pedido.itens.length} item(s) • {formatDateTime(pedido.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(Number(pedido.total))}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium hidden sm:inline ${PEDIDO_STATUS_COLORS[pedido.status]}`}>
                      {PEDIDO_STATUS_LABELS[pedido.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

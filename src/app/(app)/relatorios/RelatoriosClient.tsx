"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Target, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, FORMA_PAGTO_LABELS, CATEGORIAS_LABELS } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4"];

export function RelatoriosClient() {
  const [tipo, setTipo] = useState("MENSAL");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataRef, setDataRef] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    setLoading(true);
    fetch(`/api/relatorios?tipo=${tipo}&data=${dataRef}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [tipo, dataRef]);

  const renderPeriodoLabel = () => {
    if (!data) return "";
    const start = new Date(data.periodo.start);
    const end = new Date(data.periodo.end);
    if (tipo === "DIARIO") return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (tipo === "SEMANAL")
      return `${format(start, "dd/MM", { locale: ptBR })} a ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
    return format(start, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border">
        <div>
          <Label className="text-xs">Período</Label>
          <div className="flex gap-1 mt-1">
            {["DIARIO", "SEMANAL", "MENSAL"].map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tipo === t ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t === "DIARIO" ? "Diário" : t === "SEMANAL" ? "Semanal" : "Mensal"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Data de Referência</Label>
          <Input
            type="date"
            value={dataRef}
            onChange={(e) => setDataRef(e.target.value)}
            className="w-44 mt-1"
          />
        </div>
        {data && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Período</p>
            <p className="font-semibold text-gray-800 capitalize">{renderPeriodoLabel()}</p>
          </div>
        )}
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Carregando relatório...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Faturamento",
                value: formatCurrency(data.resumo.totalEntradas),
                icon: DollarSign,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Despesas",
                value: formatCurrency(data.resumo.totalSaidas),
                icon: TrendingUp,
                color: "text-red-600",
                bg: "bg-red-50",
              },
              {
                label: "Lucro Líquido",
                value: formatCurrency(data.resumo.saldo),
                icon: Target,
                color: data.resumo.saldo >= 0 ? "text-blue-600" : "text-red-600",
                bg: data.resumo.saldo >= 0 ? "bg-blue-50" : "bg-red-50",
              },
              {
                label: "Pedidos",
                value: data.resumo.totalPedidos.toString(),
                icon: ShoppingBag,
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                label: "Ticket Médio",
                value: formatCurrency(data.resumo.ticketMedio),
                icon: ReceiptText,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                    <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="grafico">
            <TabsList>
              <TabsTrigger value="grafico">Gráfico Financeiro</TabsTrigger>
              <TabsTrigger value="produtos">Top Produtos</TabsTrigger>
              <TabsTrigger value="pagamentos">Formas de Pagamento</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>

            {/* Gráfico de Entradas x Saídas */}
            <TabsContent value="grafico">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Entradas × Saídas por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.grafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" fill="url(#colorEntradas)" strokeWidth={2} />
                      <Area type="monotone" dataKey="saidas" name="Saídas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Produtos */}
            <TabsContent value="produtos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topProdutos.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Sem dados de produtos neste período</p>
                  ) : (
                    <div className="space-y-3">
                      {data.topProdutos.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{p.nome}</span>
                              <span className="text-gray-500">{p.quantidade} un</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{
                                  width: `${(p.total / data.topProdutos[0].total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                            {formatCurrency(p.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Formas de Pagamento */}
            <TabsContent value="pagamentos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.formasPagto.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Sem dados de pagamento</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={data.formasPagto.map((f: any) => ({
                              name: FORMA_PAGTO_LABELS[f.formaPagto] || f.formaPagto,
                              value: Number(f._sum.total || 0),
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {data.formasPagto.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-3">
                        {data.formasPagto.map((f: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-sm font-medium">
                                {FORMA_PAGTO_LABELS[f.formaPagto] || f.formaPagto}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{formatCurrency(Number(f._sum.total || 0))}</p>
                              <p className="text-xs text-gray-400">{f._count} pedidos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Despesas por Categoria */}
            <TabsContent value="despesas">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.categorias.filter((c: any) => c.tipo === "SAIDA").length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Sem despesas no período</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={data.categorias
                          .filter((c: any) => c.tipo === "SAIDA")
                          .map((c: any) => ({
                            categoria: CATEGORIAS_LABELS[c.categoria] || c.categoria,
                            total: c.total,
                          }))
                          .sort((a: any, b: any) => b.total - a.total)}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 130, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11 }} width={130} />
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

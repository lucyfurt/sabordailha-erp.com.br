"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime, CATEGORIAS_LABELS, FORMA_PAGTO_LABELS } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";

const CATEGORIAS_ENTRADA = ["VENDA", "OUTROS_ENTRADA"];
const CATEGORIAS_SAIDA = [
  "COMPRA_MATERIAL", "SALARIO", "ALUGUEL", "AGUA", "LUZ",
  "GAS", "MANUTENCAO", "MARKETING", "OUTROS_SAIDA",
];

export function CaixaClient() {
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [resumo, setResumo] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [openNovo, setOpenNovo] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroInicio, setFiltroInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filtroFim, setFiltroFim] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({
    tipo: "ENTRADA",
    categoria: "",
    descricao: "",
    valor: "",
    formaPagto: "",
    referencia: "",
    observacao: "",
    dataMovimento: format(new Date(), "yyyy-MM-dd"),
  });

  const fetchMovimentos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroTipo) params.set("tipo", filtroTipo);
    if (filtroInicio) params.set("dataInicio", new Date(filtroInicio + "T00:00:00").toISOString());
    if (filtroFim) params.set("dataFim", new Date(filtroFim + "T23:59:59").toISOString());
    params.set("limit", "100");

    const res = await fetch(`/api/caixa?${params}`);
    const data = await res.json();
    setMovimentos(data.movimentos || []);
    setResumo(data.resumo || { entradas: 0, saidas: 0, saldo: 0 });
    setLoading(false);
  }, [filtroTipo, filtroInicio, filtroFim]);

  useEffect(() => { fetchMovimentos(); }, [fetchMovimentos]);

  const categorias = form.tipo === "ENTRADA" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  async function salvarMovimento() {
    if (!form.categoria || !form.descricao || !form.valor) return alert("Preencha todos os campos obrigatórios");

    const res = await fetch("/api/caixa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valor: parseFloat(form.valor.replace(",", ".")),
        dataMovimento: new Date(form.dataMovimento + "T12:00:00").toISOString(),
      }),
    });

    if (res.ok) {
      setOpenNovo(false);
      setForm({
        tipo: "ENTRADA", categoria: "", descricao: "", valor: "",
        formaPagto: "", referencia: "", observacao: "",
        dataMovimento: format(new Date(), "yyyy-MM-dd"),
      });
      fetchMovimentos();
    }
  }

  async function excluirMovimento(id: string) {
    if (!confirm("Excluir este movimento?")) return;
    await fetch(`/api/caixa/${id}`, { method: "DELETE" });
    fetchMovimentos();
  }

  return (
    <div className="space-y-6">
      {/* Resumo Cards — 3 colunas no mobile também, compacto */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div>
                <p className="text-xs text-gray-500">Entradas</p>
                <p className="text-base md:text-2xl font-bold text-green-600">{formatCurrency(resumo.entradas)}</p>
              </div>
              <div className="hidden md:flex p-3 bg-green-50 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div>
                <p className="text-xs text-gray-500">Saídas</p>
                <p className="text-base md:text-2xl font-bold text-red-600">{formatCurrency(resumo.saidas)}</p>
              </div>
              <div className="hidden md:flex p-3 bg-red-50 rounded-full">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
              <div>
                <p className="text-xs text-gray-500">Saldo</p>
                <p className={`text-base md:text-2xl font-bold ${resumo.saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatCurrency(resumo.saldo)}
                </p>
              </div>
              <div className={`hidden md:flex p-3 rounded-full ${resumo.saldo >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                <DollarSign className={`h-5 w-5 ${resumo.saldo >= 0 ? "text-blue-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Data Início</Label>
            <Input
              type="date"
              value={filtroInicio}
              onChange={(e) => setFiltroInicio(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-xs">Data Fim</Label>
            <Input
              type="date"
              value={filtroFim}
              onChange={(e) => setFiltroFim(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="ENTRADA">Entradas</SelectItem>
                <SelectItem value="SAIDA">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchMovimentos} variant="outline">
            <Filter className="h-4 w-4 mr-1" /> Filtrar
          </Button>
          <Button onClick={() => setOpenNovo(true)}>
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Tabela — scroll horizontal no mobile */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : movimentos.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Nenhum movimento no período</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden lg:table-cell">Usuário</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(mov.dataMovimento)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === "ENTRADA" ? "success" : "destructive"}>
                          {mov.tipo === "ENTRADA" ? "↑" : "↓"}
                          <span className="hidden sm:inline ml-1">{mov.tipo === "ENTRADA" ? "Entrada" : "Saída"}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">{CATEGORIAS_LABELS[mov.categoria]}</TableCell>
                      <TableCell className="text-sm max-w-[140px] truncate">{mov.descricao}</TableCell>
                      <TableCell className="text-xs text-gray-500 hidden md:table-cell">
                        {mov.formaPagto ? FORMA_PAGTO_LABELS[mov.formaPagto] : "-"}
                      </TableCell>
                      <TableCell className={`font-semibold whitespace-nowrap ${mov.tipo === "ENTRADA" ? "text-green-600" : "text-red-600"}`}>
                        {mov.tipo === "ENTRADA" ? "+" : "-"}{formatCurrency(Number(mov.valor))}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 hidden lg:table-cell">{mov.user?.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => excluirMovimento(mov.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo Lançamento */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento de Caixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v, categoria: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIAS_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Venda do almoço"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.dataMovimento}
                  onChange={(e) => setForm((f) => ({ ...f, dataMovimento: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.formaPagto} onValueChange={(v) => setForm((f) => ({ ...f, formaPagto: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGTO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referência / Nº Nota</Label>
              <Input
                placeholder="Número de nota, recibo, etc."
                value={form.referencia}
                onChange={(e) => setForm((f) => ({ ...f, referencia: e.target.value }))}
              />
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea
                rows={2}
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={salvarMovimento}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

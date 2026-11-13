"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, AlertTriangle, ArrowUp, ArrowDown, Settings2,
  Pencil, Trash2, BarChart2, History, ShoppingCart, Package,
  TrendingDown, DollarSign, ChevronRight,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Material = {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMin: number;
  custoUnitario?: number;
  custoMedio?: number;
  tamEmbalagem?: number;
  unidadeEmbalagem?: string;
  fornecedorId?: string;
  fornecedor?: { nome: string };
  movimentacoes: any[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const UNIDADES = ["kg", "g", "mg", "L", "ml", "un", "cx", "dz", "sc", "pc", "fardo", "bandeja", "garrafa", "lata", "pct"];
const UNIDADES_EMBALAGEM = ["kg", "g", "mg", "L", "ml", "un", "cx", "pct"];
const CATEGORIAS_MATERIAL = ["Ingrediente", "Embalagem", "Bebida", "Limpeza", "Outros"];

const TIPO_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  AJUSTE: "Ajuste",
  PERDA: "Perda",
  SOBRA: "Sobra",
  DESPERDICIO: "Desperdício",
};

const TIPO_CORES: Record<string, string> = {
  ENTRADA: "text-green-600",
  SAIDA: "text-red-500",
  AJUSTE: "text-blue-500",
  PERDA: "text-orange-500",
  SOBRA: "text-yellow-600",
  DESPERDICIO: "text-red-700",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function EstoqueClient() {
  const [aba, setAba] = useState("dashboard");
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [somenteCritico, setSomenteCritico] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  // Modais
  const [openNovo, setOpenNovo] = useState(false);
  const [openMov, setOpenMov] = useState<Material | null>(null);
  const [openEditar, setOpenEditar] = useState<Material | null>(null);
  const [openRemover, setOpenRemover] = useState<Material | null>(null);
  const [openHistorico, setOpenHistorico] = useState<Material | null>(null);
  const [historicoMat, setHistoricoMat] = useState<any[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);

  // Painel do dia
  const [openPainel, setOpenPainel] = useState(false);
  const [painelData, setPainelData] = useState<any>(null);
  const [painelLoading, setPainelLoading] = useState(false);
  const [painelDia, setPainelDia] = useState(() => new Date().toISOString().split("T")[0]);

  const formVazio = {
    nome: "", descricao: "", categoria: "Ingrediente", unidade: "kg",
    quantidadeMin: "0", custoUnitario: "", fornecedorId: "",
    tamEmbalagem: "", unidadeEmbalagem: "kg",
  };
  const [novoForm, setNovoForm] = useState(formVazio);
  const [editForm, setEditForm] = useState(formVazio);
  const [movForm, setMovForm] = useState({
    tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "",
    nrEmbalagens: "", tamEmbalagem: "",
  });
  const [removendo, setRemovendo] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchMateriais = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (somenteCritico) params.set("critico", "true");
      if (catFiltro) params.set("categoria", catFiltro);
      const res = await fetch(`/api/estoque?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMateriais(Array.isArray(data) ? data : []);
    } catch { setMateriais([]); }
    finally { setLoading(false); }
  }, [search, somenteCritico, catFiltro]);

  useEffect(() => { fetchMateriais(); }, [fetchMateriais]);

  useEffect(() => {
    fetch("/api/fornecedores").then((r) => r.json()).then(setFornecedores).catch(() => {});
  }, []);

  async function carregarPainel() {
    setPainelLoading(true);
    const res = await fetch(`/api/estoque/painel-dia?data=${painelDia}`);
    const data = await res.json();
    setPainelData(data);
    setPainelLoading(false);
  }

  useEffect(() => { if (openPainel) carregarPainel(); }, [openPainel, painelDia]);

  async function abrirHistorico(mat: Material) {
    setOpenHistorico(mat);
    setHistoricoLoading(true);
    const res = await fetch(`/api/estoque/${mat.id}`);
    const data = await res.json();
    setHistoricoMat(data.movimentacoes || []);
    setHistoricoLoading(false);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  function abrirEditar(mat: Material) {
    setEditForm({
      nome: mat.nome,
      descricao: mat.descricao || "",
      categoria: mat.categoria || "Ingrediente",
      unidade: mat.unidade,
      quantidadeMin: String(Number(mat.quantidadeMin)),
      custoUnitario: mat.custoUnitario ? String(Number(mat.custoUnitario)) : "",
      fornecedorId: mat.fornecedorId || "",
      tamEmbalagem: mat.tamEmbalagem ? String(Number(mat.tamEmbalagem)) : "",
      unidadeEmbalagem: mat.unidadeEmbalagem || mat.unidade,
    });
    setOpenEditar(mat);
  }

  async function criarMaterial() {
    if (!novoForm.nome || !novoForm.unidade) return alert("Preencha nome e unidade");
    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: novoForm.nome,
        descricao: novoForm.descricao || undefined,
        categoria: novoForm.categoria,
        unidade: novoForm.unidade,
        quantidadeMin: parseFloat(novoForm.quantidadeMin) || 0,
        custoUnitario: novoForm.custoUnitario ? parseFloat(novoForm.custoUnitario) : undefined,
        fornecedorId: novoForm.fornecedorId || undefined,
        tamEmbalagem: novoForm.tamEmbalagem ? parseFloat(novoForm.tamEmbalagem) : undefined,
        unidadeEmbalagem: novoForm.tamEmbalagem ? novoForm.unidadeEmbalagem : undefined,
      }),
    });
    if (res.ok) {
      setOpenNovo(false);
      setNovoForm(formVazio);
      fetchMateriais();
    } else {
      const err = await res.json().catch(() => null);
      alert(err?.error || "Erro ao criar material");
    }
  }

  async function salvarEdicao() {
    if (!openEditar) return;
    if (!editForm.nome || !editForm.unidade) return alert("Preencha nome e unidade");
    const res = await fetch(`/api/estoque/${openEditar.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: editForm.nome,
        descricao: editForm.descricao || undefined,
        categoria: editForm.categoria,
        unidade: editForm.unidade,
        quantidadeMin: parseFloat(editForm.quantidadeMin) || 0,
        custoUnitario: editForm.custoUnitario ? parseFloat(editForm.custoUnitario) : undefined,
        fornecedorId: editForm.fornecedorId || null,
        tamEmbalagem: editForm.tamEmbalagem ? parseFloat(editForm.tamEmbalagem) : null,
        unidadeEmbalagem: editForm.tamEmbalagem ? editForm.unidadeEmbalagem : null,
      }),
    });
    if (res.ok) { setOpenEditar(null); fetchMateriais(); }
    else { const err = await res.json(); alert(err.error || "Erro ao salvar"); }
  }

  async function confirmarRemover() {
    if (!openRemover) return;
    setRemovendo(true);
    const res = await fetch(`/api/estoque/${openRemover.id}`, { method: "DELETE" });
    setRemovendo(false);
    if (res.ok) { setOpenRemover(null); fetchMateriais(); }
    else { const err = await res.json(); alert(err.error || "Erro ao remover"); }
  }

  async function registrarMovimento() {
    const temEmbalagens = movForm.nrEmbalagens && (movForm.tamEmbalagem || (openMov as any)?.tamEmbalagem);
    if (!movForm.quantidade && !temEmbalagens) return alert("Informe a quantidade");

    let qtdFinal = 0;
    if (movForm.tipo === "ENTRADA" && temEmbalagens) {
      const tam = parseFloat(movForm.tamEmbalagem || String(Number((openMov as any).tamEmbalagem)));
      qtdFinal = parseFloat(movForm.nrEmbalagens) * tam;
    } else {
      qtdFinal = parseFloat(movForm.quantidade);
    }

    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mov",
        data: {
          materialId: openMov!.id,
          tipo: movForm.tipo,
          quantidade: qtdFinal,
          motivo: movForm.motivo || undefined,
          custoTotal: movForm.custoTotal ? parseFloat(movForm.custoTotal) : undefined,
        },
      }),
    });

    if (res.ok) {
      setOpenMov(null);
      setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" });
      fetchMateriais();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao registrar");
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  const isCritico = (m: Material) => Number(m.quantidadeAtual) <= Number(m.quantidadeMin) && Number(m.quantidadeMin) > 0;

  const stats = {
    total: materiais.length,
    criticos: materiais.filter(isCritico).length,
    valorTotal: materiais.reduce((s, m) => s + Number(m.quantidadeAtual) * Number(m.custoUnitario || 0), 0),
    semEstoque: materiais.filter((m) => Number(m.quantidadeAtual) === 0).length,
  };

  const criticosList = materiais.filter(isCritico);

  // ─── FormFields compartilhado ─────────────────────────────────────────────

  const FormFields = ({ form, setForm }: { form: typeof formVazio; setForm: (f: typeof formVazio) => void }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Nome *</Label>
          <Input placeholder="Ex: Arroz" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS_MATERIAL.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Input placeholder="Opcional" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Unidade do estoque *</Label>
          <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estoque mínimo ({form.unidade})</Label>
          <Input
            type="number" step="0.01" min="0" placeholder="Ex: 2"
            value={form.quantidadeMin}
            onChange={(e) => setForm({ ...form, quantidadeMin: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Custo unitário (R$/{form.unidade})</Label>
          <Input
            type="number" step="0.01" min="0" placeholder="Ex: 4,50"
            value={form.custoUnitario}
            onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
          />
        </div>
        <div>
          <Label>Fornecedor</Label>
          <Select value={form.fornecedorId} onValueChange={(v) => setForm({ ...form, fornecedorId: v })}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Embalagem padrão <span className="text-gray-400 font-normal text-xs">(tamanho + unidade)</span></Label>
        <div className="flex gap-2">
          <Input
            type="number" step="0.001" min="0" placeholder="Ex: 5"
            className="flex-1"
            value={form.tamEmbalagem}
            onChange={(e) => setForm({ ...form, tamEmbalagem: e.target.value })}
          />
          <Select value={form.unidadeEmbalagem} onValueChange={(v) => setForm({ ...form, unidadeEmbalagem: v })}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIDADES_EMBALAGEM.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.tamEmbalagem && (
          <p className="text-xs text-gray-400 mt-1">Pacote de {form.tamEmbalagem} {form.unidadeEmbalagem}</p>
        )}
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs value={aba} onValueChange={setAba}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="text-xs">📊 Visão Geral</TabsTrigger>
            <TabsTrigger value="produtos" className="text-xs">📦 Produtos</TabsTrigger>
            <TabsTrigger value="compras" className="text-xs relative">
              🛒 Comprar
              {stats.criticos > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{stats.criticos}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="painel" className="text-xs">📅 Painel do Dia</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" }); setOpenNovo(true); }}>
              <ArrowUp className="h-3.5 w-3.5 mr-1 text-green-600" /> Nova Entrada
            </Button>
            <Button size="sm" onClick={() => setOpenNovo(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar
            </Button>
          </div>
        </div>

        {/* ── ABA DASHBOARD ─────────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          {/* Cards de stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg"><Package className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Produtos</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 rounded-lg"><DollarSign className="h-4 w-4 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Valor em estoque</p>
                    <p className="text-base font-bold text-green-700 truncate">{formatCurrency(stats.valorTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={stats.criticos > 0 ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg"><AlertTriangle className="h-4 w-4 text-red-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Estoque baixo</p>
                    <p className="text-xl font-bold text-red-600">{stats.criticos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg"><TrendingDown className="h-4 w-4 text-orange-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Sem estoque</p>
                    <p className="text-xl font-bold text-orange-600">{stats.semEstoque}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de estoque baixo */}
          {criticosList.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Produtos que precisam ser comprados ({criticosList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {criticosList.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{mat.nome}</p>
                        <p className="text-xs text-gray-500">
                          Atual: <span className="text-red-600 font-semibold">{Number(mat.quantidadeAtual).toFixed(3)} {mat.unidade}</span>
                          {" / "}Mínimo: {Number(mat.quantidadeMin).toFixed(3)} {mat.unidade}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs"
                        onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" }); }}
                      >
                        <ArrowUp className="h-3 w-3 mr-1" /> Comprar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Por categoria */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-gray-700">Por categoria</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {CATEGORIAS_MATERIAL.map((cat) => {
                  const count = materiais.filter((m) => m.categoria === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => { setCatFiltro(cat); setAba("produtos"); }}
                      className="p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-lg text-center transition-colors"
                    >
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-gray-500">{cat}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA PRODUTOS ──────────────────────────────────────────────── */}
        <TabsContent value="produtos" className="space-y-3 mt-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={catFiltro} onValueChange={setCatFiltro}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Todas categorias" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {CATEGORIAS_MATERIAL.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={() => setSomenteCritico(!somenteCritico)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                somenteCritico ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
              }`}
            >
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Críticos
            </button>
          </div>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-center py-10 text-gray-400">Carregando...</p>
              ) : materiais.length === 0 ? (
                <p className="text-center py-10 text-gray-400">Nenhum produto encontrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                        <TableHead>Un.</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead className="hidden sm:table-cell">Mín.</TableHead>
                        <TableHead className="hidden md:table-cell">Preço/un.</TableHead>
                        <TableHead className="hidden md:table-cell">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materiais.map((mat) => (
                        <TableRow key={mat.id} className={isCritico(mat) ? "bg-red-50" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{mat.nome}</p>
                              {mat.descricao && <p className="text-xs text-gray-400 hidden sm:block">{mat.descricao}</p>}
                              {mat.tamEmbalagem && (
                                <p className="text-xs text-gray-400 hidden lg:block">
                                  Emb: {Number(mat.tamEmbalagem)}{mat.unidadeEmbalagem || mat.unidade}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 hidden sm:table-cell">{mat.categoria}</TableCell>
                          <TableCell className="text-sm">{mat.unidade}</TableCell>
                          <TableCell>
                            <span className={`font-semibold text-sm ${isCritico(mat) ? "text-red-600" : "text-gray-900"}`}>
                              {Number(mat.quantidadeAtual).toFixed(3)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 hidden sm:table-cell">
                            {Number(mat.quantidadeMin) > 0 ? Number(mat.quantidadeMin).toFixed(3) : "-"}
                          </TableCell>
                          <TableCell className="text-sm hidden md:table-cell">
                            {mat.custoUnitario
                              ? <span>{formatCurrency(Number(mat.custoUnitario))}<span className="text-gray-400 text-xs">/{mat.unidade}</span></span>
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-green-700 hidden md:table-cell">
                            {mat.custoUnitario ? formatCurrency(Number(mat.quantidadeAtual) * Number(mat.custoUnitario)) : "-"}
                          </TableCell>
                          <TableCell>
                            {Number(mat.quantidadeAtual) === 0 ? (
                              <Badge variant="destructive" className="text-xs">Zerado</Badge>
                            ) : isCritico(mat) ? (
                              <Badge variant="destructive" className="text-xs whitespace-nowrap">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Baixo</span>
                                <span className="sm:hidden">!</span>
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-xs">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="outline" className="h-7 w-7 text-green-600 border-green-200" title="Entrada"
                                onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" }); }}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-red-500 border-red-200" title="Saída"
                                onClick={() => { setOpenMov(mat); setMovForm({ tipo: "SAIDA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" }); }}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-gray-500" title="Histórico"
                                onClick={() => abrirHistorico(mat)}>
                                <History className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-blue-600 border-blue-200" title="Editar"
                                onClick={() => abrirEditar(mat)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-7 w-7 text-gray-400 hover:text-red-600 hover:border-red-200" title="Remover"
                                onClick={() => setOpenRemover(mat)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA COMPRAR ───────────────────────────────────────────────── */}
        <TabsContent value="compras" className="mt-4">
          {criticosList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum produto precisa ser comprado</p>
              <p className="text-sm mt-1">Todos os produtos estão acima do estoque mínimo</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{criticosList.length} produto(s) abaixo do estoque mínimo</p>
              <div className="grid gap-3">
                {criticosList.map((mat) => {
                  const falta = Math.max(0, Number(mat.quantidadeMin) - Number(mat.quantidadeAtual));
                  const sugerido = mat.tamEmbalagem
                    ? Math.ceil(falta / Number(mat.tamEmbalagem))
                    : null;
                  return (
                    <Card key={mat.id} className="border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{mat.nome}</p>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{mat.categoria}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-400">Atual</p>
                                <p className="font-semibold text-red-600">{Number(mat.quantidadeAtual).toFixed(3)} {mat.unidade}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Mínimo</p>
                                <p className="font-medium">{Number(mat.quantidadeMin).toFixed(3)} {mat.unidade}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Precisa comprar</p>
                                <p className="font-semibold text-orange-600">{falta.toFixed(3)} {mat.unidade}</p>
                              </div>
                              {sugerido !== null && (
                                <div>
                                  <p className="text-xs text-gray-400">Embalagens sugeridas</p>
                                  <p className="font-semibold text-blue-600">{sugerido} un de {Number(mat.tamEmbalagem)}{mat.unidadeEmbalagem || mat.unidade}</p>
                                </div>
                              )}
                            </div>
                            {mat.fornecedor && (
                              <p className="text-xs text-gray-400 mt-1">Fornecedor: {mat.fornecedor.nome}</p>
                            )}
                            {mat.custoUnitario && (
                              <p className="text-xs text-gray-400">
                                Custo estimado: {formatCurrency(falta * Number(mat.custoUnitario))}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                            onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "", nrEmbalagens: "", tamEmbalagem: "" }); }}
                          >
                            <ArrowUp className="h-3.5 w-3.5 mr-1" /> Registrar compra
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── ABA PAINEL DO DIA ─────────────────────────────────────────── */}
        <TabsContent value="painel" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Label>Data</Label>
            <Input type="date" value={painelDia} onChange={(e) => { setPainelDia(e.target.value); }} className="w-44" />
            <Button size="sm" onClick={carregarPainel} variant="outline">Atualizar</Button>
          </div>

          {painelLoading ? (
            <p className="text-center text-gray-400 py-8">Carregando...</p>
          ) : painelData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{painelData.totalPedidos}</p>
                    <p className="text-xs text-gray-500 mt-1">Pedidos concluídos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {painelData.vendas.reduce((s: number, v: any) => s + v.quantidade, 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Itens vendidos</p>
                  </CardContent>
                </Card>
              </div>

              {painelData.vendas.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">🍽️ Vendas por produto</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {painelData.vendas.map((v: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded text-sm">
                        <span>{v.nome}</span>
                        <div className="flex gap-3">
                          <span className="font-semibold">{v.quantidade}x</span>
                          <span className="text-green-600">{formatCurrency(v.total)}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {painelData.consumo.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">📦 Consumo de estoque</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {painelData.consumo.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-blue-50 rounded text-sm">
                        <span>{c.nome}</span>
                        <span className="font-semibold text-blue-700">{Number(c.consumido).toFixed(3)} {c.unidade}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {painelData.sobrasDesperdicios.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">⚠️ Sobras e desperdícios</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-1">
                    {painelData.sobrasDesperdicios.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-1.5 px-3 bg-yellow-50 rounded text-sm">
                        <span>{s.nome}</span>
                        <div className="flex gap-3 text-xs">
                          {s.sobra > 0 && <span className="text-yellow-700">Sobra: {Number(s.sobra).toFixed(3)} {s.unidade}</span>}
                          {s.desperdicio > 0 && <span className="text-red-600">Desp: {Number(s.desperdicio).toFixed(3)} {s.unidade}</span>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {painelData.vendas.length === 0 && painelData.consumo.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhum pedido concluído nesta data.</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Button onClick={carregarPainel}>Carregar dados do dia</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modal Novo Material ──────────────────────────────────────────── */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cadastrar Produto</DialogTitle></DialogHeader>
          <FormFields form={novoForm} setForm={setNovoForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={criarMaterial}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar ─────────────────────────────────────────────────── */}
      <Dialog open={!!openEditar} onOpenChange={() => setOpenEditar(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar — {openEditar?.nome}</DialogTitle></DialogHeader>
          <FormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditar(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Confirmar Remoção ───────────────────────────────────────── */}
      <Dialog open={!!openRemover} onOpenChange={() => setOpenRemover(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover produto</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja remover <span className="font-semibold">{openRemover?.nome}</span>?
            O item será desativado e não aparecerá mais no estoque.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarRemover} disabled={removendo}>
              {removendo ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Histórico ───────────────────────────────────────────────── */}
      <Dialog open={!!openHistorico} onOpenChange={() => setOpenHistorico(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico — {openHistorico?.nome}</DialogTitle>
          </DialogHeader>
          {historicoLoading ? (
            <p className="text-center py-6 text-gray-400">Carregando...</p>
          ) : historicoMat.length === 0 ? (
            <p className="text-center py-6 text-gray-400">Nenhuma movimentação registrada</p>
          ) : (
            <div className="space-y-1">
              {historicoMat.map((mov: any) => (
                <div key={mov.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                  <div>
                    <span className={`font-medium ${TIPO_CORES[mov.tipo]}`}>{TIPO_LABELS[mov.tipo]}</span>
                    {mov.motivo && <span className="text-gray-400 text-xs ml-2">— {mov.motivo}</span>}
                    <p className="text-xs text-gray-400">{formatDateTime(mov.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${mov.tipo === "ENTRADA" ? "text-green-600" : "text-red-500"}`}>
                      {mov.tipo === "ENTRADA" ? "+" : "-"}{Number(mov.quantidade).toFixed(3)} {openHistorico?.unidade}
                    </p>
                    {mov.custoTotal && <p className="text-xs text-gray-400">{formatCurrency(Number(mov.custoTotal))}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenHistorico(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Movimentação ────────────────────────────────────────────── */}
      <Dialog open={!!openMov} onOpenChange={() => setOpenMov(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar movimentação</DialogTitle></DialogHeader>
          {openMov && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{openMov.nome}</p>
                <p className="text-sm text-gray-500">
                  Estoque atual: <span className="font-semibold">{Number(openMov.quantidadeAtual).toFixed(3)} {openMov.unidade}</span>
                  {Number(openMov.quantidadeMin) > 0 && (
                    <span className="ml-2 text-xs text-gray-400">(mín: {Number(openMov.quantidadeMin).toFixed(3)})</span>
                  )}
                </p>
              </div>

              <div>
                <Label>Tipo de movimentação</Label>
                <Select value={movForm.tipo} onValueChange={(v) => setMovForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">📦 Entrada (compra/recebimento)</SelectItem>
                    <SelectItem value="SAIDA">↓ Saída (uso na cozinha)</SelectItem>
                    <SelectItem value="AJUSTE">🔧 Ajuste de inventário</SelectItem>
                    <SelectItem value="PERDA">🗑️ Perda / Descarte</SelectItem>
                    <SelectItem value="SOBRA">🍽️ Sobra do dia</SelectItem>
                    <SelectItem value="DESPERDICIO">⚠️ Desperdício</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {movForm.tipo === "ENTRADA" ? (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg space-y-3">
                  <p className="text-xs font-medium text-green-700">Por embalagens</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nº de embalagens</Label>
                      <Input
                        type="number" step="1" min="1" placeholder="Ex: 3"
                        value={movForm.nrEmbalagens}
                        onChange={(e) => setMovForm((f) => ({ ...f, nrEmbalagens: e.target.value, quantidade: "" }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tamanho cada ({openMov.unidadeEmbalagem || openMov.unidade})</Label>
                      <Input
                        type="number" step="0.001" min="0"
                        placeholder={openMov.tamEmbalagem ? String(Number(openMov.tamEmbalagem)) : "Ex: 5"}
                        value={movForm.tamEmbalagem || (openMov.tamEmbalagem ? String(Number(openMov.tamEmbalagem)) : "")}
                        onChange={(e) => setMovForm((f) => ({ ...f, tamEmbalagem: e.target.value, quantidade: "" }))}
                      />
                    </div>
                  </div>

                  {movForm.nrEmbalagens && (movForm.tamEmbalagem || openMov.tamEmbalagem) && (
                    <p className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                      Total: {(parseFloat(movForm.nrEmbalagens) * parseFloat(movForm.tamEmbalagem || String(Number(openMov.tamEmbalagem)))).toFixed(3)} {openMov.unidade}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex-1 border-t" />
                    <span>ou quantidade direta</span>
                    <div className="flex-1 border-t" />
                  </div>

                  <div>
                    <Label className="text-xs">Total ({openMov.unidade})</Label>
                    <Input
                      type="number" step="0.001" min="0"
                      value={
                        movForm.nrEmbalagens && (movForm.tamEmbalagem || openMov.tamEmbalagem)
                          ? String((parseFloat(movForm.nrEmbalagens) * parseFloat(movForm.tamEmbalagem || String(Number(openMov.tamEmbalagem)))).toFixed(3))
                          : movForm.quantidade
                      }
                      onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value, nrEmbalagens: "", tamEmbalagem: "" }))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Valor total pago (R$)</Label>
                    <Input
                      type="number" step="0.01" min="0" placeholder="Ex: 25,00"
                      value={movForm.custoTotal}
                      onChange={(e) => setMovForm((f) => ({ ...f, custoTotal: e.target.value }))}
                    />
                  </div>
                  {movForm.custoTotal && (movForm.nrEmbalagens || movForm.quantidade) && (() => {
                    const qtd = movForm.nrEmbalagens && (movForm.tamEmbalagem || openMov.tamEmbalagem)
                      ? parseFloat(movForm.nrEmbalagens) * parseFloat(movForm.tamEmbalagem || String(Number(openMov.tamEmbalagem)))
                      : parseFloat(movForm.quantidade);
                    return qtd > 0 ? (
                      <p className="text-xs text-green-700 font-medium">
                        Custo/{openMov.unidade}: {formatCurrency(parseFloat(movForm.custoTotal) / qtd)}
                      </p>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div>
                  <Label>Quantidade ({openMov.unidade}) *</Label>
                  <Input
                    type="number" step="0.001" min="0"
                    value={movForm.quantidade}
                    onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Motivo / Observação</Label>
                <Input
                  placeholder="Opcional"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm((f) => ({ ...f, motivo: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMov(null)}>Cancelar</Button>
            <Button
              className={movForm.tipo === "ENTRADA" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              onClick={registrarMovimento}
            >
              {movForm.tipo === "ENTRADA" ? "Registrar entrada" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

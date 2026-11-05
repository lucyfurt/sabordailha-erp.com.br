"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Pencil, ToggleLeft, ToggleRight,
  Tag, Trash2, UtensilsCrossed, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Categoria = {
  id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  ativo: boolean;
  _count?: { produtos: number };
};

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
  categoria: { id: string; nome: string; icone?: string };
  custoEstimado?: number;
};

// ─── Emojis sugeridos para ícone ─────────────────────────────────────────────
const ICONES_SUGERIDOS = [
  "🍽️", "🦐", "🐟", "🦀", "🦑", "🍤", "🥗", "🥤", "🍹",
  "🍨", "🍰", "🥩", "🍲", "🫕", "🌮", "🥙", "🍜", "☕",
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ProdutosClient() {
  const [activeTab, setActiveTab] = useState("produtos");

  // ── Produtos state ──
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [openProdForm, setOpenProdForm] = useState(false);
  const [editandoProd, setEditandoProd] = useState<Produto | null>(null);
  const [prodForm, setProdForm] = useState({
    nome: "", descricao: "", preco: "", categoriaId: "", custoEstimado: "",
  });

  // ── Categorias state ──
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [openCatForm, setOpenCatForm] = useState(false);
  const [editandoCat, setEditandoCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState({ nome: "", descricao: "", icone: "" });
  const [catErro, setCatErro] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null);

  // ── Fetch ──
  const fetchCategorias = useCallback(async () => {
    setLoadingCat(true);
    const res = await fetch("/api/produtos/categorias");
    const data = await res.json();
    setCategorias(Array.isArray(data) ? data : []);
    setLoadingCat(false);
  }, []);

  const fetchProdutos = useCallback(async () => {
    setLoadingProd(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (catFiltro) params.set("categoriaId", catFiltro);
    const res = await fetch(`/api/produtos?${params}`);
    const data = await res.json();
    setProdutos(Array.isArray(data) ? data : []);
    setLoadingProd(false);
  }, [search, catFiltro]);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);
  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  // ── Produto handlers ──
  function abrirProdForm(produto?: Produto) {
    if (produto) {
      setEditandoProd(produto);
      setProdForm({
        nome: produto.nome,
        descricao: produto.descricao || "",
        preco: String(produto.preco),
        categoriaId: produto.categoria.id,
        custoEstimado: produto.custoEstimado ? String(produto.custoEstimado) : "",
      });
    } else {
      setEditandoProd(null);
      setProdForm({ nome: "", descricao: "", preco: "", categoriaId: "", custoEstimado: "" });
    }
    setOpenProdForm(true);
  }

  async function salvarProduto() {
    if (!prodForm.nome || !prodForm.preco || !prodForm.categoriaId)
      return alert("Preencha os campos obrigatórios");

    const payload = {
      nome: prodForm.nome,
      descricao: prodForm.descricao || undefined,
      preco: parseFloat(prodForm.preco),
      categoriaId: prodForm.categoriaId,
      custoEstimado: prodForm.custoEstimado ? parseFloat(prodForm.custoEstimado) : undefined,
    };

    const url = editandoProd ? `/api/produtos/${editandoProd.id}` : "/api/produtos";
    const method = editandoProd ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpenProdForm(false);
      fetchProdutos();
    }
  }

  async function toggleAtivo(produto: Produto) {
    await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !produto.ativo }),
    });
    fetchProdutos();
  }

  const margem = (p: Produto) => {
    if (!p.custoEstimado || p.custoEstimado === 0) return null;
    return (((Number(p.preco) - Number(p.custoEstimado)) / Number(p.preco)) * 100).toFixed(0);
  };

  // ── Categoria handlers ──
  function abrirCatForm(cat?: Categoria) {
    setCatErro("");
    if (cat) {
      setEditandoCat(cat);
      setCatForm({ nome: cat.nome, descricao: cat.descricao || "", icone: cat.icone || "" });
    } else {
      setEditandoCat(null);
      setCatForm({ nome: "", descricao: "", icone: "" });
    }
    setOpenCatForm(true);
  }

  async function salvarCategoria() {
    setCatErro("");
    if (!catForm.nome.trim()) { setCatErro("Nome é obrigatório"); return; }

    const url = editandoCat
      ? `/api/produtos/categorias/${editandoCat.id}`
      : "/api/produtos/categorias";
    const method = editandoCat ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: catForm.nome.trim(),
        descricao: catForm.descricao || undefined,
        icone: catForm.icone || undefined,
      }),
    });

    if (res.ok) {
      setOpenCatForm(false);
      fetchCategorias();
      fetchProdutos(); // atualiza nomes de categoria nos produtos
    } else {
      const err = await res.json();
      setCatErro(err.error || "Erro ao salvar");
    }
  }

  async function excluirCategoria(cat: Categoria) {
    const res = await fetch(`/api/produtos/categorias/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(null);
      fetchCategorias();
      fetchProdutos();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao remover categoria");
      setConfirmDelete(null);
    }
  }

  // ── Remover produto ──
  const [confirmDeleteProd, setConfirmDeleteProd] = useState<Produto | null>(null);
  const [removendoProd, setRemovendoProd] = useState(false);

  async function removerProduto() {
    if (!confirmDeleteProd) return;
    setRemovendoProd(true);
    const res = await fetch(`/api/produtos/${confirmDeleteProd.id}`, { method: "DELETE" });
    setRemovendoProd(false);
    if (res.ok) {
      setConfirmDeleteProd(null);
      fetchProdutos();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao remover produto");
    }
  }

  // ── Agrupamento por categoria ──
  const grupos = categorias.reduce((acc, cat) => {
    const prods = produtos.filter((p) => p.categoria.id === cat.id);
    if (prods.length > 0) acc[cat.nome] = { ...cat, prods };
    return acc;
  }, {} as Record<string, any>);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="produtos" className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Categorias
              <span className="ml-1 bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {categorias.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Botão de ação contextual */}
          {activeTab === "produtos" && (
            <Button size="sm" onClick={() => abrirProdForm()}>
              <Plus className="h-4 w-4 mr-1" /> Novo Produto
            </Button>
          )}
          {activeTab === "categorias" && (
            <Button size="sm" onClick={() => abrirCatForm()}>
              <Plus className="h-4 w-4 mr-1" /> Nova Categoria
            </Button>
          )}
        </div>

        {/* ── ABA PRODUTOS ─────────────────────────────────────────────────── */}
        <TabsContent value="produtos" className="mt-4 space-y-4">
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
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icone} {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid de produtos por categoria */}
          {loadingProd ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grupos).map(([catNome, grupo]: any) => (
                <div key={catNome}>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    {grupo.icone && <span>{grupo.icone}</span>}
                    {catNome}
                    <span className="text-xs font-normal text-gray-400">
                      ({grupo.prods.length})
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {grupo.prods.map((produto: Produto) => (
                      <Card
                        key={produto.id}
                        className={`hover:shadow-md transition-shadow ${!produto.ativo ? "opacity-60" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm leading-tight">{produto.nome}</h4>
                            <Badge
                              variant={produto.ativo ? "success" : "secondary"}
                              className="text-xs ml-1 flex-shrink-0"
                            >
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {produto.descricao && (
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                              {produto.descricao}
                            </p>
                          )}
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(Number(produto.preco))}
                              </p>
                              {margem(produto) && (
                                <p className="text-xs text-green-600">Margem: {margem(produto)}%</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => abrirProdForm(produto)}
                                title="Editar produto"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-7 w-7 ${produto.ativo ? "text-red-400" : "text-green-500"}`}
                                onClick={() => toggleAtivo(produto)}
                                title={produto.ativo ? "Desativar" : "Ativar"}
                              >
                                {produto.ativo
                                  ? <ToggleRight className="h-4 w-4" />
                                  : <ToggleLeft className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gray-400 hover:text-red-600"
                                onClick={() => setConfirmDeleteProd(produto)}
                                title="Remover produto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              {produtos.length === 0 && (
                <p className="text-center py-10 text-gray-400">Nenhum produto encontrado</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── ABA CATEGORIAS ───────────────────────────────────────────────── */}
        <TabsContent value="categorias" className="mt-4">
          {loadingCat ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : categorias.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma categoria ainda</p>
              <p className="text-sm mt-1">Crie a primeira para organizar seu cardápio</p>
              <Button className="mt-4" onClick={() => abrirCatForm()}>
                <Plus className="h-4 w-4 mr-1" /> Nova Categoria
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorias.map((cat) => (
                <Card key={cat.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      {/* Ícone + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-2xl flex-shrink-0">
                          {cat.icone || "📦"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{cat.nome}</p>
                          {cat.descricao && (
                            <p className="text-xs text-gray-400 truncate">{cat.descricao}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cat._count?.produtos ?? 0} produto(s)
                          </p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-orange-600"
                          onClick={() => abrirCatForm(cat)}
                          title="Editar categoria"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={() => setConfirmDelete(cat)}
                          title="Remover categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modal Produto ──────────────────────────────────────────────────── */}
      <Dialog open={openProdForm} onOpenChange={setOpenProdForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoProd ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={prodForm.nome}
                onChange={(e) => setProdForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Moqueca de Camarão"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={prodForm.descricao}
                onChange={(e) => setProdForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descrição breve do produto..."
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select
                value={prodForm.categoriaId}
                onValueChange={(v) => setProdForm((f) => ({ ...f, categoriaId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icone} {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Preço de Venda (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={prodForm.preco}
                  onChange={(e) => setProdForm((f) => ({ ...f, preco: e.target.value }))}
                />
              </div>
              <div>
                <Label>Custo Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Para calcular margem"
                  value={prodForm.custoEstimado}
                  onChange={(e) => setProdForm((f) => ({ ...f, custoEstimado: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProdForm(false)}>Cancelar</Button>
            <Button onClick={salvarProduto}>{editandoProd ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Confirmar Remoção de Produto ───────────────────────────── */}
      <Dialog open={!!confirmDeleteProd} onOpenChange={() => setConfirmDeleteProd(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Produto</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Tem certeza que deseja remover{" "}
              <strong>{confirmDeleteProd?.nome}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteProd(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={removerProduto} disabled={removendoProd}>
              <Trash2 className="h-4 w-4 mr-1" />
              {removendoProd ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Categoria (add / editar) ────────────────────────────────── */}
      <Dialog open={openCatForm} onOpenChange={(v) => { setOpenCatForm(v); setCatErro(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editandoCat ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Frutos do Mar"
                value={catForm.nome}
                onChange={(e) => setCatForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição opcional"
                value={catForm.descricao}
                onChange={(e) => setCatForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            <div>
              <Label>Ícone (emoji)</Label>
              {/* Grade de emojis sugeridos */}
              <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                {ICONES_SUGERIDOS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setCatForm((f) => ({ ...f, icone: emoji }))}
                    className={`text-xl p-1 rounded-lg border transition-colors ${
                      catForm.icone === emoji
                        ? "border-orange-400 bg-orange-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Ou digite outro emoji: 🍕"
                value={catForm.icone}
                onChange={(e) => setCatForm((f) => ({ ...f, icone: e.target.value }))}
                className="text-lg"
              />
            </div>

            {/* Preview */}
            {catForm.nome && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-2xl">
                  {catForm.icone || "📦"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{catForm.nome}</p>
                  {catForm.descricao && (
                    <p className="text-xs text-gray-400">{catForm.descricao}</p>
                  )}
                </div>
              </div>
            )}

            {/* Erro */}
            {catErro && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {catErro}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenCatForm(false); setCatErro(""); }}>
              Cancelar
            </Button>
            <Button onClick={salvarCategoria}>
              {editandoCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Confirmar Exclusão ──────────────────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Tem certeza que deseja remover a categoria{" "}
                <strong>{confirmDelete?.nome}</strong>?
              </p>
            </div>
            <p className="text-xs text-gray-500">
              A remoção é bloqueada se houver produtos ativos nesta categoria.
              Produtos inativos não impedem a remoção.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && excluirCategoria(confirmDelete)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

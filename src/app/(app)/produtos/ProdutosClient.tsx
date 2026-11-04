"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type Produto = {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  ativo: boolean;
  categoria: { id: string; nome: string; icone?: string };
  custoEstimado?: number;
};

type Categoria = { id: string; nome: string; icone?: string };

export function ProdutosClient() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: "", descricao: "", preco: "", categoriaId: "", custoEstimado: "",
  });

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (catFiltro) params.set("categoriaId", catFiltro);
    const res = await fetch(`/api/produtos?${params}`);
    const data = await res.json();
    setProdutos(data);
    setLoading(false);
  }, [search, catFiltro]);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  useEffect(() => {
    fetch("/api/produtos/categorias").then((r) => r.json()).then(setCategorias);
  }, []);

  function abrirForm(produto?: Produto) {
    if (produto) {
      setEditando(produto);
      setForm({
        nome: produto.nome,
        descricao: produto.descricao || "",
        preco: String(produto.preco),
        categoriaId: produto.categoria.id,
        custoEstimado: produto.custoEstimado ? String(produto.custoEstimado) : "",
      });
    } else {
      setEditando(null);
      setForm({ nome: "", descricao: "", preco: "", categoriaId: "", custoEstimado: "" });
    }
    setOpenForm(true);
  }

  async function salvar() {
    if (!form.nome || !form.preco || !form.categoriaId) return alert("Preencha os campos obrigatórios");

    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      preco: parseFloat(form.preco),
      categoriaId: form.categoriaId,
      custoEstimado: form.custoEstimado ? parseFloat(form.custoEstimado) : undefined,
    };

    const url = editando ? `/api/produtos/${editando.id}` : "/api/produtos";
    const method = editando ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpenForm(false);
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

  // Agrupar por categoria
  const grupos = categorias.reduce((acc, cat) => {
    const prods = produtos.filter((p) => p.categoria.id === cat.id);
    if (prods.length > 0) acc[cat.nome] = { ...cat, prods };
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={catFiltro} onValueChange={setCatFiltro}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.icone} {c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => abrirForm()}>
          <Plus className="h-4 w-4 mr-1" /> Novo Produto
        </Button>
      </div>

      {/* Grid de Produtos por Categoria */}
      {loading ? (
        <p className="text-center py-10 text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([catNome, grupo]: any) => (
            <div key={catNome}>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                {grupo.icone && <span>{grupo.icone}</span>}
                {catNome}
                <span className="text-xs font-normal text-gray-400">({grupo.prods.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {grupo.prods.map((produto: Produto) => (
                  <Card key={produto.id} className={`hover:shadow-md transition-shadow ${!produto.ativo ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm leading-tight">{produto.nome}</h4>
                        <Badge variant={produto.ativo ? "success" : "secondary"} className="text-xs ml-1 flex-shrink-0">
                          {produto.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {produto.descricao && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{produto.descricao}</p>
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
                            onClick={() => abrirForm(produto)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 ${produto.ativo ? "text-red-400" : "text-green-500"}`}
                            onClick={() => toggleAtivo(produto)}
                          >
                            {produto.ativo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
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

      {/* Modal Form */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={form.categoriaId} onValueChange={(v) => setForm((f) => ({ ...f, categoriaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icone} {c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço de Venda (R$) *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.preco}
                  onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
                />
              </div>
              <div>
                <Label>Custo Estimado (R$)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  placeholder="Para calcular margem"
                  value={form.custoEstimado}
                  onChange={(e) => setForm((f) => ({ ...f, custoEstimado: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

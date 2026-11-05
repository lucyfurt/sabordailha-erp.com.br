"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown, Settings2, Pencil, Trash2 } from "lucide-react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

type Material = {
  id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMin: number;
  custoUnitario?: number;
  fornecedorId?: string;
  fornecedor?: { nome: string };
  movimentacoes: any[];
};

const UNIDADES = ["kg", "g", "L", "ml", "un", "cx", "dz", "sc", "pc"];

export function EstoqueClient() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [somenteCritico, setSomenteCritico] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  // Modais
  const [openNovo, setOpenNovo] = useState(false);
  const [openMov, setOpenMov] = useState<Material | null>(null);
  const [openEditar, setOpenEditar] = useState<Material | null>(null);
  const [openRemover, setOpenRemover] = useState<Material | null>(null);

  const [novoForm, setNovoForm] = useState({
    nome: "", descricao: "", unidade: "kg",
    quantidadeMin: "0", custoUnitario: "", fornecedorId: "",
  });
  const [editForm, setEditForm] = useState({
    nome: "", descricao: "", unidade: "kg",
    quantidadeMin: "0", custoUnitario: "", fornecedorId: "",
  });
  const [movForm, setMovForm] = useState({
    tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "",
  });
  const [removendo, setRemovendo] = useState(false);

  const fetchMateriais = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (somenteCritico) params.set("critico", "true");
    const res = await fetch(`/api/estoque?${params}`);
    const data = await res.json();
    setMateriais(data);
    setLoading(false);
  }, [search, somenteCritico]);

  useEffect(() => { fetchMateriais(); }, [fetchMateriais]);

  useEffect(() => {
    fetch("/api/fornecedores").then((r) => r.json()).then(setFornecedores);
  }, []);

  // Abre modal de edição preenchendo os campos com os dados do material
  function abrirEditar(mat: Material) {
    setEditForm({
      nome: mat.nome,
      descricao: mat.descricao || "",
      unidade: mat.unidade,
      quantidadeMin: String(Number(mat.quantidadeMin)),
      custoUnitario: mat.custoUnitario ? String(Number(mat.custoUnitario)) : "",
      fornecedorId: mat.fornecedorId || "",
    });
    setOpenEditar(mat);
  }

  async function criarMaterial() {
    if (!novoForm.nome || !novoForm.unidade) return alert("Preencha nome e unidade");
    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoForm,
        quantidadeMin: parseFloat(novoForm.quantidadeMin) || 0,
        custoUnitario: novoForm.custoUnitario ? parseFloat(novoForm.custoUnitario) : undefined,
        fornecedorId: novoForm.fornecedorId || undefined,
      }),
    });
    if (res.ok) {
      setOpenNovo(false);
      setNovoForm({ nome: "", descricao: "", unidade: "kg", quantidadeMin: "0", custoUnitario: "", fornecedorId: "" });
      fetchMateriais();
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
        unidade: editForm.unidade,
        quantidadeMin: parseFloat(editForm.quantidadeMin) || 0,
        custoUnitario: editForm.custoUnitario ? parseFloat(editForm.custoUnitario) : undefined,
        fornecedorId: editForm.fornecedorId || null,
      }),
    });
    if (res.ok) {
      setOpenEditar(null);
      fetchMateriais();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao salvar");
    }
  }

  async function confirmarRemover() {
    if (!openRemover) return;
    setRemovendo(true);
    const res = await fetch(`/api/estoque/${openRemover.id}`, { method: "DELETE" });
    setRemovendo(false);
    if (res.ok) {
      setOpenRemover(null);
      fetchMateriais();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao remover");
    }
  }

  async function registrarMovimento() {
    if (!movForm.quantidade) return alert("Informe a quantidade");
    const res = await fetch("/api/estoque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mov",
        data: {
          materialId: openMov!.id,
          tipo: movForm.tipo,
          quantidade: parseFloat(movForm.quantidade),
          motivo: movForm.motivo || undefined,
          custoTotal: movForm.custoTotal ? parseFloat(movForm.custoTotal) : undefined,
        },
      }),
    });

    if (res.ok) {
      setOpenMov(null);
      setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "" });
      fetchMateriais();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao registrar");
    }
  }

  const isCritico = (m: Material) => Number(m.quantidadeAtual) <= Number(m.quantidadeMin);

  const stats = {
    total: materiais.length,
    criticos: materiais.filter(isCritico).length,
    valorTotal: materiais.reduce((s, m) => s + Number(m.quantidadeAtual) * Number(m.custoUnitario || 0), 0),
  };

  // Campo reutilizável para formulários de novo/edição
  const FormFields = ({ form, setForm }: { form: typeof novoForm; setForm: (f: typeof novoForm) => void }) => (
    <>
      <div>
        <Label>Nome *</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Unidade *</Label>
          <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Qtd. Mínima</Label>
          <Input
            type="number" step="0.01" min="0"
            value={form.quantidadeMin}
            onChange={(e) => setForm({ ...form, quantidadeMin: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Custo Unitário (R$)</Label>
          <Input
            type="number" step="0.01" min="0"
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
    </>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <Settings2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Total</p>
              <p className="text-lg md:text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-red-50 rounded-lg flex-shrink-0">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Crítico</p>
              <p className="text-lg md:text-xl font-bold text-red-600">{stats.criticos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-50 rounded-lg flex-shrink-0">
              <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Valor</p>
              <p className="text-base md:text-xl font-bold truncate">{formatCurrency(stats.valorTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSomenteCritico(!somenteCritico)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              somenteCritico
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Críticos
          </button>
          <Button onClick={() => setOpenNovo(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Novo Material</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : materiais.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Nenhum material encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
                    <TableHead>Un.</TableHead>
                    <TableHead>Atual</TableHead>
                    <TableHead className="hidden sm:table-cell">Mínimo</TableHead>
                    <TableHead className="hidden lg:table-cell">Custo</TableHead>
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
                          {mat.descricao && (
                            <p className="text-xs text-gray-400 hidden sm:block">{mat.descricao}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden md:table-cell">
                        {mat.fornecedor?.nome || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{mat.unidade}</TableCell>
                      <TableCell>
                        <span className={`font-semibold text-sm ${isCritico(mat) ? "text-red-600" : "text-gray-900"}`}>
                          {Number(mat.quantidadeAtual).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                        {Number(mat.quantidadeMin).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {mat.custoUnitario ? formatCurrency(Number(mat.custoUnitario)) : "-"}
                      </TableCell>
                      <TableCell>
                        {isCritico(mat) ? (
                          <Badge variant="destructive" className="text-xs whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Crítico</span>
                            <span className="sm:hidden">!</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {/* Entrada */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden sm:flex text-green-600 border-green-200 hover:bg-green-50 text-xs"
                            onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "" }); }}
                          >
                            <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="sm:hidden h-8 w-8 text-green-600 border-green-200"
                            onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "" }); }}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>

                          {/* Saída */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden sm:flex text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            onClick={() => { setOpenMov(mat); setMovForm({ tipo: "SAIDA", quantidade: "", motivo: "", custoTotal: "" }); }}
                          >
                            <ArrowDown className="h-3 w-3 mr-1" /> Saída
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="sm:hidden h-8 w-8 text-red-600 border-red-200"
                            onClick={() => { setOpenMov(mat); setMovForm({ tipo: "SAIDA", quantidade: "", motivo: "", custoTotal: "" }); }}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>

                          {/* Editar */}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Editar material"
                            onClick={() => abrirEditar(mat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Remover */}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-gray-400 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            title="Remover material"
                            onClick={() => setOpenRemover(mat)}
                          >
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

      {/* Modal Novo Material */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormFields form={novoForm} setForm={setNovoForm} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={criarMaterial}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Material */}
      <Dialog open={!!openEditar} onOpenChange={() => setOpenEditar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormFields form={editForm} setForm={setEditForm} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEditar(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Remoção */}
      <Dialog open={!!openRemover} onOpenChange={() => setOpenRemover(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Material</DialogTitle>
          </DialogHeader>
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

      {/* Modal Movimentação */}
      <Dialog open={!!openMov} onOpenChange={() => setOpenMov(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
          </DialogHeader>
          {openMov && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{openMov.nome}</p>
                <p className="text-sm text-gray-500">
                  Atual: {Number(openMov.quantidadeAtual).toFixed(2)} {openMov.unidade}
                </p>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={movForm.tipo} onValueChange={(v) => setMovForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada (compra/recebimento)</SelectItem>
                    <SelectItem value="SAIDA">Saída (uso)</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste (acertar inventário)</SelectItem>
                    <SelectItem value="PERDA">Perda / Descarte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantidade ({openMov.unidade}) *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={movForm.quantidade}
                  onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value }))}
                />
              </div>

              {movForm.tipo === "ENTRADA" && (
                <div>
                  <Label>Custo Total da Compra (R$)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    placeholder="Opcional — lançará saída no caixa"
                    value={movForm.custoTotal}
                    onChange={(e) => setMovForm((f) => ({ ...f, custoTotal: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Motivo / Observação</Label>
                <Input
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
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

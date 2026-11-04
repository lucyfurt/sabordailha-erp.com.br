"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, AlertTriangle, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type Material = {
  id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMin: number;
  custoUnitario?: number;
  fornecedor?: { nome: string };
  movimentacoes: any[];
};

export function EstoqueClient() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [somenteCritico, setSomenteCritico] = useState(false);
  const [openNovo, setOpenNovo] = useState(false);
  const [openMov, setOpenMov] = useState<Material | null>(null);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [novoForm, setNovoForm] = useState({
    nome: "", descricao: "", unidade: "kg",
    quantidadeMin: "0", custoUnitario: "", fornecedorId: "",
  });
  const [movForm, setMovForm] = useState({
    tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "",
  });

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total de Itens</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Estoque Crítico</p>
              <p className="text-xl font-bold text-red-600">{stats.criticos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Valor em Estoque</p>
              <p className="text-xl font-bold">{formatCurrency(stats.valorTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setSomenteCritico(!somenteCritico)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            somenteCritico
              ? "bg-red-500 text-white border-red-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Somente Críticos
        </button>
        <Button onClick={() => setOpenNovo(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Material
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-400">Carregando...</p>
          ) : materiais.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Nenhum material encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Qtd. Atual</TableHead>
                  <TableHead>Qtd. Mínima</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.map((mat) => (
                  <TableRow key={mat.id} className={isCritico(mat) ? "bg-red-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mat.nome}</p>
                        {mat.descricao && <p className="text-xs text-gray-400">{mat.descricao}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {mat.fornecedor?.nome || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{mat.unidade}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${isCritico(mat) ? "text-red-600" : "text-gray-900"}`}>
                        {Number(mat.quantidadeAtual).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {Number(mat.quantidadeMin).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mat.custoUnitario ? formatCurrency(Number(mat.custoUnitario)) : "-"}
                    </TableCell>
                    <TableCell>
                      {isCritico(mat) ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Crítico
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                          onClick={() => { setOpenMov(mat); setMovForm({ tipo: "ENTRADA", quantidade: "", motivo: "", custoTotal: "" }); }}
                        >
                          <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                          onClick={() => { setOpenMov(mat); setMovForm({ tipo: "SAIDA", quantidade: "", motivo: "", custoTotal: "" }); }}
                        >
                          <ArrowDown className="h-3 w-3 mr-1" /> Saída
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <div>
              <Label>Nome *</Label>
              <Input value={novoForm.nome} onChange={(e) => setNovoForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={novoForm.descricao} onChange={(e) => setNovoForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unidade *</Label>
                <Select value={novoForm.unidade} onValueChange={(v) => setNovoForm((f) => ({ ...f, unidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "L", "ml", "un", "cx", "dz", "sc", "pc"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qtd. Mínima</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={novoForm.quantidadeMin}
                  onChange={(e) => setNovoForm((f) => ({ ...f, quantidadeMin: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Custo Unitário (R$)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={novoForm.custoUnitario}
                  onChange={(e) => setNovoForm((f) => ({ ...f, custoUnitario: e.target.value }))}
                />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select value={novoForm.fornecedorId} onValueChange={(v) => setNovoForm((f) => ({ ...f, fornecedorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={criarMaterial}>Salvar</Button>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, ChefHat, CheckCircle, XCircle, CreditCard, Trash2, Truck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrency, formatDateTime, PEDIDO_STATUS_LABELS,
  PEDIDO_STATUS_COLORS, FORMA_PAGTO_LABELS, FORMA_ENTREGA_LABELS, FORMA_ENTREGA_COLORS,
} from "@/lib/utils";

type Produto = { id: string; nome: string; preco: number; categoria: { nome: string } };
type ItemForm = { produtoId: string; quantidade: number; observacao: string };

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  ABERTO: [
    { label: "Iniciar Preparo", next: "EM_PREPARO", icon: ChefHat, color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Cancelar", next: "CANCELADO", icon: XCircle, color: "bg-red-500 hover:bg-red-600" },
  ],
  EM_PREPARO: [
    { label: "Marcar Pronto", next: "PRONTO", icon: CheckCircle, color: "bg-green-500 hover:bg-green-600" },
    { label: "Cancelar", next: "CANCELADO", icon: XCircle, color: "bg-red-500 hover:bg-red-600" },
  ],
  PRONTO: [
    { label: "Entregar", next: "ENTREGUE", icon: CheckCircle, color: "bg-blue-500 hover:bg-blue-600" },
  ],
  ENTREGUE: [
    { label: "Registrar Pagamento", next: "PAGO", icon: CreditCard, color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
};

export function PedidosClient() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState("");
  const [openNovo, setOpenNovo] = useState(false);
  const [openPagto, setOpenPagto] = useState<{ pedido: any; next: string } | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formaPagto, setFormaPagto] = useState("DINHEIRO");
  const [novoForm, setNovoForm] = useState({
    mesa: "", nomeCliente: "", observacao: "",
    formaEntrega: "RETIRADA" as "RETIRADA" | "DELIVERY",
    enderecoEntrega: "",
    itens: [{ produtoId: "", quantidade: 1, observacao: "" }] as ItemForm[],
  });

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const qs = statusFiltro ? `?status=${statusFiltro}` : "";
    const res = await fetch(`/api/pedidos${qs}`);
    const data = await res.json();
    setPedidos(data.pedidos || []);
    setLoading(false);
  }, [statusFiltro]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  useEffect(() => {
    fetch("/api/produtos?ativo=true").then((r) => r.json()).then(setProdutos);
  }, []);

  async function criarPedido() {
    const itensValidos = novoForm.itens.filter((i) => i.produtoId && i.quantidade > 0);
    if (itensValidos.length === 0) return alert("Adicione pelo menos um item");

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoForm,
        itens: itensValidos.map((i) => ({ ...i, quantidade: Number(i.quantidade) })),
      }),
    });

    if (res.ok) {
      setOpenNovo(false);
      setNovoForm({ mesa: "", nomeCliente: "", observacao: "", formaEntrega: "RETIRADA", enderecoEntrega: "", itens: [{ produtoId: "", quantidade: 1, observacao: "" }] });
      fetchPedidos();
    }
  }

  async function mudarStatus(pedidoId: string, status: string, fPagto?: string) {
    await fetch(`/api/pedidos/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(fPagto ? { formaPagto: fPagto } : {}) }),
    });
    setOpenPagto(null);
    fetchPedidos();
  }

  async function removerPedido(pedidoId: string) {
    if (!confirm("Tem certeza que deseja remover este pedido? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/pedidos/${pedidoId}`, { method: "DELETE" });
    if (res.ok) {
      // Remove o pedido da lista localmente para feedback imediato
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Erro ao remover pedido");
    }
  }

  const addItem = () =>
    setNovoForm((f) => ({ ...f, itens: [...f.itens, { produtoId: "", quantidade: 1, observacao: "" }] }));

  const removeItem = (idx: number) =>
    setNovoForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));

  const calcTotal = () =>
    novoForm.itens.reduce((s, item) => {
      const p = produtos.find((pr) => pr.id === item.produtoId);
      return s + (p ? Number(p.preco) * item.quantidade : 0);
    }, 0);

  const statusBadgeColors = ["ABERTO", "EM_PREPARO", "PRONTO"];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Botões de ação */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={fetchPedidos}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setOpenNovo(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Pedido
          </Button>
        </div>
        {/* Filtros de status com scroll horizontal no mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {["", "ABERTO", "EM_PREPARO", "PRONTO", "ENTREGUE", "PAGO", "CANCELADO"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFiltro(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFiltro === s
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {s === "" ? "Todos" : PEDIDO_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum pedido encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg">#{pedido.numero}</span>
                    <p className="text-sm text-gray-500">
                      {pedido.nomeCliente || (pedido.mesa ? `Mesa ${pedido.mesa}` : "Sem identificação")}
                    </p>
                    {/* Badge de forma de entrega */}
                    {pedido.formaEntrega && (
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${FORMA_ENTREGA_COLORS[pedido.formaEntrega]}`}>
                        {pedido.formaEntrega === "DELIVERY" ? <Truck className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                        {FORMA_ENTREGA_LABELS[pedido.formaEntrega]}
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PEDIDO_STATUS_COLORS[pedido.status]}`}>
                    {PEDIDO_STATUS_LABELS[pedido.status]}
                  </span>
                </div>

                <div className="space-y-1 mb-3 text-sm text-gray-600">
                  {pedido.enderecoEntrega && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Truck className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      {pedido.enderecoEntrega}
                    </p>
                  )}
                  {pedido.itens.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantidade}x {item.produto?.nome}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                  {pedido.itens.length > 3 && (
                    <p className="text-xs text-gray-400">+{pedido.itens.length - 3} mais itens</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{formatCurrency(Number(pedido.total))}</span>
                    <p className="text-xs text-gray-400">{formatDateTime(pedido.createdAt)}</p>
                  </div>
                  {/* Ações — empilhadas no mobile */}
                  <div className="flex flex-wrap gap-1">
                    {(STATUS_ACTIONS[pedido.status] || []).map((action) => (
                      <button
                        key={action.next}
                        onClick={() => {
                          if (action.next === "PAGO") {
                            setOpenPagto({ pedido, next: "PAGO" });
                          } else {
                            mudarStatus(pedido.id, action.next);
                          }
                        }}
                        className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-md text-white text-xs font-medium flex items-center justify-center gap-1 ${action.color}`}
                      >
                        <action.icon className="h-3 w-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>

                  {/* Remover pedido */}
                  <button
                    onClick={() => removerPedido(pedido.id)}
                    className="w-full px-2.5 py-2 rounded-md text-red-600 hover:bg-red-50 border border-red-200 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Novo Pedido */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Mesa</Label>
                <Input
                  placeholder="Ex: 5"
                  value={novoForm.mesa}
                  onChange={(e) => setNovoForm((f) => ({ ...f, mesa: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  placeholder="Ex: João"
                  value={novoForm.nomeCliente}
                  onChange={(e) => setNovoForm((f) => ({ ...f, nomeCliente: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea
                placeholder="Alguma observação geral?"
                value={novoForm.observacao}
                onChange={(e) => setNovoForm((f) => ({ ...f, observacao: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Forma de Entrega */}
            <div className="space-y-3">
              <Label>Forma de Entrega</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["RETIRADA", "DELIVERY"] as const).map((fe) => (
                  <button
                    key={fe}
                    type="button"
                    onClick={() => setNovoForm((f) => ({ ...f, formaEntrega: fe, enderecoEntrega: fe === "RETIRADA" ? "" : f.enderecoEntrega }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                      novoForm.formaEntrega === fe
                        ? fe === "DELIVERY"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {fe === "DELIVERY" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    {FORMA_ENTREGA_LABELS[fe]}
                  </button>
                ))}
              </div>

              {novoForm.formaEntrega === "DELIVERY" && (
                <div>
                  <Label>Endereço de Entrega</Label>
                  <Input
                    placeholder="Rua, número, bairro..."
                    value={novoForm.enderecoEntrega}
                    onChange={(e) => setNovoForm((f) => ({ ...f, enderecoEntrega: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Itens</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>

              {novoForm.itens.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Select
                      value={item.produtoId}
                      onValueChange={(v) =>
                        setNovoForm((f) => ({
                          ...f,
                          itens: f.itens.map((it, i) => (i === idx ? { ...it, produtoId: v } : it)),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} — {formatCurrency(p.preco)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) =>
                        setNovoForm((f) => ({
                          ...f,
                          itens: f.itens.map((it, i) =>
                            i === idx ? { ...it, quantidade: parseInt(e.target.value) || 1 } : it
                          ),
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => removeItem(idx)}
                    disabled={novoForm.itens.length === 1}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="text-right font-bold text-lg mt-2">
                Total: {formatCurrency(calcTotal())}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={criarPedido}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pagamento */}
      <Dialog open={!!openPagto} onOpenChange={() => setOpenPagto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          {openPagto && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Pedido #{openPagto.pedido.numero}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(Number(openPagto.pedido.total))}</p>
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagto} onValueChange={setFormaPagto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMA_PAGTO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPagto(null)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => openPagto && mudarStatus(openPagto.pedido.id, "PAGO", formaPagto)}
            >
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, X, MapPin, Clock, Truck, Package, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Produto = { id: string; nome: string; descricao?: string; preco: number; disponivel: boolean };
type Categoria = { id: string; nome: string; icone?: string | null; produtos: Produto[] };
type ItemCarrinho = { produtoId: string; nome: string; preco: number; quantidade: number; observacao: string };

export default function PedirPage() {
  const router = useRouter();

  const [status, setStatus] = useState<{ aberto: boolean; mensagem: string } | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [catAberta, setCatAberta] = useState<Record<string, boolean>>({});

  // Carrinho
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [verCarrinho, setVerCarrinho] = useState(false);

  // Formulário
  const [etapa, setEtapa] = useState<"cardapio" | "dados">("cardapio");
  const [form, setForm] = useState({
    nomeCliente: "",
    whatsapp: "",
    tipoPedido: "RETIRADA" as "RETIRADA" | "DELIVERY",
    endereco: "",
    localizacao: "",
    horarioEntrega: "",
    observacao: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/cardapio", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setStatus({ aberto: data.aberto, mensagem: data.mensagem });
        setCategorias(data.categorias || []);
        // Abre a primeira categoria por padrão
        if (data.categorias?.length > 0) {
          setCatAberta({ [data.categorias[0].id]: true });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Carrinho helpers ──────────────────────────────────────────────────────

  function adicionar(produto: Produto) {
    if (!produto.disponivel) return;
    setCarrinho((c) => {
      const idx = c.findIndex((i) => i.produtoId === produto.id);
      if (idx >= 0) {
        return c.map((i, j) => j === idx ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...c, { produtoId: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1, observacao: "" }];
    });
  }

  function remover(produtoId: string) {
    setCarrinho((c) => {
      const idx = c.findIndex((i) => i.produtoId === produtoId);
      if (idx < 0) return c;
      const item = c[idx];
      if (item.quantidade <= 1) return c.filter((_, j) => j !== idx);
      return c.map((i, j) => j === idx ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  }

  function removerItem(produtoId: string) {
    setCarrinho((c) => c.filter((i) => i.produtoId !== produtoId));
  }

  function qtdNoCarrinho(produtoId: string) {
    return carrinho.find((i) => i.produtoId === produtoId)?.quantidade || 0;
  }

  const totalCarrinho = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const qtdTotal = carrinho.reduce((s, i) => s + i.quantidade, 0);

  // ── Envio ─────────────────────────────────────────────────────────────────

  async function enviarPedido() {
    setErro("");
    if (!form.nomeCliente.trim()) { setErro("Informe seu nome"); return; }
    if (!form.whatsapp.trim()) { setErro("Informe seu WhatsApp para contato"); return; }
    if (carrinho.length === 0) { setErro("Adicione pelo menos um item"); return; }

    setEnviando(true);
    try {
      const res = await fetch("/api/pedidos/publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCliente: form.nomeCliente.trim(),
          tipoPedido: form.tipoPedido,
          endereco: form.tipoPedido === "DELIVERY" ? form.endereco : undefined,
          localizacao: form.tipoPedido === "DELIVERY" ? form.localizacao : undefined,
          horarioEntrega: form.tipoPedido === "DELIVERY" ? form.horarioEntrega : undefined,
          observacao: `WhatsApp: ${form.whatsapp.trim()}${form.observacao ? `\n${form.observacao}` : ""}`,
          itens: carrinho.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            observacao: i.observacao || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao enviar pedido"); return; }

      router.push(`/pedir/confirmado/${data.pedidoId}?numero=${data.numero}&total=${data.total}`);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-32">
      {/* Header */}
      <div className="bg-orange-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">🌊 Sabor da Ilha</h1>
          <p className="text-orange-200 text-sm mt-0.5">Cardápio online • Peça aqui</p>
          {status && (
            <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${status.aberto ? "bg-green-600/80" : "bg-red-700/80"}`}>
              <span>{status.aberto ? "🟢" : "🔴"}</span>
              <span>{status.mensagem}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 mt-4 space-y-3">
        {!status?.aberto ? (
          /* Fora do horário */
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-orange-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-700">Fora do horário</h2>
            <p className="text-gray-500 mt-1 text-sm">{status?.mensagem}</p>
            <p className="text-gray-400 text-xs mt-3">Segunda a sábado das 10h às 15h</p>
          </div>
        ) : etapa === "cardapio" ? (
          <>
            {/* Cardápio */}
            {categorias.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl shadow overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800"
                  onClick={() => setCatAberta((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                >
                  <span className="flex items-center gap-2">
                    {cat.icone && <span className="text-xl">{cat.icone}</span>}
                    {cat.nome}
                    <span className="text-xs font-normal text-gray-400">({cat.produtos.length})</span>
                  </span>
                  {catAberta[cat.id] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {catAberta[cat.id] && (
                  <div className="divide-y divide-gray-50">
                    {cat.produtos.map((p) => {
                      const qtd = qtdNoCarrinho(p.id);
                      return (
                        <div key={p.id} className={`px-4 py-3 flex items-center gap-3 ${!p.disponivel ? "opacity-50" : ""}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-gray-800">{p.nome}</p>
                              {!p.disponivel && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                  Esgotado
                                </span>
                              )}
                            </div>
                            {p.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descricao}</p>}
                            <p className="text-orange-600 font-bold text-sm mt-1">{formatCurrency(p.preco)}</p>
                          </div>

                          {/* Contador */}
                          {p.disponivel && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {qtd > 0 ? (
                                <>
                                  <button
                                    onClick={() => remover(p.id)}
                                    className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="font-bold text-sm w-4 text-center">{qtd}</span>
                                </>
                              ) : null}
                              <button
                                onClick={() => adicionar(p)}
                                className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Botão ver carrinho fixo */}
            {carrinho.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={() => setEtapa("dados")}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-between px-5 text-sm"
                  >
                    <span className="bg-orange-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{qtdTotal}</span>
                    <span>Continuar</span>
                    <span>{formatCurrency(totalCarrinho)}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Etapa dados */
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            {/* Resumo do carrinho */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Seu pedido
                </h3>
                <button onClick={() => setEtapa("cardapio")} className="text-xs text-orange-500 hover:underline">
                  Editar
                </button>
              </div>
              <div className="space-y-1.5">
                {carrinho.map((item) => (
                  <div key={item.produtoId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{item.quantidade}</span>
                      <span className="text-gray-700 truncate">{item.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-600 font-medium">{formatCurrency(item.preco * item.quantidade)}</span>
                      <button onClick={() => removerItem(item.produtoId)} className="text-gray-300 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total dos itens</span>
                <span className="text-orange-600">{formatCurrency(totalCarrinho)}</span>
              </div>
            </div>

            <hr />

            {/* Dados do cliente */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Seu nome *</label>
                <input
                  type="text"
                  placeholder="Como você se chama?"
                  value={form.nomeCliente}
                  onChange={(e) => setForm((f) => ({ ...f, nomeCliente: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  WhatsApp para contato *
                </label>
                <input
                  type="tel"
                  placeholder="(98) 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <p className="text-xs text-gray-400 mt-1">Para confirmarmos seu pedido e combinar detalhes</p>
              </div>

              {/* Tipo do pedido */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Como vai receber?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm((f) => ({ ...f, tipoPedido: "RETIRADA" }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      form.tipoPedido === "RETIRADA"
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    <Package className="h-4 w-4" /> Retirada
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, tipoPedido: "DELIVERY" }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      form.tipoPedido === "DELIVERY"
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    <Truck className="h-4 w-4" /> Delivery
                  </button>
                </div>
              </div>

              {/* Campos de entrega */}
              {form.tipoPedido === "DELIVERY" && (
                <div className="space-y-3 p-3 bg-orange-50 rounded-xl">
                  <p className="text-xs text-orange-700 font-medium">📦 Taxa de entrega a combinar com o atendente</p>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Horário desejado</label>
                    <input
                      type="time"
                      value={form.horarioEntrega}
                      onChange={(e) => setForm((f) => ({ ...f, horarioEntrega: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      <MapPin className="h-3.5 w-3.5 inline mr-1" />
                      Endereço (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Rua, número, bairro..."
                      value={form.endereco}
                      onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      📍 Localização (link do Google Maps ou WhatsApp Location)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={form.localizacao}
                      onChange={(e) => setForm((f) => ({ ...f, localizacao: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <p className="text-xs text-gray-400 mt-1">Cole aqui o link de localização que você enviar pelo WhatsApp</p>
                  </div>
                </div>
              )}

              {/* Observação */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Alguma observação? (sem cebola, ponto da carne, etc.)"
                  value={form.observacao}
                  onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              {erro && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              <button
                onClick={enviarPedido}
                disabled={enviando}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm mt-2"
              >
                {enviando ? "Enviando pedido..." : `Confirmar pedido • ${formatCurrency(totalCarrinho)}`}
              </button>

              <p className="text-xs text-center text-gray-400">
                Ao confirmar você concorda que a taxa de entrega (se houver) será combinada com o atendente pelo WhatsApp.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

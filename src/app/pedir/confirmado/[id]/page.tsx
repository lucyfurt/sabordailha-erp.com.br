"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, MessageCircle, Package, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Número do WhatsApp do restaurante — altere aqui quando necessário
const WHATSAPP_NUMERO = "5598992019061"; // formato: 55 + DDD + número

// Componente interno que usa useSearchParams (precisa estar dentro de Suspense)
function ConfirmadoConteudo({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const numero = searchParams.get("numero");

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pedidos/${id}/publico`)
      .then((r) => r.ok ? r.json() : null)
      .then(setPedido)
      .finally(() => setLoading(false));
  }, [id]);

  const isDelivery = pedido
    ? (pedido.tipoPedido === "DELIVERY" || pedido.observacao?.startsWith("[DELIVERY]"))
    : false;

  const whatsappMsg = pedido
    ? encodeURIComponent(
        `Olá! Fiz um pedido pelo site 🌊\n\n` +
        `*Pedido #${pedido.numero}*\n` +
        (isDelivery ? `📦 Delivery\n` : `🏃 Retirada\n`) +
        pedido.itens.map((i: any) =>
          `• ${i.quantidade}x ${i.produto?.nome} — ${formatCurrency(Number(i.subtotal))}`
        ).join("\n") +
        `\n\n*Total dos itens: ${formatCurrency(Number(pedido.total))}*` +
        (isDelivery ? `\n\n_(Taxa de entrega a combinar)_` : "") +
        (pedido.observacao ? `\n\nObs: ${pedido.observacao}` : "")
      )
    : encodeURIComponent(`Olá! Acabei de fazer o pedido #${numero ?? ""} pelo site 🌊`);

  return (
    <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
      {/* Confirmação */}
      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Pedido recebido!</h2>
        <p className="text-gray-500 text-sm mt-1">Seu pedido foi enviado com sucesso.</p>
        {numero && (
          <div className="mt-4 inline-block bg-orange-50 border border-orange-200 rounded-xl px-6 py-3">
            <p className="text-xs text-orange-500 font-medium">Número do pedido</p>
            <p className="text-3xl font-bold text-orange-600">#{numero}</p>
          </div>
        )}
      </div>

      {/* Resumo */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow p-5 text-center text-gray-400 text-sm">
          Carregando resumo...
        </div>
      ) : pedido ? (
        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Resumo do pedido</h3>

          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            (pedido.tipoPedido === "DELIVERY" || pedido.observacao?.startsWith("[DELIVERY]"))
              ? "bg-blue-50 text-blue-700"
              : "bg-green-50 text-green-700"
          }`}>
            {(pedido.tipoPedido === "DELIVERY" || pedido.observacao?.startsWith("[DELIVERY]"))
              ? <Truck className="h-4 w-4 flex-shrink-0" />
              : <Package className="h-4 w-4 flex-shrink-0" />}
            <span className="font-medium">
              {(pedido.tipoPedido === "DELIVERY" || pedido.observacao?.startsWith("[DELIVERY]"))
                ? "Delivery"
                : "Retirada no local"}
            </span>
            {pedido.tipoPedido === "DELIVERY" && pedido.horarioEntrega && (
              <span className="ml-auto text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" /> {pedido.horarioEntrega}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {pedido.itens.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-800">{item.quantidade}x</span> {item.produto?.nome}
                </span>
                <span className="text-gray-700 font-medium">{formatCurrency(Number(item.subtotal))}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
            <span>Total dos itens</span>
            <span className="text-orange-600">{formatCurrency(Number(pedido.total))}</span>
          </div>

          {(pedido.tipoPedido === "DELIVERY" || pedido.observacao?.startsWith("[DELIVERY]")) && (
            <p className="text-xs text-gray-400 text-center">
              + Taxa de entrega a combinar com o atendente
            </p>
          )}

          {pedido.observacao && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <span className="font-medium">Obs:</span> {pedido.observacao}
            </div>
          )}
        </div>
      ) : null}

      {/* Próximos passos */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">O que acontece agora?</h3>
        <div className="space-y-3 text-sm text-gray-600">
          {[
            "Recebemos seu pedido e já estamos vendo por aqui.",
            "Vamos confirmar pelo WhatsApp e combinar a taxa de entrega (se for delivery).",
            "Fique de olho no WhatsApp para acompanhar seu pedido!",
          ].map((texto, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p>{texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Botão WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${whatsappMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl text-sm shadow"
      >
        <MessageCircle className="h-5 w-5" />
        Falar com o atendente no WhatsApp
      </a>

      <a
        href="/pedir"
        className="flex items-center justify-center w-full border border-orange-300 text-orange-600 font-medium py-3 rounded-2xl text-sm hover:bg-orange-50"
      >
        Fazer outro pedido
      </a>
    </div>
  );
}

// Wrapper com Suspense (obrigatório no Next.js 14 ao usar useSearchParams)
export default function ConfirmadoPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-orange-50 pb-10">
      <div className="bg-orange-600 text-white px-4 py-5 shadow-md">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">🌊 Sabor da Ilha</h1>
        </div>
      </div>
      <Suspense fallback={
        <div className="max-w-lg mx-auto px-4 mt-10 text-center text-gray-400">
          Carregando...
        </div>
      }>
        <ConfirmadoConteudo id={params.id} />
      </Suspense>
    </div>
  );
}

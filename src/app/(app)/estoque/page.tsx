import { Header } from "@/components/layout/Header";
import { EstoqueClient } from "./EstoqueClient";

export default function EstoquePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Estoque" subtitle="Produtos, entradas, saídas, alertas e painel do dia" />
      <div className="flex-1 p-3 md:p-6">
        <EstoqueClient />
      </div>
    </div>
  );
}

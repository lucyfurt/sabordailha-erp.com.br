import { Header } from "@/components/layout/Header";
import { EstoqueClient } from "./EstoqueClient";

export default function EstoquePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Estoque" subtitle="Controle de entrada e saída de materiais" />
      <div className="flex-1 p-6">
        <EstoqueClient />
      </div>
    </div>
  );
}

import { Header } from "@/components/layout/Header";
import { CaixaClient } from "./CaixaClient";

export default function CaixaPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Fluxo de Caixa" subtitle="Controle de entradas e saídas financeiras" />
      <div className="flex-1 p-6">
        <CaixaClient />
      </div>
    </div>
  );
}

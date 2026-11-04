import { Header } from "@/components/layout/Header";
import { RelatoriosClient } from "./RelatoriosClient";

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Relatórios" subtitle="Análise de faturamento e desempenho" />
      <div className="flex-1 p-6">
        <RelatoriosClient />
      </div>
    </div>
  );
}

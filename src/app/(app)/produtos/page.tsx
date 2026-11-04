import { Header } from "@/components/layout/Header";
import { ProdutosClient } from "./ProdutosClient";

export default function ProdutosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Produtos" subtitle="Cardápio e produtos do estabelecimento" />
      <div className="flex-1 p-6">
        <ProdutosClient />
      </div>
    </div>
  );
}

import { Header } from "@/components/layout/Header";
import { PedidosClient } from "./PedidosClient";

export default function PedidosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Pedidos" subtitle="Gerencie os pedidos do estabelecimento" />
      <div className="flex-1 p-6">
        <PedidosClient />
      </div>
    </div>
  );
}

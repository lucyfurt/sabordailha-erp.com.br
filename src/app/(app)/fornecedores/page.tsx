import { Header } from "@/components/layout/Header";
import { FornecedoresClient } from "./FornecedoresClient";

export default function FornecedoresPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Fornecedores" subtitle="Cadastro de fornecedores de materiais" />
      <div className="flex-1 p-3 md:p-6">
        <FornecedoresClient />
      </div>
    </div>
  );
}

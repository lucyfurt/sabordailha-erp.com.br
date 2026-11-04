import { Header } from "@/components/layout/Header";
import { UsuariosClient } from "./UsuariosClient";

export default function UsuariosPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Usuários" subtitle="Gerenciar equipe e acessos ao sistema" />
      <div className="flex-1 p-6">
        <UsuariosClient />
      </div>
    </div>
  );
}

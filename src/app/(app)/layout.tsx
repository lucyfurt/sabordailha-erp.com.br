import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Padding-top no mobile para não ficar atrás do botão hambúrguer */}
      <main className="flex-1 overflow-auto min-w-0 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}

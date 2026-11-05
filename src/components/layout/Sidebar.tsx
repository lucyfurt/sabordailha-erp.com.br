"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  DollarSign,
  Package,
  ShoppingBag,
  BarChart3,
  UtensilsCrossed,
  Truck,
  Users,
  LogOut,
  ChevronRight,
  Waves,
  Menu,
  X,
} from "lucide-react";
import { cn, ROLE_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/caixa", label: "Fluxo de Caixa", icon: DollarSign },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/usuarios", label: "Usuários", icon: Users, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "GERENTE";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body quando menu mobile aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 flex-shrink-0">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Sabor da Ilha</p>
            <p className="text-xs text-slate-400">Sistema de Gestão</p>
          </div>
        </div>
        {/* Botão fechar no mobile */}
        <button
          className="md:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 text-white text-sm font-bold flex-shrink-0">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">
              {ROLE_LABELS[session?.user?.role || ""] || session?.user?.role}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Botão hambúrguer fixo no mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-900 text-white transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Sidebar desktop (fixo) */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-900 text-white flex-shrink-0">
        <NavContent />
      </aside>
    </>
  );
}

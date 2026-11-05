"use client";

import { formatDate } from "@/lib/utils";
import { Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b bg-white">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-500 truncate hidden sm:block">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Data só aparece em telas médias+ */}
        <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {formatDate(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy")}
        </div>
        {/* Data curta no mobile */}
        <div className="flex md:hidden items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(new Date(), "dd/MM/yyyy")}
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

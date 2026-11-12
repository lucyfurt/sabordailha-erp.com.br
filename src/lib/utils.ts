import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string, fmt = "dd/MM/yyyy") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt, { locale: ptBR });
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function getWeekRange(date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getPeriodKey(tipo: "DIARIO" | "SEMANAL" | "MENSAL", date = new Date()) {
  if (tipo === "DIARIO") return format(date, "yyyy-MM-dd");
  if (tipo === "SEMANAL") {
    const week = format(date, "w");
    return `${format(date, "yyyy")}-W${week.padStart(2, "0")}`;
  }
  return format(date, "yyyy-MM");
}

export const CATEGORIAS_LABELS: Record<string, string> = {
  VENDA: "Venda",
  COMPRA_MATERIAL: "Compra de Material",
  SALARIO: "Salário",
  ALUGUEL: "Aluguel",
  AGUA: "Água",
  LUZ: "Luz/Energia",
  GAS: "Gás",
  MANUTENCAO: "Manutenção",
  MARKETING: "Marketing",
  OUTROS_ENTRADA: "Outros (Entrada)",
  OUTROS_SAIDA: "Outros (Saída)",
};

export const FORMA_PAGTO_LABELS: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
  PIX: "PIX",
  VOUCHER: "Voucher",
  MISTO: "Misto",
  PENDENTE: "Pagamento Pendente",
};

export const FORMA_ENTREGA_LABELS: Record<string, string> = {
  RETIRADA: "Retirada",
  DELIVERY: "Delivery",
};

export const FORMA_ENTREGA_COLORS: Record<string, string> = {
  RETIRADA: "bg-sky-100 text-sky-800",
  DELIVERY: "bg-orange-100 text-orange-800",
};

export const PEDIDO_STATUS_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  EM_PREPARO: "Em Preparo",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  AGUARDANDO_PAGTO: "Aguardando Pagamento",
  CANCELADO: "Cancelado",
  PAGO: "Concluído",
};

export const PEDIDO_STATUS_COLORS: Record<string, string> = {
  ABERTO: "bg-blue-100 text-blue-800",
  EM_PREPARO: "bg-yellow-100 text-yellow-800",
  PRONTO: "bg-green-100 text-green-800",
  ENTREGUE: "bg-purple-100 text-purple-800",
  AGUARDANDO_PAGTO: "bg-orange-100 text-orange-800",
  CANCELADO: "bg-red-100 text-red-800",
  PAGO: "bg-emerald-100 text-emerald-800",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  ATENDENTE: "Atendente",
  COZINHA: "Cozinha",
};

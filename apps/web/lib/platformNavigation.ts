import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Boxes,
  Building2,
  Cable,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardPenLine,
  FileSignature,
  Gauge,
  MessageCircleMore,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  WalletCards,
  Waypoints
} from "lucide-react";

export type PlatformNavigationItem = {
  href: string;
  appHref?: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  tone: string;
  module: string;
  adminOnly?: boolean;
  primaryMobile?: boolean;
};

export type PlatformNavigationGroup = {
  label: string;
  items: PlatformNavigationItem[];
};

export const PLATFORM_NAVIGATION: PlatformNavigationGroup[] = [
  {
    label: "Operação",
    items: [
      { href: "/ai", label: "NODERE AI", icon: Sparkles, tone: "green", module: "dashboard", primaryMobile: true },
      { href: "/dashboard", appHref: "/app/dashboard", label: "Dashboard", icon: Gauge, tone: "neutral", module: "dashboard", primaryMobile: true },
      { href: "/searches", appHref: "/app/discovery", label: "Prospecção e pesquisa", mobileLabel: "Prospecção", icon: Search, tone: "cyan", module: "buscas", primaryMobile: true },
      { href: "/crm", label: "Funil comercial", mobileLabel: "CRM", icon: Waypoints, tone: "green", module: "crm", primaryMobile: true },
      { href: "/companies", label: "Empresas e clientes", mobileLabel: "Clientes salvos", icon: Building2, tone: "blue", module: "crm" },
      { href: "/crm/communications", label: "Comunicações", icon: MessageCircleMore, tone: "cyan", module: "crm" },
      { href: "/calendario", label: "Agenda", mobileLabel: "Atividades e Agenda", icon: CalendarDays, tone: "blue", module: "agenda" }
    ]
  },
  {
    label: "Comercial",
    items: [
      { href: "/crm/briefings", label: "Briefings", mobileLabel: "Briefings Comerciais", icon: ClipboardPenLine, tone: "gold", module: "crm" },
      { href: "/app/proposals", label: "Propostas e contratos", mobileLabel: "Propostas e Contratos", icon: FileSignature, tone: "purple", module: "crm" },
      { href: "/catalog", label: "Produtos e serviços", mobileLabel: "Produtos / Serviços", icon: Boxes, tone: "orange", module: "crm" },
      { href: "/reports", label: "Relatórios", icon: ChartNoAxesCombined, tone: "blue", module: "relatorios" }
    ]
  },
  {
    label: "Administração",
    items: [
      { href: "/operators", label: "Usuários e permissões", mobileLabel: "Operadores", icon: UsersRound, tone: "green", adminOnly: true, module: "admin" },
      { href: "/settings", appHref: "/app/settings", label: "Configurações", icon: SlidersHorizontal, tone: "neutral", module: "admin" },
      { href: "/integrations", label: "Integrações", icon: Cable, tone: "cyan", adminOnly: true, module: "integracoes" },
      { href: "/admin", label: "Administração técnica", mobileLabel: "Administrador / CMS", icon: ShieldCheck, tone: "red", adminOnly: true, module: "admin" },
      { href: "/billing", label: "Plano e faturamento", icon: WalletCards, tone: "gold", module: "admin" },
      { href: "/manual", label: "Manual NODERE", icon: BookOpenCheck, tone: "blue", module: "dashboard" }
    ]
  }
];

export const PLATFORM_NAVIGATION_ITEMS = PLATFORM_NAVIGATION.flatMap((group) => group.items);

export function resolvePlatformHref(item: PlatformNavigationItem, pathname: string) {
  return pathname.startsWith("/app") && item.appHref ? item.appHref : item.href;
}


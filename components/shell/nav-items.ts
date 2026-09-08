export interface NavItem {
  label: string;
  href: string;
  group: "overview" | "in" | "out" | "performance" | "system";
  /** Hidden from users who cannot edit financial data. */
  editorsOnly?: boolean;
}

/** Sidebar navigation — only the screens that are actually built. */
export const navItems: NavItem[] = [
  { label: "Command Center", href: "/command-center", group: "overview" },

  { label: "Chiffre d'affaires", href: "/revenue", group: "in" },
  { label: "Factures", href: "/invoices", group: "in" },
  { label: "Clients", href: "/clients", group: "in" },

  { label: "Dépenses", href: "/expenses", group: "out" },

  { label: "Compte de résultat", href: "/pnl", group: "performance" },

  { label: "Données", href: "/data", group: "system", editorsOnly: true },
  { label: "Réglages", href: "/settings", group: "system" },
];

export const navGroups: { id: NavItem["group"]; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "in", label: "Entrées" },
  { id: "out", label: "Sorties" },
  { id: "performance", label: "Performance" },
  { id: "system", label: "Système" },
];

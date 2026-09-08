/**
 * RIXZA Finance OS — core financial domain types.
 *
 * All monetary amounts inside the app are expressed in the company's
 * base reporting currency (see `Company.baseCurrency`) as major units
 * (e.g. euros, not cents) using `number`. Multi-currency source data
 * carries its original amount + exchange rate and is converted on the
 * way in — see `Transaction`.
 */

export type CurrencyCode = "EUR" | "XAF" | "USD" | "CAD" | "GBP";

export type Money = number;

export type ISODate = string; // "YYYY-MM-DD"
export type MonthKey = string; // "YYYY-MM"

export type Role = "OWNER" | "ADMIN" | "FINANCE" | "MANAGER" | "VIEWER";

export type RevenueType = "one_time" | "recurring" | "subscription" | "retainer";

export type SalesChannel =
  | "outbound"
  | "inbound"
  | "referral"
  | "partnership"
  | "organic"
  | "paid";

export type ServiceLine =
  | "website"
  | "seo"
  | "aeo"
  | "geo"
  | "automation"
  | "ai"
  | "consulting"
  | "maintenance";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled";

export type ExpenseGroup =
  | "operations"
  | "marketing"
  | "human_resources"
  | "sales"
  | "administration";

export type Recurrence = "one_time" | "monthly" | "quarterly" | "yearly";

export interface Company {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
}

export interface Client {
  id: string;
  name: string;
  country: string;
  startDate: ISODate;
  renewalDate: ISODate | null;
  services: ServiceLine[];
  channel: SalesChannel;
}

export interface MrrMovement {
  newMrr: Money;
  expansion: Money;
  contraction: Money;
  churned: Money;
}

/**
 * A pre-aggregated month of company financials. In production these rows
 * are `FinancialSnapshot` records derived from transactions; the seed
 * dataset provides them directly so every dashboard renders immediately.
 */
export interface MonthlyFinancials {
  month: MonthKey;
  recurringRevenue: Money;
  oneTimeRevenue: Money;
  cogs: Money;
  operatingExpenses: Money;
  taxesAndOther: Money;
  cashIn: Money;
  cashOut: Money;
  /** Cash on hand at the close of this month. */
  cashBalance: Money;
  mrrMovement: MrrMovement;
}

export interface ClientProfile {
  client: Client;
  totalRevenue: Money;
  mrr: Money;
  outstanding: Money;
  contractValue: Money;
  /** Revenue booked per month, keyed by MonthKey. */
  revenueByMonth: Record<MonthKey, Money>;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  amount: Money;
  currency: CurrencyCode;
  issueDate: ISODate;
  dueDate: ISODate;
  status: InvoiceStatus;
}

export interface BudgetLine {
  month: MonthKey;
  group: ExpenseGroup;
  label: string;
  budget: Money;
  actual: Money;
}

export type GoalMetric = "revenue" | "mrr" | "arr" | "profit" | "cash" | "clients";

export interface FinancialGoal {
  id: string;
  label: string;
  metric: GoalMetric;
  target: number;
  /** ISO date the target should be reached by. */
  targetDate: ISODate;
  current: number;
}

export interface FinanceDataset {
  company: Company;
  months: MonthlyFinancials[]; // ordered oldest -> newest
  clients: ClientProfile[];
  invoices: Invoice[];
  budgetLines: BudgetLine[];
  goals: FinancialGoal[];
}

// =====================================================================
// Record-level model — the source of truth.
// Monthly figures (MonthlyFinancials) and the FinanceDataset above are
// DERIVED from these records by lib/finance/derive.ts.
// =====================================================================

export type PaymentMethod = "bank" | "mobile_money" | "card" | "cash" | "other";

export type PlanStatus = "active" | "paused" | "cancelled";

export type Frequency = "monthly" | "quarterly" | "yearly";

export type ClientStatus = "prospect" | "active" | "churned";

/** Flat expense categories (master prompt §11). */
export type ExpenseCategory =
  | "operations"
  | "software"
  | "infrastructure"
  | "marketing"
  | "sales"
  | "human_resources"
  | "freelancers"
  | "office"
  | "travel"
  | "legal"
  | "accounting"
  | "taxes"
  | "banking"
  | "other";

export interface CompanySettings extends Company {
  /** Cash on hand at the start of `openingCashDate`'s month. */
  openingCash: Money;
  openingCashDate: ISODate;
}

export interface ClientRecord {
  id: string;
  name: string;
  country: string;
  channel: SalesChannel;
  services: ServiceLine[];
  startDate: ISODate | null;
  renewalDate: ISODate | null;
  status: ClientStatus;
}

/** A recurring revenue plan for a client — the atoms of MRR. */
export interface Subscription {
  id: string;
  clientId: string;
  label: string;
  amountPerMonth: Money;
  startDate: ISODate;
  endDate: ISODate | null;
  status: PlanStatus;
}

/** A one-off / project revenue booking. */
export interface RevenueRecord {
  id: string;
  clientId: string;
  service: ServiceLine | null;
  bookedOn: ISODate;
  amount: Money;
  description: string;
}

export interface InvoiceRecord {
  id: string;
  number: string;
  clientId: string;
  issueDate: ISODate;
  dueDate: ISODate;
  status: InvoiceStatus;
  currency: CurrencyCode;
  amount: Money; // in `currency`
  exchangeRate: number; // multiply to reach base currency
  note: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string | null;
  clientId: string;
  paidOn: ISODate;
  amount: Money; // base currency
  method: PaymentMethod;
}

export interface Vendor {
  id: string;
  name: string;
  category: ExpenseCategory;
}

export interface ExpenseRecord {
  id: string;
  vendorName: string;
  category: ExpenseCategory;
  description: string;
  amount: Money; // base currency
  spentOn: ISODate;
  isCogs: boolean;
}

export interface RecurringCostRecord {
  id: string;
  vendorName: string;
  label: string;
  category: ExpenseCategory;
  amount: Money;
  frequency: Frequency;
  startDate: ISODate;
  endDate: ISODate | null;
  isCogs: boolean;
  status: PlanStatus;
}

/** A budget target for a month + category. `actual` is derived from expenses. */
export interface BudgetTarget {
  month: MonthKey;
  group: ExpenseGroup;
  label: string;
  budget: Money;
}

export interface RixzaData {
  company: CompanySettings;
  clients: ClientRecord[];
  subscriptions: Subscription[];
  revenueRecords: RevenueRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  recurringCosts: RecurringCostRecord[];
  budgetTargets: BudgetTarget[];
  goals: FinancialGoal[];
  /** Trailing months shown on the dashboard. Default 12. */
  windowMonths?: number;
}

/**
 * Turns the record-level `RixzaData` into the aggregated `FinanceDataset`
 * the Command Center engine consumes. Every monthly figure — recurring
 * revenue, MRR movement, COGS, opex, cash in/out, cash balance — is
 * computed here from individual invoices, payments, subscriptions and
 * expenses. Nothing monthly is entered by hand.
 */

import type {
  BudgetLine,
  ClientProfile,
  ExpenseCategory,
  ExpenseGroup,
  FinanceDataset,
  FinancialGoal,
  Invoice,
  InvoiceStatus,
  MonthlyFinancials,
  RixzaData,
} from "./types";

const DEFAULT_WINDOW = 12;

// --- date helpers (all UTC, month keys "YYYY-MM") -----------------------

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function firstDay(key: string): string {
  return `${key}-01`;
}

function lastDay(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return `${key}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Map a flat expense category to a P&L / budget bucket. */
export function expenseGroupOf(category: ExpenseCategory): ExpenseGroup {
  switch (category) {
    case "marketing":
      return "marketing";
    case "sales":
      return "sales";
    case "human_resources":
    case "freelancers":
      return "human_resources";
    case "legal":
    case "accounting":
    case "taxes":
    case "other":
      return "administration";
    default:
      return "operations";
  }
}

/** Monthly-equivalent amount of a recurring cost. */
function monthlyEquivalent(amount: number, frequency: string): number {
  if (frequency === "yearly") return amount / 12;
  if (frequency === "quarterly") return amount / 3;
  return amount;
}

interface PlanLike {
  startDate: string;
  endDate: string | null;
  status: string;
}

function activeInMonth(plan: PlanLike, key: string): boolean {
  if (plan.status !== "active") return false;
  if (plan.startDate > lastDay(key)) return false;
  if (plan.endDate && plan.endDate < firstDay(key)) return false;
  return true;
}

// --- effective invoice status ----------------------------------------

export function effectiveInvoiceStatus(
  status: InvoiceStatus,
  dueDate: string,
  asOf = new Date().toISOString().slice(0, 10),
): InvoiceStatus {
  if ((status === "sent" || status === "pending") && dueDate < asOf) return "overdue";
  return status;
}

// --- main -----------------------------------------------------------

export function deriveDataset(data: RixzaData): FinanceDataset {
  const asOf = new Date().toISOString().slice(0, 10);
  const windowMonths = Math.max(3, data.windowMonths ?? DEFAULT_WINDOW);

  // ---- month range -------------------------------------------------
  const dated: string[] = [
    data.company.openingCashDate,
    ...data.revenueRecords.map((r) => r.bookedOn),
    ...data.invoices.map((i) => i.issueDate),
    ...data.payments.map((p) => p.paidOn),
    ...data.expenses.map((e) => e.spentOn),
    ...data.subscriptions.map((s) => s.startDate),
    ...data.recurringCosts.map((c) => c.startDate),
  ].filter(Boolean);

  const earliest = dated.length ? monthKey(dated.reduce((a, b) => (a < b ? a : b))) : todayKey();
  const latestFromData = dated.length
    ? monthKey(dated.reduce((a, b) => (a > b ? a : b)))
    : todayKey();
  const endMonth = latestFromData > todayKey() ? latestFromData : todayKey();

  let startMonth = addMonths(endMonth, -(windowMonths - 1));
  if (startMonth < earliest && monthsBetween(earliest, endMonth) + 1 < windowMonths) {
    // keep the full window even if it predates the first record
  } else if (startMonth < earliest) {
    startMonth = earliest;
  }

  const months: string[] = [];
  for (let k = startMonth; k <= endMonth; k = addMonths(k, 1)) months.push(k);
  while (months.length < 3) months.unshift(addMonths(months[0], -1));

  // ---- per-month, per-client MRR from subscriptions --------------
  const openingMonth = monthKey(data.company.openingCashDate);
  const clientMrr: Record<string, Record<string, number>> = {};
  for (const key of months) {
    const map: Record<string, number> = {};
    for (const sub of data.subscriptions) {
      if (!activeInMonth(sub, key)) continue;
      map[sub.clientId] = (map[sub.clientId] ?? 0) + sub.amountPerMonth;
    }
    clientMrr[key] = map;
  }
  // The consumer (buildSnapshot) reconstructs the MRR level by accumulating
  // monthly movements from zero, so the first month must surface the whole
  // opening MRR book as "new" — treat the pre-window month as empty.
  const prevClientMrr: Record<string, number> = {};

  // ---- assemble MonthlyFinancials -------------------------------
  let runningCash = data.company.openingCash;
  const monthly: MonthlyFinancials[] = months.map((key, idx) => {
    const mrrMap = clientMrr[key];
    const recurringRevenue = sum(Object.values(mrrMap));

    const oneTimeRevenue = data.revenueRecords
      .filter((r) => monthKey(r.bookedOn) === key)
      .reduce((a, r) => a + r.amount, 0);

    // one-off expenses in the month
    let cogs = 0;
    let taxes = 0;
    let opex = 0;
    for (const e of data.expenses) {
      if (monthKey(e.spentOn) !== key) continue;
      if (e.isCogs) cogs += e.amount;
      else if (e.category === "taxes") taxes += e.amount;
      else opex += e.amount;
    }
    // recurring costs, monthly-equivalent, if active this month
    for (const c of data.recurringCosts) {
      if (!activeInMonth(c, key)) continue;
      const m = monthlyEquivalent(c.amount, c.frequency);
      if (c.isCogs) cogs += m;
      else if (c.category === "taxes") taxes += m;
      else opex += m;
    }

    const cashIn = data.payments
      .filter((p) => monthKey(p.paidOn) === key)
      .reduce((a, p) => a + p.amount, 0);
    const cashOut = cogs + opex + taxes;

    if (key >= openingMonth) runningCash += cashIn - cashOut;
    const cashBalance = runningCash;

    // MRR movement vs previous month
    const prev = idx === 0 ? prevClientMrr : clientMrr[months[idx - 1]];
    let newMrr = 0;
    let expansion = 0;
    let contraction = 0;
    let churned = 0;
    const clientIds = new Set([...Object.keys(prev), ...Object.keys(mrrMap)]);
    for (const cid of clientIds) {
      const before = prev[cid] ?? 0;
      const after = mrrMap[cid] ?? 0;
      if (before === 0 && after > 0) newMrr += after;
      else if (before > 0 && after === 0) churned += before;
      else if (after > before) expansion += after - before;
      else if (after < before) contraction += before - after;
    }

    return {
      month: key,
      recurringRevenue,
      oneTimeRevenue,
      cogs,
      operatingExpenses: opex,
      taxesAndOther: taxes,
      cashIn,
      cashOut,
      cashBalance,
      mrrMovement: { newMrr, expansion, contraction, churned },
    };
  });

  // ---- invoices (mapped to derived shape, base currency) -------
  const invoices: Invoice[] = data.invoices.map((i) => ({
    id: i.id,
    number: i.number,
    clientId: i.clientId,
    amount: i.amount * (i.exchangeRate || 1),
    currency: data.company.baseCurrency,
    issueDate: i.issueDate,
    dueDate: i.dueDate,
    status: effectiveInvoiceStatus(i.status, i.dueDate, asOf),
  }));

  // ---- client profiles ----------------------------------------
  const latestMonth = months[months.length - 1];
  const clients: ClientProfile[] = data.clients.map((c) => {
    const revenueByMonth: Record<string, number> = {};
    for (const key of months) {
      const recurring = clientMrr[key][c.id] ?? 0;
      const oneOff = data.revenueRecords
        .filter((r) => r.clientId === c.id && monthKey(r.bookedOn) === key)
        .reduce((a, r) => a + r.amount, 0);
      if (recurring || oneOff) revenueByMonth[key] = recurring + oneOff;
    }
    const totalRevenue = sum(Object.values(revenueByMonth));
    const mrr = clientMrr[latestMonth][c.id] ?? 0;

    const clientInvoices = invoices.filter((i) => i.clientId === c.id);
    const unpaid = clientInvoices.filter(
      (i) => i.status === "sent" || i.status === "pending" || i.status === "overdue",
    );
    const paidToUnpaid = data.payments
      .filter((p) => unpaid.some((i) => i.id === p.invoiceId))
      .reduce((a, p) => a + p.amount, 0);
    const outstanding = Math.max(
      unpaid.reduce((a, i) => a + i.amount, 0) - paidToUnpaid,
      0,
    );

    return {
      client: {
        id: c.id,
        name: c.name,
        country: c.country,
        startDate: c.startDate ?? "",
        renewalDate: c.renewalDate,
        services: c.services,
        channel: c.channel,
      },
      totalRevenue,
      mrr,
      outstanding,
      contractValue: mrr * 12,
      revenueByMonth,
    };
  });

  // ---- budget lines: targets + derived actuals ----------------
  const budgetLines: BudgetLine[] = data.budgetTargets.map((t) => {
    let actual = 0;
    for (const e of data.expenses) {
      if (monthKey(e.spentOn) !== t.month) continue;
      if (expenseGroupOf(e.category) === t.group) actual += e.amount;
    }
    for (const c of data.recurringCosts) {
      if (!activeInMonth(c, t.month)) continue;
      if (expenseGroupOf(c.category) === t.group) {
        actual += monthlyEquivalent(c.amount, c.frequency);
      }
    }
    return { month: t.month, group: t.group, label: t.label, budget: t.budget, actual };
  });

  // ---- goals: live `current` from derived data ---------------
  const last = monthly[monthly.length - 1];
  const currentMrr = last.recurringRevenue;
  const netProfit =
    last.recurringRevenue +
    last.oneTimeRevenue -
    last.cogs -
    last.operatingExpenses -
    last.taxesAndOther;
  const activeClients = data.clients.filter((c) => c.status === "active").length;

  const goals: FinancialGoal[] = data.goals.map((g) => ({
    ...g,
    current: liveGoalValue(g, {
      revenue: last.recurringRevenue + last.oneTimeRevenue,
      mrr: currentMrr,
      arr: currentMrr * 12,
      profit: netProfit,
      cash: last.cashBalance,
      clients: activeClients,
    }),
  }));

  return {
    company: {
      id: data.company.id,
      name: data.company.name,
      baseCurrency: data.company.baseCurrency,
    },
    months: monthly,
    clients,
    invoices,
    budgetLines,
    goals,
  };
}

// --- helpers ----------------------------------------------------

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

function liveGoalValue(
  goal: FinancialGoal,
  live: Record<string, number>,
): number {
  return live[goal.metric] ?? goal.current;
}

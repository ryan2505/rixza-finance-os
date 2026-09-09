/**
 * Builds the aggregated view the RIXZA Command Center renders from.
 * One call turns a `FinanceDataset` into every headline number, delta,
 * forecast and alert shown on the executive dashboard.
 */

import {
  arrFromMrr,
  average,
  budgetVariance,
  grossProfit,
  linearForecast,
  margin,
  monthsBetween,
  netBurn,
  netCashFlow,
  netNewMrr,
  netProfit,
  operatingProfit,
  pctChange,
  requiredMonthlyGrowth,
  runwayMonths,
  startingMrr,
} from "./metrics";
import type {
  CurrencyCode,
  FinanceDataset,
  FinancialGoal,
  MonthlyFinancials,
} from "./types";

export type AlertLevel = "danger" | "warning" | "success" | "info";

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  detail?: string;
}

export interface MetricWithDelta {
  value: number;
  previous: number | null;
  changePct: number | null;
}

export interface CommandCenterSnapshot {
  currency: CurrencyCode;
  month: string;
  monthLabel: string;

  revenue: {
    mtd: MetricWithDelta;
    quarter: number;
    ytd: number;
    previousYear: number | null;
    recurringShare: number | null;
  };

  recurring: {
    startingMrr: number;
    endingMrr: MetricWithDelta;
    newMrr: number;
    expansion: number;
    contraction: number;
    churned: number;
    netNewMrr: number;
    arr: number;
  };

  profitability: {
    grossRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    totalExpenses: MetricWithDelta;
    netProfit: MetricWithDelta;
    grossMargin: number | null;
    netMargin: number | null;
  };

  cash: {
    balance: number;
    cashIn: number;
    cashOut: number;
    netCashFlow: number;
    burnRate: number;
    runwayMonths: number | null;
  };

  forecast: {
    horizonMonths: number;
    revenue: number;
    expenses: number;
    profit: number;
    cash: number;
    endingMrr: number;
    arr: number;
  };

  goals: {
    goal: FinancialGoal;
    progressPct: number | null;
    gap: number;
    requiredMonthlyGrowthPct: number | null;
    monthsRemaining: number;
  }[];

  alerts: Alert[];

  series: {
    months: string[];
    revenue: number[];
    mrr: number[];
    netProfit: number[];
    cashBalance: number[];
  };
}

function totalRevenue(m: MonthlyFinancials): number {
  return m.recurringRevenue + m.oneTimeRevenue;
}

function totalExpenses(m: MonthlyFinancials): number {
  return m.cogs + m.operatingExpenses + m.taxesAndOther;
}

/** Reconstructs the running MRR level at the close of each month. */
function mrrSeries(months: MonthlyFinancials[]): number[] {
  let running = 0;
  return months.map((m) => {
    running += netNewMrr(m.mrrMovement);
    return Math.max(running, 0);
  });
}

export function buildSnapshot(
  dataset: FinanceDataset,
  opts: { forecastHorizonMonths?: number } = {},
): CommandCenterSnapshot {
  const { months } = dataset;
  if (months.length === 0) {
    throw new Error("buildSnapshot: dataset has no monthly financials");
  }

  const horizon = opts.forecastHorizonMonths ?? 3;
  const idx = months.length - 1;
  const current = months[idx];
  const prev = idx > 0 ? months[idx - 1] : null;
  const currency = dataset.company.baseCurrency;

  const revenueByMonth = months.map(totalRevenue);
  const expensesByMonth = months.map(totalExpenses);
  const mrrByMonth = mrrSeries(months);
  const netProfitByMonth = months.map((m) =>
    netProfit(operatingProfit(grossProfit(totalRevenue(m), m.cogs), m.operatingExpenses), m.taxesAndOther),
  );

  // --- Revenue ---
  const currentRevenue = totalRevenue(current);
  const prevRevenue = prev ? totalRevenue(prev) : null;

  const quarterMonths = months.slice(Math.max(0, idx - 2));
  const quarterRevenue = quarterMonths.reduce((a, m) => a + totalRevenue(m), 0);

  const currentYear = current.month.slice(0, 4);
  const ytdRevenue = months
    .filter((m) => m.month.startsWith(currentYear))
    .reduce((a, m) => a + totalRevenue(m), 0);

  const sameMonthLastYear = months.find(
    (m) => m.month === shiftMonth(current.month, -12),
  );
  const previousYearRevenue = sameMonthLastYear ? totalRevenue(sameMonthLastYear) : null;

  // --- Recurring ---
  const endingMrr = mrrByMonth[idx];
  const prevMrr = idx > 0 ? mrrByMonth[idx - 1] : null;
  const mv = current.mrrMovement;

  // --- Profitability ---
  const gp = grossProfit(currentRevenue, current.cogs);
  const op = operatingProfit(gp, current.operatingExpenses);
  const np = netProfit(op, current.taxesAndOther);
  const prevNp = prev ? netProfitByMonth[idx - 1] : null;
  const currentExpenses = totalExpenses(current);
  const prevExpenses = prev ? totalExpenses(prev) : null;

  // --- Cash ---
  const ncf = netCashFlow(current.cashIn, current.cashOut);
  const burnWindow = months.slice(Math.max(0, idx - 2));
  const avgNetBurn = average(
    burnWindow.map((m) => netBurn(totalExpenses(m), totalRevenue(m))),
  );
  const runway = runwayMonths(current.cashBalance, avgNetBurn);

  // --- Forecast ---
  const fRevenue = sum(linearForecast(revenueByMonth, horizon));
  const fExpenses = sum(linearForecast(expensesByMonth, horizon));
  const fEndingMrr = linearForecast(mrrByMonth, horizon).at(-1) ?? endingMrr;
  const fCashDelta = sum(
    linearForecast(
      months.map((m) => netCashFlow(m.cashIn, m.cashOut)),
      horizon,
    ),
  );

  // --- Goals ---
  const goalViews = dataset.goals.map((goal) => {
    const monthsRemaining = Math.max(
      monthsBetween(current.month, goal.targetDate.slice(0, 7)),
      0,
    );
    return {
      goal,
      progressPct: goal.target === 0 ? null : (goal.current / goal.target) * 100,
      gap: goal.target - goal.current,
      requiredMonthlyGrowthPct: requiredMonthlyGrowth(
        goal.current,
        goal.target,
        monthsRemaining,
      ),
      monthsRemaining,
    };
  });

  return {
    currency,
    month: current.month,
    monthLabel: monthLabel(current.month),

    revenue: {
      mtd: withDelta(currentRevenue, prevRevenue),
      quarter: quarterRevenue,
      ytd: ytdRevenue,
      previousYear: previousYearRevenue,
      recurringShare: currentRevenue === 0 ? null : (current.recurringRevenue / currentRevenue) * 100,
    },

    recurring: {
      startingMrr: startingMrr(endingMrr, mv),
      endingMrr: withDelta(endingMrr, prevMrr),
      newMrr: mv.newMrr,
      expansion: mv.expansion,
      contraction: mv.contraction,
      churned: mv.churned,
      netNewMrr: netNewMrr(mv),
      arr: arrFromMrr(endingMrr),
    },

    profitability: {
      grossRevenue: currentRevenue,
      grossProfit: gp,
      operatingExpenses: current.operatingExpenses,
      totalExpenses: withDelta(currentExpenses, prevExpenses),
      netProfit: withDelta(np, prevNp),
      grossMargin: margin(gp, currentRevenue),
      netMargin: margin(np, currentRevenue),
    },

    cash: {
      balance: current.cashBalance,
      cashIn: current.cashIn,
      cashOut: current.cashOut,
      netCashFlow: ncf,
      burnRate: avgNetBurn,
      runwayMonths: runway,
    },

    forecast: {
      horizonMonths: horizon,
      revenue: fRevenue,
      expenses: fExpenses,
      profit: fRevenue - fExpenses,
      cash: current.cashBalance + fCashDelta,
      endingMrr: fEndingMrr,
      arr: arrFromMrr(fEndingMrr),
    },

    goals: goalViews,

    alerts: buildAlerts(dataset, {
      runway,
      revenueChangePct: pctChange(currentRevenue, prevRevenue ?? 0),
      expenseChangePct: prev ? pctChange(totalExpenses(current), totalExpenses(prev)) : null,
      mrrChangePct: prevMrr ? pctChange(endingMrr, prevMrr) : null,
    }),

    series: {
      months: months.map((m) => m.month),
      revenue: revenueByMonth,
      mrr: mrrByMonth,
      netProfit: netProfitByMonth,
      cashBalance: months.map((m) => m.cashBalance),
    },
  };
}

// --- helpers ---------------------------------------------------------------

function withDelta(value: number, previous: number | null): MetricWithDelta {
  return {
    value,
    previous,
    changePct: previous === null ? null : pctChange(value, previous),
  };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildAlerts(
  dataset: FinanceDataset,
  ctx: {
    runway: number | null;
    revenueChangePct: number | null;
    expenseChangePct: number | null;
    mrrChangePct: number | null;
  },
): Alert[] {
  const alerts: Alert[] = [];

  const cur = dataset.company.baseCurrency;

  // Marge brute vs plancher RIXZA (Pricing Engine §4/§19)
  const last = dataset.months.at(-1);
  if (last) {
    const rev = last.recurringRevenue + last.oneTimeRevenue;
    if (rev > 0) {
      const gm = ((rev - last.cogs) / rev) * 100;
      if (gm < 45) {
        alerts.push({
          id: "margin-reject",
          level: "danger",
          title: "Marge brute critique",
          detail: `${gm.toFixed(1)} % ce mois-ci — sous le seuil de refus RIXZA (45 %).`,
        });
      } else if (gm < 50) {
        alerts.push({
          id: "margin-floor",
          level: "warning",
          title: "Marge brute sous le plancher RIXZA",
          detail: `${gm.toFixed(1)} % ce mois-ci — plancher recommandé 50 %.`,
        });
      }
    }
  }

  if (ctx.runway !== null && ctx.runway < 3) {
    alerts.push({
      id: "runway-critical",
      level: "danger",
      title: "Trésorerie sous les 3 mois",
      detail: `Autonomie estimée à ${ctx.runway.toFixed(1)} mois au rythme de consommation actuel.`,
    });
  } else if (ctx.runway !== null && ctx.runway < 6) {
    alerts.push({
      id: "runway-warning",
      level: "warning",
      title: "Trésorerie sous les 6 mois",
      detail: `Autonomie estimée à ${ctx.runway.toFixed(1)} mois.`,
    });
  }

  const overdue = dataset.invoices.filter((i) => i.status === "overdue");
  if (overdue.length > 0) {
    const amount = overdue.reduce((a, i) => a + i.amount, 0);
    alerts.push({
      id: "invoices-overdue",
      level: "danger",
      title: `${overdue.length} facture${overdue.length > 1 ? "s" : ""} en retard`,
      detail: `${money(amount, cur)} impayés au-delà de l'échéance.`,
    });
  }

  const currentMonth = dataset.months.at(-1)?.month;
  const overBudget = dataset.budgetLines.filter((b) => {
    if (currentMonth && b.month !== currentMonth) return false;
    return budgetVariance(b.budget, b.actual).status === "over";
  });
  for (const line of overBudget) {
    const v = budgetVariance(line.budget, line.actual);
    alerts.push({
      id: `budget-over-${line.group}-${line.label}`,
      level: "warning",
      title: `${line.label} — budget dépassé`,
      detail: `+${money(v.variance, cur)} par rapport au plan.`,
    });
  }

  if (
    ctx.expenseChangePct !== null &&
    ctx.revenueChangePct !== null &&
    ctx.expenseChangePct > ctx.revenueChangePct &&
    ctx.expenseChangePct > 0
  ) {
    alerts.push({
      id: "expense-outpacing-revenue",
      level: "warning",
      title: "Les charges progressent plus vite que le chiffre d'affaires",
      detail: `Charges ${ctx.expenseChangePct.toFixed(1)} % contre CA ${ctx.revenueChangePct.toFixed(1)} % sur un mois.`,
    });
  }

  if (ctx.revenueChangePct !== null && ctx.revenueChangePct > 0) {
    alerts.push({
      id: "revenue-up",
      level: "success",
      title: `Chiffre d'affaires en hausse de ${ctx.revenueChangePct.toFixed(1)} % ce mois-ci`,
    });
  }

  return alerts;
}

import { Types } from "mongoose";
import { env } from "../config/env";
import { Account } from "../models/Account";
import { Goal } from "../models/Goal";
import { RecurringPayment } from "../models/RecurringPayment";
import { Transaction } from "../models/Transaction";
import { getOverview } from "./statisticsService";

function money(value: number) {
  return `$U ${Math.round(value).toLocaleString("es-UY")}`;
}

function positive(value: number) {
  return Math.abs(Number(value || 0));
}

function categoryTotals(transactions: Awaited<ReturnType<typeof Transaction.find>>) {
  const rows = new Map<string, { total: number; count: number }>();
  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    const key = transaction.merchant || transaction.title || "Otros";
    const current = rows.get(key) || { count: 0, total: 0 };
    current.count += 1;
    current.total += positive(transaction.amount);
    rows.set(key, current);
  });
  return [...rows.entries()].map(([name, row]) => ({ name, ...row })).sort((a, b) => b.total - a.total);
}

function deterministicAnswer(message: string, context: { transactions: Awaited<ReturnType<typeof Transaction.find>>; goals: Awaited<ReturnType<typeof Goal.find>>; payments: Awaited<ReturnType<typeof RecurringPayment.find>>; overview: Awaited<ReturnType<typeof getOverview>> }) {
  const lower = message.toLowerCase();
  const expenses = context.transactions.filter((transaction) => transaction.type === "expense");
  const ant = expenses.filter((transaction) => transaction.isAntExpense);
  const antTotal = ant.reduce((sum, transaction) => sum + transaction.amount, 0);
  const committed = context.payments.filter((payment) => payment.status !== "rejected").reduce((sum, payment) => sum + payment.amount, 0);
  const top = categoryTotals(context.transactions)[0];
  const goal = context.goals[0];

  if (!context.transactions.length && !context.goals.length && !context.payments.length) {
    return {
      text: "Todavía no tengo datos financieros suficientes de tu usuario. Registrá un ingreso, un gasto o una meta y puedo analizarlo sin inventar importes.",
      blocks: []
    };
  }

  if (lower.includes("por día") || lower.includes("por dia")) {
    const available = Math.max(0, Number(context.overview.net || 0) - committed);
    const days = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getDate() - new Date().getDate());
    return {
      text: `Podés gastar aproximadamente ${money(available / days)} por día hasta fin de mes, considerando ${money(committed)} ya comprometidos.`,
      blocks: [{ title: "Disponible diario", rows: [`Disponible: ${money(available)}`, `Comprometido: ${money(committed)}`, `Días usados para el cálculo: ${days}`] }]
    };
  }

  if (lower.includes("gasté más") || lower.includes("gaste mas") || lower.includes("gasté mas")) {
    return {
      text: top ? `Tu mayor concentración de gastos aparece en ${top.name}: ${money(top.total)} en ${top.count} movimientos.` : "No encontré gastos en el período.",
      blocks: top ? [{ title: "Mayor gasto", rows: [`${top.name}: ${money(top.total)}`, `${top.count} movimientos`] }] : []
    };
  }

  if (lower.includes("meta")) {
    return {
      text: goal ? `Tu meta "${goal.name}" está en ${Math.round((goal.saved / goal.target) * 100)}%. Te faltan ${money(goal.target - goal.saved)}.` : "No hay metas activas para evaluar.",
      blocks: goal ? [{ title: "Meta principal", rows: [`Ahorrado: ${money(goal.saved)}`, `Objetivo: ${money(goal.target)}`, `Aporte mensual: ${money(goal.monthlyContribution)}`] }] : []
    };
  }

  if (lower.includes("comprometido")) {
    return {
      text: `Tenés ${money(committed)} comprometidos en pagos próximos/recurrentes cargados.`,
      blocks: [{ title: "Compromisos", rows: context.payments.slice(0, 5).map((payment) => `${payment.merchant}: ${money(payment.amount)}`) }]
    };
  }

  if (lower.includes("hormiga")) {
    return {
      text: `Detecté ${ant.length} gastos hormiga por ${money(antTotal)}. Reducir la mitad liberaría aproximadamente ${money(antTotal / 2)}.`,
      blocks: [{ title: "Gastos hormiga este mes", rows: [`${ant.length} movimientos`, `Total: ${money(antTotal)}`, `Promedio: ${money(ant.length ? antTotal / ant.length : 0)}`] }]
    };
  }

  return {
    text: `Este mes llevás ingresos por ${money(context.overview.income)} y gastos por ${money(context.overview.expenses)}. Tu saldo del período es ${money(context.overview.net)}.`,
    blocks: [{ title: "Resumen del mes", rows: [`Ingresos: ${money(context.overview.income)}`, `Gastos: ${money(context.overview.expenses)}`, `Balance: ${money(context.overview.net)}`] }]
  };
}

async function askGemini(message: string, context: unknown) {
  if (!env.geminiApiKey) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`, {
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Sos FinFlow. Respondé en español rioplatense, sin inventar importes, usando solo este contexto JSON. Si falta un dato, decilo. Contexto: ${JSON.stringify(context)}. Pregunta: ${message}`
            }
          ]
        }
      ]
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

export async function answerFinancialQuestion(userId: Types.ObjectId, message: string) {
  const [accounts, transactions, goals, payments, overview] = await Promise.all([
    Account.find({ userId, isActive: true }).sort({ createdAt: 1 }),
    Transaction.find({ userId }).sort({ date: -1 }).limit(160),
    Goal.find({ userId }).sort({ createdAt: 1 }),
    RecurringPayment.find({ userId }).sort({ nextChargeDate: 1 }),
    getOverview(userId, "30d")
  ]);
  const context = {
    accounts: accounts.map((account) => ({ balance: account.currentBalance, currency: account.currency, name: account.name, type: account.type })),
    goals: goals.map((goal) => ({ monthlyContribution: goal.monthlyContribution, name: goal.name, saved: goal.saved, target: goal.target })),
    overview: { expenses: overview.expenses, income: overview.income, net: overview.net },
    payments: payments.map((payment) => ({ amount: payment.amount, merchant: payment.merchant, nextChargeDate: payment.nextChargeDate, status: payment.status })),
    transactions: transactions.map((transaction) => ({ amount: transaction.amount, date: transaction.date, isAntExpense: transaction.isAntExpense, merchant: transaction.merchant, title: transaction.title, type: transaction.type }))
  };
  const fallback = deterministicAnswer(message, { goals, overview, payments, transactions });
  const gemini = await askGemini(message, context).catch(() => null);
  return {
    blocks: fallback.blocks,
    provider: gemini ? "gemini" : "finflow",
    text: gemini || fallback.text
  };
}

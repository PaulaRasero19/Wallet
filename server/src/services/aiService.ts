import { Types } from "mongoose";
import { env } from "../config/env";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { Goal } from "../models/Goal";
import { InstallmentPurchase } from "../models/InstallmentPurchase";
import { RecurringPayment } from "../models/RecurringPayment";
import { Transaction } from "../models/Transaction";
import { getOverview } from "./statisticsService";

type HistoryMessage = { role: "assistant" | "user"; text: string };
type Intent = "ant_expenses" | "expenses" | "goals" | "greeting" | "income" | "installments" | "payments" | "recommendation" | "thanks" | "unrelated" | "wellbeing" | "unknown";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function money(value: number, currency = "UYU") {
  const symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$U";
  return `${symbol} ${Math.max(0, value).toLocaleString("es-UY", { maximumFractionDigits: 2 })}`;
}

function detectIntent(message: string, history: HistoryMessage[]): Intent {
  const text = normalize(message);
  const priorUser = [...history].reverse().find((item) => item.role === "user")?.text || "";
  const contextual = /^(y\s|el mes pasado|y antes|cuanto tendria|como hago|por que)/.test(text) ? `${normalize(priorUser)} ${text}` : text;
  if (/^(hola|hol[a]+!|buenas|buen dia|buenas tardes|buenas noches|hey|que tal)[!?. ]*$/.test(text)) return "greeting";
  if (/^(gracias|muchas gracias|genial|perfecto|barbaro)[!?. ]*$/.test(text)) return "thanks";
  if (/como estas|todo bien/.test(text)) return "wellbeing";
  if (/partido|futbol|pronostico del tiempo|clima|pelicula|receta|presidente|capital de/.test(text)) return "unrelated";
  if (/hormiga/.test(contextual)) return "ant_expenses";
  if (/cuota|cuotas|compra en cuotas/.test(contextual)) return "installments";
  if (/pago|pagos|comprometido|vence|vencimiento|proximo/.test(contextual)) return "payments";
  if (/meta|objetivo|viaje|ahorrar por mes|cumplir/.test(contextual)) return "goals";
  if (/ingreso|ingresos|cobre|cobrar|sueldo|recibi/.test(contextual)) return "income";
  if (/gaste|gasto|gastos|comida|categoria|en que/.test(contextual)) return "expenses";
  if (/ahorrar|recomend|consejo|me conviene|puedo gastar por dia|puedo gastar por día/.test(contextual)) return "recommendation";
  return "unknown";
}

function requestedPeriod(message: string, history: HistoryMessage[]) {
  const text = normalize(message);
  const prior = normalize([...history].reverse().find((item) => item.role === "user")?.text || "");
  const combined = `${prior} ${text}`;
  const now = new Date();
  if (/mes pasado|mes anterior/.test(combined)) return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1), label: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("es-UY", { month: "long" }) };
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: "este mes" };
}

function missingClarification(message: string, intent: Intent, history: HistoryMessage[]) {
  const text = normalize(message);
  if (intent === "expenses" && /^¿?cuanto gaste\??$/.test(text) && !history.length) return "¿Querés saber cuánto gastaste este mes o en otro período?";
  if (intent === "recommendation" && /como puedo ahorrar|como ahorro/.test(text)) return "Puedo analizar tus gastos de este mes o ayudarte con una meta concreta. ¿Cuál de las dos preferís?";
  return null;
}

async function askGemini(message: string, history: HistoryMessage[], context: unknown) {
  if (!env.geminiApiKey) return null;
  const baseInstructions = "Sos FinFlow, una asistente de finanzas personales integrada en la aplicación. Respondé en español rioplatense de forma cercana, clara y breve. Contestá primero exactamente lo que la persona preguntó. No muestres información financiera que no haya solicitado. Usá únicamente el contexto real proporcionado. No inventes movimientos, fechas, montos, categorías ni predicciones. Cuando falte información, explicalo o pedí una aclaración. Conservá el contexto reciente. Diferenciá hechos de estimaciones. Si la pregunta no está relacionada con finanzas personales o FinFlow, limitá amablemente el alcance.";
  const contents = [
    { parts: [{ text: `${baseInstructions}\nContexto financiero autorizado: ${JSON.stringify(context)}` }], role: "user" },
    ...history.slice(-8).map((item) => ({ parts: [{ text: item.text }], role: item.role === "assistant" ? "model" : "user" })),
    { parts: [{ text: message }], role: "user" }
  ];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`, {
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 280, temperature: 0.35 } }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  if (!response.ok) return null;
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export async function answerFinancialQuestion(userId: Types.ObjectId, message: string, history: HistoryMessage[] = []) {
  const intent = detectIntent(message, history);
  if (intent === "greeting") return { blocks: [], provider: "finflow", text: "¡Hola! ¿En qué te puedo ayudar con tus finanzas hoy?" };
  if (intent === "thanks") return { blocks: [], provider: "finflow", text: "¡De nada! Estoy para ayudarte." };
  if (intent === "wellbeing") return { blocks: [], provider: "finflow", text: "¡Bien! Lista para ayudarte a ordenar tus finanzas." };
  if (intent === "unrelated") return { blocks: [], provider: "finflow", text: "Estoy enfocada en ayudarte con tus finanzas personales dentro de FinFlow. Puedo ayudarte con tus gastos, ingresos, metas o próximos pagos." };
  const clarification = missingClarification(message, intent, history);
  if (clarification) return { blocks: [], provider: "finflow", text: clarification };
  if (intent === "unknown") return { blocks: [], provider: "finflow", text: "¿Me contás un poco más qué querés revisar? Puedo ayudarte con gastos, ingresos, metas, cuotas o próximos pagos." };

  const [accounts, categories, goals, installments, payments, transactions, overview] = await Promise.all([
    Account.find({ userId, isActive: true }).sort({ createdAt: 1 }),
    Category.find({ $or: [{ userId }, { userId: null, isSystem: true }], isActive: true }),
    Goal.find({ userId }).sort({ createdAt: 1 }),
    InstallmentPurchase.find({ userId, status: "active" }).sort({ firstDueDate: 1 }),
    RecurringPayment.find({ userId, active: { $ne: false }, status: { $ne: "rejected" } }).sort({ nextChargeDate: 1 }),
    Transaction.find({ userId, status: { $nin: ["deleted", "cancelled"] } }).sort({ date: -1 }).limit(500),
    getOverview(userId, "30d")
  ]);
  const categoryNames = new Map(categories.map((category) => [String(category._id), category.name]));
  const period = requestedPeriod(message, history);
  const periodTransactions = transactions.filter((transaction) => transaction.date >= period.start && transaction.date < period.end);
  const expenses = periodTransactions.filter((transaction) => transaction.type === "expense");
  const incomes = periodTransactions.filter((transaction) => transaction.type === "income");
  const expenseTotal = expenses.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const incomeTotal = incomes.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const byCategory = new Map<string, number>();
  expenses.forEach((transaction) => {
    const name = categoryNames.get(String(transaction.categoryId)) || "Sin categoría";
    byCategory.set(name, (byCategory.get(name) || 0) + Math.abs(transaction.amount));
  });
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  const requestedCategory = [...byCategory.entries()].find(([name]) => normalize(message).includes(normalize(name)));
  const antExpenses = expenses.filter((transaction) => transaction.isAntExpense);
  const antTotal = antExpenses.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  const pendingInstallments = installments.flatMap((purchase) => purchase.installments.filter((item) => item.status === "pending").map((item) => ({ amount: item.amount, dueDate: item.dueDate, name: purchase.name, number: item.number, total: purchase.totalInstallments })));
  const context = {
    accounts: accounts.map((account) => ({ balance: account.currentBalance, currency: account.currency, name: account.name, type: account.type })),
    antExpenses: { count: antExpenses.length, total: antTotal },
    goals: goals.map((goal) => ({ name: goal.name, saved: goal.saved, status: goal.status, target: goal.target, targetDate: goal.targetDate })),
    installments: pendingInstallments.slice(0, 20),
    overview: { expenses: overview.expenses, income: overview.income, net: overview.net },
    payments: payments.map((payment) => ({ amount: payment.amount, currency: payment.currency, kind: payment.kind, merchant: payment.merchant, nextChargeDate: payment.nextChargeDate })),
    period: { expenseTotal, incomeTotal, label: period.label, topCategory: topCategory ? { name: topCategory[0], total: topCategory[1] } : null }
  };

  let fallback = "";
  if (intent === "expenses") {
    if (!expenses.length) fallback = `No encontré gastos registrados para ${period.label}.`;
    else if (requestedCategory) fallback = `En ${period.label} gastaste ${money(requestedCategory[1])} en la categoría ${requestedCategory[0]}.`;
    else if (/comida|categoria|en que|mas|más/.test(normalize(message)) || /en que|categoria/.test(normalize(history.at(-1)?.text || ""))) fallback = topCategory ? `La categoría con mayor gasto en ${period.label} fue ${topCategory[0]}, con ${money(topCategory[1])}.` : `En ${period.label} registraste ${money(expenseTotal)} en gastos.`;
    else fallback = `En ${period.label} registraste ${money(expenseTotal)} en gastos.`;
  }
  if (intent === "income") fallback = incomes.length ? `En ${period.label} registraste ${money(incomeTotal)} en ingresos.` : `No encontré ingresos registrados para ${period.label}.`;
  if (intent === "ant_expenses") fallback = antExpenses.length ? `En ${period.label} detecté ${antExpenses.length} gastos hormiga por un total de ${money(antTotal)}.` : `No encontré gastos hormiga registrados para ${period.label}.`;
  if (intent === "goals") {
    const namedGoal = goals.find((goal) => normalize(message).includes(normalize(goal.name))) || goals[0];
    fallback = namedGoal ? `En la meta “${namedGoal.name}” ahorraste ${money(namedGoal.saved)} de ${money(namedGoal.target)}. Te faltan ${money(Math.max(0, namedGoal.target - namedGoal.saved))}.` : "Todavía no tenés una meta creada. Podés agregar una desde el botón +.";
  }
  if (intent === "payments") {
    const committed = payments.filter((item) => item.kind !== "income").reduce((sum, item) => sum + item.amount, 0) + pendingInstallments.reduce((sum, item) => sum + item.amount, 0);
    fallback = committed > 0 ? `Tenés ${money(committed)} comprometidos entre pagos próximos y cuotas pendientes.` : "No tenés pagos ni cuotas próximos registrados.";
  }
  if (intent === "installments") fallback = pendingInstallments.length ? `Tenés ${pendingInstallments.length} cuotas pendientes por un total de ${money(pendingInstallments.reduce((sum, item) => sum + item.amount, 0))}.` : "No tenés cuotas pendientes.";
  if (intent === "recommendation") {
    const committed = payments.filter((item) => item.kind !== "income").reduce((sum, item) => sum + item.amount, 0) + pendingInstallments.reduce((sum, item) => sum + item.amount, 0);
    const available = accounts.reduce((sum, account) => sum + Number(account.currentBalance || 0), 0) - committed;
    const days = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() - Date.now()) / 86_400_000));
    fallback = /por dia|por día/.test(normalize(message)) ? `Podés gastar aproximadamente ${money(Math.max(0, available) / days)} por día hasta fin de mes. Es una estimación basada en tu saldo y tus compromisos registrados.` : expenses.length ? `Puedo recomendarte empezar por ${topCategory?.[0] || "tu categoría con más gastos"}. Este mes suma ${money(topCategory?.[1] || expenseTotal)}. Esto es una recomendación, no un gasto automático.` : "Todavía no tengo suficientes movimientos para darte una recomendación precisa.";
  }
  const generated = await askGemini(message, history, context).catch(() => null);
  return { blocks: [], provider: generated ? "gemini" : "finflow", text: generated || fallback || "No tengo suficientes datos para responder eso con precisión." };
}

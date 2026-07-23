import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";
import { ensureSystemCategories } from "../services/categorySeedService";

function testMongoUri() {
  const configured = process.env.TEST_MONGODB_URI;
  if (configured) return configured;

  const base = process.env.MONGODB_URI;
  if (!base) return "";

  const url = new URL(base);
  url.pathname = "/finflow_test";
  return url.toString();
}

const mongoUri = testMongoUri();
const runDbTests = Boolean(mongoUri);
const app = createApp();

describe("health", () => {
  it("returns service health", async () => {
    const response = await request(app).get("/health").expect(200);
    expect(response.body.ok).toBe(true);
  });
});

describe.skipIf(!runDbTests)("integration flow", () => {
  const email = `test-${Date.now()}@finflow.local`;
  const password = "Password123";
  let accessToken = "";
  let refreshToken = "";
  let accountId = "";
  let incomeCategoryId = "";
  let expenseCategoryId = "";
  let transactionId = "";
  let secondAccessToken = "";
  let latestRefreshToken = "";
  let goalId = "";
  let installmentPurchaseId = "";
  let installmentId = "";

  beforeAll(async () => {
    await mongoose.connect(mongoUri!);
    if (mongoose.connection.db?.databaseName !== "finflow_test") {
      throw new Error("Integration tests must run against finflow_test.");
    }
    await mongoose.connection.db.dropDatabase();
    await ensureSystemCategories();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      if (mongoose.connection.db?.databaseName === "finflow_test") {
        await mongoose.connection.db.dropDatabase();
      }
      await mongoose.disconnect();
    }
  });

  it("registers a user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Persona Test", email, password, language: "es" })
      .expect(201);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.onboarding_completed).toBe(false);
    latestRefreshToken = response.body.session.refresh_token;
  });

  it("validates register input", async () => {
    await request(app).post("/api/auth/register").send({ fullName: " ", email: "bad", password: "short", language: "es" }).expect(400);
    await request(app).post("/api/auth/register").send({ fullName: "A", email: `a-${Date.now()}@finflow.local`, password, language: "es" }).expect(400);
    await request(app).post("/api/auth/register").send({ fullName: "Persona", email: `b-${Date.now()}@finflow.local`, password: "Password", language: "es" }).expect(400);
    await request(app).post("/api/auth/register").send({ fullName: "Persona", email: `c-${Date.now()}@finflow.local`, password: "12345678", language: "es" }).expect(400);
  });

  it("persists a secure user document", async () => {
    const stored = await User.findOne({ email }).select("+passwordHash");
    expect(stored).toBeTruthy();
    expect(stored?.email).toBe(email);
    expect(stored?.passwordHash).not.toBe(password);
    expect(String(stored?.passwordHash)).toMatch(/^\$2[aby]\$/);
    expect(stored?.createdAt).toBeTruthy();
    expect(stored?.updatedAt).toBeTruthy();

    const refreshCount = await RefreshToken.countDocuments({ userId: stored!._id });
    expect(refreshCount).toBeGreaterThan(0);
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send({ fullName: "Persona Test", email, password, language: "es" }).expect(409);
  });

  it("logs in and rejects invalid login", async () => {
    await request(app).post("/api/auth/login").send({ email, password: "badpass123" }).expect(401);
    const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
    accessToken = response.body.session.access_token;
    refreshToken = response.body.session.refresh_token;
    latestRefreshToken = refreshToken;
    expect(accessToken).toBeTruthy();
  });

  it("protects /me", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`).expect(200);
  });

  it("completes onboarding and creates initial account", async () => {
    const response = await request(app)
      .post("/api/profile/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ countryCode: "UY", language: "es", primaryCurrency: "UYU", initialBalance: 1000, antExpenseThreshold: 300 })
      .expect(200);
    accountId = response.body.account.id;
    expect(response.body.profile.onboarding_completed).toBe(true);
  });

  it("returns empty overview before movements", async () => {
    const response = await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(response.body.overview.transaction_count).toBe(0);
    expect(response.body.overview.recent_transactions).toEqual([]);
  });

  it("lists categories and accounts", async () => {
    const categories = await request(app).get("/api/categories").set("Authorization", `Bearer ${accessToken}`).expect(200);
    incomeCategoryId = categories.body.categories.find((category: { type: string }) => category.type === "income").id;
    expenseCategoryId = categories.body.categories.find((category: { type: string }) => category.type === "expense").id;
    const accounts = await request(app).get("/api/accounts").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(accounts.body.accounts[0].id).toBe(accountId);
  });

  it("creates income and expense, then lists movements", async () => {
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ accountId, categoryId: incomeCategoryId, type: "income", title: "Sueldo", amount: 500, currency: "UYU", date: new Date().toISOString() })
      .expect(201);
    const expense = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ accountId, categoryId: expenseCategoryId, type: "expense", title: "Cafe", amount: 100, currency: "UYU", date: new Date().toISOString() })
      .expect(201);
    transactionId = expense.body.transaction.id;
    const list = await request(app).get("/api/transactions").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(list.body.transactions.length).toBe(2);
  });

  it("edits, deletes and calculates overview", async () => {
    await request(app).patch(`/api/transactions/${transactionId}`).set("Authorization", `Bearer ${accessToken}`).send({ amount: 120 }).expect(200);
    await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    await request(app).delete(`/api/transactions/${transactionId}`).set("Authorization", `Bearer ${accessToken}`).expect(200);
  });

  it("persists a custom category without duplicating it", async () => {
    const body = { name: "Mascotas", type: "expense", icon: "paw", color: "lime" };
    const first = await request(app).post("/api/categories").set("Authorization", `Bearer ${accessToken}`).send(body).expect(201);
    const second = await request(app).post("/api/categories").set("Authorization", `Bearer ${accessToken}`).send(body).expect(201);
    expect(second.body.category.id).toBe(first.body.category.id);
    const categories = await request(app).get("/api/categories?type=expense").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(categories.body.categories.filter((category: { name: string }) => category.name === "Mascotas")).toHaveLength(1);
  });

  it("creates one movement when a scheduled payment is paid twice", async () => {
    const due = new Date();
    const payment = await request(app).post("/api/finance/recurring-payments").set("Authorization", `Bearer ${accessToken}`).send({ accountId, categoryId: expenseCategoryId, merchant: "Internet", category: "Servicios", amount: 180, currency: "UYU", frequency: "monthly", nextChargeDate: due.toISOString(), reminderDaysBefore: 1, notificationsEnabled: true }).expect(201);
    const id = payment.body.payment.id;
    const first = await request(app).post(`/api/finance/recurring-payments/${id}/pay`).set("Authorization", `Bearer ${accessToken}`).expect(200);
    const second = await request(app).post(`/api/finance/recurring-payments/${id}/pay`).set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(second.body.transactionId).toBe(first.body.transactionId);
    const transactions = await request(app).get("/api/transactions").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(transactions.body.transactions.filter((transaction: { scheduledPaymentId?: string }) => transaction.scheduledPaymentId === id)).toHaveLength(1);
  });

  it("creates and updates a goal with persisted progress", async () => {
    await request(app)
      .post("/api/finance/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "", target: 0, saved: -1, currency: "UYU" })
      .expect(400);

    const created = await request(app)
      .post("/api/finance/goals")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Viaje", target: 10000, saved: 1500, currency: "UYU", targetDate: new Date(Date.now() + 90 * 86_400_000).toISOString() })
      .expect(201);
    goalId = created.body.goal.id;
    expect(created.body.goal).toMatchObject({ name: "Viaje", saved: 1500, status: "active", target: 10000 });

    const contribution = await request(app)
      .post(`/api/finance/goals/${goalId}/contributions`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 2500 })
      .expect(200);
    expect(contribution.body.goal.saved).toBe(4000);
    expect(contribution.body.goal.history).toHaveLength(1);
  });

  it("creates a purchase in installments and exposes it to the calendar", async () => {
    await request(app)
      .post("/api/finance/installment-purchases")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "", totalAmount: 0, totalInstallments: 0, firstDueDate: "bad-date", category: "", cardName: "", currency: "UYU" })
      .expect(400);

    const firstDueDate = new Date();
    firstDueDate.setHours(12, 0, 0, 0);
    const created = await request(app)
      .post("/api/finance/installment-purchases")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        accountId,
        name: "Notebook",
        totalAmount: 1000,
        totalInstallments: 3,
        firstDueDate: firstDueDate.toISOString(),
        category: "Compras",
        cardName: "Visa test",
        currency: "UYU",
        reminderDaysBefore: 1
      })
      .expect(201);
    installmentPurchaseId = created.body.purchase.id;
    installmentId = created.body.purchase.installments[0].id;
    expect(created.body.purchase.installments.map((item: { amount: number }) => item.amount)).toEqual([333.33, 333.33, 333.34]);

    const extended = await request(app).get("/api/finance/extended").set("Authorization", `Bearer ${accessToken}`).expect(200);
    const purchase = extended.body.installmentPurchases.find((item: { id: string }) => item.id === installmentPurchaseId);
    expect(purchase.installments).toHaveLength(3);
    expect(purchase.installments[0].dueDate.slice(0, 10)).toBe(firstDueDate.toISOString().slice(0, 10));
  });

  it("delivers a reminder and opens a related installment", async () => {
    const response = await request(app).get("/api/notifications").set("Authorization", `Bearer ${accessToken}`).expect(200);
    const reminder = response.body.notifications.find((item: { relatedEntityId?: string; metadata?: { installmentId?: string } }) =>
      item.relatedEntityId === installmentPurchaseId && item.metadata?.installmentId === installmentId
    );
    expect(reminder).toBeTruthy();
    expect(reminder.relatedEntityType).toBe("installment");
    expect(reminder.actionType).toBe("open_installment");
  });

  it("marks an installment paid once even after a repeated request", async () => {
    await request(app)
      .post(`/api/finance/installment-purchases/${installmentPurchaseId}/installments/${installmentId}/pay`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    await request(app)
      .post(`/api/finance/installment-purchases/${installmentPurchaseId}/installments/${installmentId}/pay`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const transactions = await request(app).get("/api/transactions?limit=500").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(transactions.body.transactions.filter((transaction: { title: string }) => transaction.title === "Notebook · Cuota 1 de 3")).toHaveLength(1);
  });

  it("updates statistics after creating, editing and deleting a movement", async () => {
    const before = await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    const created = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ accountId, categoryId: expenseCategoryId, type: "expense", title: "Prueba estadística", amount: 50, currency: "UYU", date: new Date().toISOString() })
      .expect(201);
    const afterCreate = await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(afterCreate.body.overview.expenses - before.body.overview.expenses).toBe(50);
    expect(afterCreate.body.overview.transaction_count - before.body.overview.transaction_count).toBe(1);

    await request(app)
      .patch(`/api/transactions/${created.body.transaction.id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 75 })
      .expect(200);
    const afterEdit = await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(afterEdit.body.overview.expenses - before.body.overview.expenses).toBe(75);

    await request(app).delete(`/api/transactions/${created.body.transaction.id}`).set("Authorization", `Bearer ${accessToken}`).expect(200);
    const afterDelete = await request(app).get("/api/statistics/overview?period=30d").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(afterDelete.body.overview.expenses).toBe(before.body.overview.expenses);
    expect(afterDelete.body.overview.transaction_count).toBe(before.body.overview.transaction_count);
  });

  it("rejects invalid movement forms with useful validation errors", async () => {
    const invalid = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ accountId: "invalid", type: "expense", title: "", amount: 0, currency: "BAD", date: "not-a-date" })
      .expect(400);
    expect(invalid.body.message).toBeTruthy();
  });

  it("does not duplicate a manual movement when the same request is retried", async () => {
    const clientRequestId = `test-retry-${Date.now()}`;
    const body = {
      accountId,
      categoryId: expenseCategoryId,
      type: "expense",
      title: "Compra con reintento",
      amount: 25,
      currency: "UYU",
      date: new Date().toISOString(),
      clientRequestId
    };
    const first = await request(app).post("/api/transactions").set("Authorization", `Bearer ${accessToken}`).send(body).expect(201);
    const second = await request(app).post("/api/transactions").set("Authorization", `Bearer ${accessToken}`).send(body).expect(201);
    expect(second.body.transaction.id).toBe(first.body.transaction.id);
    const list = await request(app).get("/api/transactions?limit=500").set("Authorization", `Bearer ${accessToken}`).expect(200);
    expect(list.body.transactions.filter((transaction: { title: string }) => transaction.title === body.title)).toHaveLength(1);
  });

  it("answers greetings conversationally without unsolicited financial data", async () => {
    const response = await request(app).post("/api/ai/chat").set("Authorization", `Bearer ${accessToken}`).send({ message: "Hola", history: [] }).expect(200);
    expect(response.body.text).toContain("¡Hola!");
    expect(response.body.text).not.toMatch(/ingresos por|gastos por|saldo del período/i);
    expect(response.body.blocks).toEqual([]);
  });

  it("answers with registered values and does not invent totals", async () => {
    const list = await request(app).get("/api/transactions?limit=500").set("Authorization", `Bearer ${accessToken}`).expect(200);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const expected = list.body.transactions
      .filter((transaction: { date: string; type: string }) => transaction.type === "expense" && new Date(transaction.date) >= monthStart && new Date(transaction.date) < nextMonth)
      .reduce((sum: number, transaction: { rawAmount: number }) => sum + transaction.rawAmount, 0);
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ message: "¿Cuánto gasté este mes?", history: [] })
      .expect(200);
    expect(response.body.text).toContain(expected.toLocaleString("es-UY", { maximumFractionDigits: 2 }));
    expect(response.body.text).not.toMatch(/999[.\s]?999|mill[oó]n/i);
  });

  it("rotates refresh token and preserves data after new login", async () => {
    const refresh = await request(app).post("/api/auth/refresh").send({ refreshToken }).expect(200);
    accessToken = refresh.body.session.access_token;
    latestRefreshToken = refresh.body.session.refresh_token;
    const response = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
    latestRefreshToken = response.body.session.refresh_token;
    expect(response.body.profile.onboarding_completed).toBe(true);
  });

  it("invalidates refresh token on logout", async () => {
    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${accessToken}`).send({ refreshToken: latestRefreshToken }).expect(204);
    await request(app).post("/api/auth/refresh").send({ refreshToken: latestRefreshToken }).expect(401);
  });

  it("keeps second user isolated from first user data", async () => {
    const second = await request(app)
      .post("/api/auth/register")
      .send({ fullName: "Otra Persona", email: `second-${Date.now()}@finflow.local`, password, language: "es" })
      .expect(201);
    secondAccessToken = second.body.session.access_token;

    await request(app).get(`/api/accounts/${accountId}`).set("Authorization", `Bearer ${secondAccessToken}`).expect(404);
    const secondAccounts = await request(app).get("/api/accounts").set("Authorization", `Bearer ${secondAccessToken}`).expect(200);
    const secondTransactions = await request(app).get("/api/transactions").set("Authorization", `Bearer ${secondAccessToken}`).expect(200);
    const secondProfile = await request(app).get("/api/profile").set("Authorization", `Bearer ${secondAccessToken}`).expect(200);

    expect(secondAccounts.body.accounts).toEqual([]);
    expect(secondTransactions.body.transactions).toEqual([]);
    expect(secondProfile.body.profile.user_id).toBe(second.body.user.id);
  });

  it("prevents the sample user from spending more than completed monthly income", async () => {
    const demo = await request(app).post("/api/auth/register").send({ fullName: "Usuario Demo", email: "ejemplo@gmail.com", password, language: "es" }).expect(201);
    const token = demo.body.session.access_token;
    const onboarding = await request(app).post("/api/profile/onboarding").set("Authorization", `Bearer ${token}`).send({ countryCode: "UY", language: "es", primaryCurrency: "UYU", initialBalance: 0, antExpenseThreshold: 500 }).expect(200);
    const demoAccountId = onboarding.body.account.id;
    const categoryResponse = await request(app).get("/api/categories").set("Authorization", `Bearer ${token}`).expect(200);
    const incomeId = categoryResponse.body.categories.find((category: { type: string }) => category.type === "income").id;
    const expenseId = categoryResponse.body.categories.find((category: { type: string }) => category.type === "expense").id;
    const date = new Date().toISOString();
    await request(app).post("/api/transactions").set("Authorization", `Bearer ${token}`).send({ accountId: demoAccountId, categoryId: incomeId, type: "income", title: "Sueldo", amount: 58000, currency: "UYU", date }).expect(201);
    await request(app).post("/api/transactions").set("Authorization", `Bearer ${token}`).send({ accountId: demoAccountId, categoryId: expenseId, type: "expense", title: "Gastos pagados", amount: 39920, currency: "UYU", date }).expect(201);
    const rejected = await request(app).post("/api/transactions").set("Authorization", `Bearer ${token}`).send({ accountId: demoAccountId, categoryId: expenseId, type: "expense", title: "Sin saldo", amount: 20000, currency: "UYU", date }).expect(409);
    expect(rejected.body.message).toContain("Supera tu disponible por $U 1.920,00");
    await request(app).post("/api/transactions").set("Authorization", `Bearer ${token}`).send({ accountId: demoAccountId, categoryId: expenseId, type: "expense", title: "Compra válida", amount: 100, currency: "UYU", date }).expect(201);
    await request(app).post("/api/finance/recurring-payments").set("Authorization", `Bearer ${token}`).send({ accountId: demoAccountId, categoryId: expenseId, merchant: "Internet", category: "Servicios", amount: 1800, currency: "UYU", frequency: "monthly", nextChargeDate: date, reminderDaysBefore: 1 }).expect(201);
    const list = await request(app).get("/api/transactions").set("Authorization", `Bearer ${token}`).expect(200);
    const income = list.body.transactions.filter((transaction: { type: string }) => transaction.type === "income").reduce((sum: number, transaction: { rawAmount: number }) => sum + transaction.rawAmount, 0);
    const expenses = list.body.transactions.filter((transaction: { type: string }) => transaction.type === "expense").reduce((sum: number, transaction: { rawAmount: number }) => sum + transaction.rawAmount, 0);
    expect({ income, expenses, balance: income - expenses }).toEqual({ income: 58000, expenses: 40020, balance: 17980 });
  }, 15_000);
});

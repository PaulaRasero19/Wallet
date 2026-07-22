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
});

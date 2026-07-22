import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Account } from "../models/Account";
import { FinancialProfile } from "../models/FinancialProfile";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { ensureSystemCategories } from "../services/categorySeedService";
import { logger } from "../utils/logger";

const demoEmail = "demo@finflow.local";
const demoPassword = "Demo12345";

async function seed() {
  await connectDatabase();
  await ensureSystemCategories();

  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = await User.create({
      fullName: "Cuenta Demo",
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 12),
      emailVerified: true,
      isDemo: true,
      onboardingCompleted: true
    });
  }

  await FinancialProfile.updateOne(
    { userId: user._id },
    {
      countryCode: "UY",
      language: "es",
      locale: "es-UY",
      primaryCurrency: "UYU",
      secondaryCurrencies: ["USD"],
      incomeFrequency: "monthly",
      payday: 1,
      monthlyIncome: 85000,
      initialBalance: 22000,
      financialGoal: "controlar gastos",
      antExpenseThreshold: 450,
      notificationsEnabled: true,
      weeklySummaryEnabled: true
    },
    { upsert: true }
  );

  await Transaction.deleteMany({ userId: user._id });
  await Account.deleteMany({ userId: user._id });

  const account = await Account.create({
    userId: user._id,
    name: "Cuenta demo",
    type: "cash",
    currency: "UYU",
    initialBalance: 22000,
    currentBalance: 22000,
    isActive: true
  });

  logger.info("Demo seed created.", {
    email: demoEmail,
    password: demoPassword,
    accountId: account._id.toString()
  });

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("Demo seed failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  await disconnectDatabase();
  process.exit(1);
});

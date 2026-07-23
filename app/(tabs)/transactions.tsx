import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, layout, spacing, typography } from "../../src/theme";
import { Account, Currency, Transaction, TransactionType } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";
import { resolveMovementCategory } from "../../src/utils/transactionCategoryPresentation";

type MovementPeriod = "day" | "month" | "year";

function positiveAmount(transaction: Transaction) {
  return Math.abs(Number(transaction.rawAmount ?? transaction.raw_amount ?? transaction.amount ?? 0));
}

function transactionTypeLabel(type: TransactionType) {
  if (type === "income") return "Ingreso";
  if (type === "refund") return "Reintegro";
  if (type === "goal_contribution") return "Aporte a meta";
  if (type === "internal_transfer") return "Transferencia";
  if (type === "transfer") return "Transferencia";
  return "Gasto";
}

function initials(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) {
    const capitals = words[0].match(/[A-ZÁÉÍÓÚÑ]/g) || [];
    if (capitals.length >= 2) return `${capitals[0]}${capitals[capitals.length - 1]}`.toUpperCase();
  }
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function groupLabel(date: string) {
  const target = new Date(date);
  return target.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
}

function transactionId(transaction: Transaction) {
  return String(transaction.id || transaction._id || "");
}

function canOpenTransaction(transaction: Transaction) {
  return Boolean(transactionId(transaction));
}

function periodBounds(reference: Date, period: MovementPeriod, previous = false) {
  if (period === "day") {
    const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - (previous ? 1 : 0));
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) };
  }
  if (period === "year") {
    const year = reference.getFullYear() - (previous ? 1 : 0);
    return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
  }
  const month = reference.getMonth() - (previous ? 1 : 0);
  const start = new Date(reference.getFullYear(), month, 1);
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
}

function isInMovementPeriod(value: string, reference: Date, period: MovementPeriod) {
  const { start, end } = periodBounds(reference, period);
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function isInPreviousMovementPeriod(value: string, reference: Date, period: MovementPeriod) {
  const { start, end } = periodBounds(reference, period, true);
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function movementTotals(items: Transaction[]) {
  return items.reduce((totals, transaction) => {
    const amount = positiveAmount(transaction);
    if (transaction.type === "income" || transaction.type === "refund") totals.income += amount;
    else if (transaction.type === "expense") totals.expenses += amount;
    totals.balance = totals.income - totals.expenses;
    return totals;
  }, { balance: 0, expenses: 0, income: 0 });
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 100 : -100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function Transactions() {
  const { accounts, categories, loadAccounts, loadCategories, loadTransactions, transactions } = useFinFlowStore();
  const { profile } = useSessionStore();
  const [period, setPeriod] = useState<MovementPeriod>("month");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
    void loadTransactions();
  }, [loadAccounts, loadCategories, loadTransactions]);

  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const now = new Date();
  const currency = profile?.primary_currency || "UYU";
  const periodTransactions = useMemo(() => transactions.filter((transaction) => isInMovementPeriod(transaction.date, now, period)), [period, transactions]);
  const previousPeriodTransactions = useMemo(() => transactions.filter((transaction) => isInPreviousMovementPeriod(transaction.date, now, period)), [period, transactions]);
  const periodSummary = movementTotals(periodTransactions);
  const previousSummary = movementTotals(previousPeriodTransactions);
  const performance = percentageChange(periodSummary.balance, previousSummary.balance);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return periodTransactions.filter((transaction) => {
      const account = accountById.get(transaction.account_id || transaction.accountId || "");
      const category = categoryById.get(transaction.category_id || transaction.categoryId || "");
      const movementCategory = resolveMovementCategory(transaction, category);
      const haystack = [
        transaction.title,
        transaction.merchant,
        transaction.category,
        transaction.note,
        account?.name,
        account?.type,
        transaction.paymentMethod,
        transaction.payment_method,
        movementCategory.label
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (normalized && !haystack.includes(normalized)) return false;
      return true;
    });
  }, [accountById, categoryById, periodTransactions, query]);

  const grouped = useMemo(() => {
    const groups: Array<{ title: string; data: Transaction[] }> = [];
    visible.forEach((transaction) => {
      const label = groupLabel(transaction.date);
      const existing = groups.find((group) => group.title === label);
      if (existing) existing.data.push(transaction);
      else groups.push({ title: label, data: [transaction] });
    });
    return groups;
  }, [visible]);

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Movimientos</Text>
      <View style={styles.periodSelector}>
        {([["day", "Día"], ["month", "Mes"], ["year", "Año"]] as const).map(([value, label]) => <Pressable accessibilityRole="button" key={value} onPress={() => setPeriod(value)} style={[styles.periodOption, period === value && styles.activePeriod]}><Text style={[styles.periodText, period === value && styles.activePeriodText]}>{label}</Text></Pressable>)}
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryRows}>
          <Summary label="Gastos" tone="expense" value={formatMoney(periodSummary.expenses, currency, false)} />
          <Summary label="Ingresos" tone="income" value={formatMoney(periodSummary.income, currency, false)} />
          <Summary label="Balance" tone={periodSummary.balance >= 0 ? "income" : "expense"} value={formatMoney(periodSummary.balance, currency, false)} />
        </View>
      </View>

      <MovementPerformanceChart balance={periodSummary.balance} currency={currency} performance={performance} transactions={periodTransactions} />

      <View style={styles.searchWrap}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Buscar"
          placeholderTextColor={colors.grayMedium}
          style={styles.search}
          value={query}
        />
      </View>

      <View style={styles.list}>
        <Text style={styles.count}>{visible.length} movimientos</Text>
        {grouped.length ? (
          grouped.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.data.map((transaction) => (
                <TransactionRow
                  account={accountById.get(transaction.account_id || transaction.accountId || "")}
                  key={transaction.id}
                  onPress={() => {
                    const id = transactionId(transaction);
                    if (id) router.push({ pathname: "/transaction/[id]", params: { id } });
                  }}
                  transaction={transaction}
                />
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay movimientos para estos filtros.</Text>
        )}
      </View>

    </ScreenContainer>
  );
}

function MovementPerformanceChart({ balance, currency, performance, transactions }: { balance: number; currency: Currency; performance: number; transactions: Transaction[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(470, screenWidth - 32);
  const height = 215;
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = movementTotals(sorted).income;
  const allValues = [running, ...sorted.map((transaction) => {
    const amount = positiveAmount(transaction);
    if (transaction.type === "expense") running -= amount;
    return running;
  })];
  if (allValues.length === 1) allValues.push(0);
  const values = allValues.length <= 5 ? allValues : Array.from({ length: 5 }, (_, index) => allValues[Math.round(index * (allValues.length - 1) / 4)]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);
  const left = 20;
  const right = width - 20;
  const top = 68;
  const bottom = height - 56;
  const points = values.map((value, index) => ({
    x: left + (index / Math.max(1, values.length - 1)) * (right - left),
    y: bottom - ((value - minimum) / range) * (bottom - top)
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const positive = performance >= 0;
  const Trend = positive ? ArrowUp : ArrowDown;

  return (
    <View style={styles.performanceCard}>
      <AmountLavaBackground />
      <View style={styles.performanceHeader}>
        <Text style={styles.performanceLabel}>Rendimiento</Text>
      </View>
      <Text style={styles.performanceBalance}>{formatMoney(balance, currency, false)}</Text>
      <View style={styles.performanceChange}>
        <Trend color={positive ? colors.positive : colors.negative} size={15} strokeWidth={3} />
        <Text style={[styles.performancePercent, positive ? styles.income : styles.expense]}>{Math.abs(performance).toLocaleString("es-UY", { maximumFractionDigits: 1 })} %</Text>
      </View>
      <Svg height={height} style={styles.performanceSvg} width={width}>
        <Path d={path} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} />
        {points.map((point, index) => <SvgCircle cx={point.x} cy={point.y} fill="#FFFFFF" key={`${point.x}-${index}`} r={index === points.length - 1 ? 5 : 3.5} />)}
      </Svg>
    </View>
  );
}

function Summary({ label, tone, value }: { label: string; tone: "income" | "expense"; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone === "income" ? styles.income : styles.expense]}>{value}</Text>
    </View>
  );
}

function TransactionRow({ account, onPress, transaction }: { account?: Account; onPress: () => void; transaction: Transaction }) {
  const title = transaction.merchant || transaction.title || "Movimiento";
  const amount = positiveAmount(transaction);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const amountValue = isIncome ? amount : isTransfer ? 0 : -amount;
  const date = new Date(transaction.date).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  const accountLabel = account?.name || account?.type || "";
  const disabled = !canOpenTransaction(transaction);

  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.transactionRow, disabled && styles.disabledRow]}>
      <View style={[styles.initials, isIncome && styles.incomeInitials]}>
        <Text style={styles.initialsText}>{initials(title)}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.rowTitle, isIncome && styles.incomeRowCopy]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.rowMeta, isIncome && styles.incomeRowCopy]}>{date}</Text>
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.amount, isIncome ? styles.income : isTransfer ? styles.neutral : styles.expense]}>
          {isTransfer ? formatMoney(amount, transaction.currency, false) : formatMoney(amountValue, transaction.currency, true)}
        </Text>
        {accountLabel ? <Text numberOfLines={1} style={[styles.accountLabel, isIncome && styles.incomeRowCopy]}>{accountLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activePeriod: {
    backgroundColor: "#5A5A59"
  },
  activePeriodText: {
    fontWeight: "800"
  },
  amount: {
    ...typography.body,
    fontWeight: "900",
    textAlign: "right"
  },
  accountLabel: {
    ...typography.body,
    color: colors.white,
    marginTop: 2,
    textAlign: "right"
  },
  count: {
    ...typography.label,
    color: colors.transparentWhite,
    marginBottom: 22
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  },
  disabledRow: {
    opacity: 0.48
  },
  expense: {
    color: colors.negative
  },
  group: {
    marginTop: spacing.lg
  },
  groupTitle: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginBottom: 10,
    textTransform: "uppercase"
  },
  income: {
    color: colors.positive
  },
  incomeInitials: {
    backgroundColor: "#979797"
  },
  incomeRowCopy: {
    color: "#979797"
  },
  initials: {
    alignItems: "center",
    backgroundColor: "#D8D8D8",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  initialsText: {
    ...typography.label,
    color: "#1C1C1B",
    fontWeight: "900"
  },
  list: {
    marginTop: 27,
    paddingHorizontal: 6
  },
  performanceBalance: {
    ...typography.body,
    color: "rgba(255,255,255,0.82)",
    bottom: 13,
    fontWeight: "700",
    left: 20,
    position: "absolute",
    zIndex: 2
  },
  performanceCard: {
    borderRadius: 24,
    height: 215,
    marginTop: 25,
    overflow: "hidden",
    position: "relative"
  },
  performanceChange: {
    alignItems: "center",
    flexDirection: "row",
    bottom: 13,
    gap: 3,
    position: "absolute",
    right: 18,
    zIndex: 2
  },
  performanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 20,
    position: "absolute",
    right: 20,
    top: 17,
    zIndex: 2
  },
  performanceLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  performancePercent: {
    ...typography.body,
    fontWeight: "900"
  },
  performanceSvg: {
    bottom: 0,
    left: 0,
    position: "absolute"
  },
  periodOption: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    height: 44,
    justifyContent: "center",
    margin: 4
  },
  periodSelector: {
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 32,
    minHeight: 54,
    overflow: "hidden"
  },
  periodText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  neutral: {
    color: colors.transparentWhite
  },
  rowCopy: {
    flex: 1,
    minWidth: 0
  },
  rowEnd: {
    alignItems: "flex-end",
    maxWidth: "44%",
    minWidth: 112
  },
  rowMeta: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: 1
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
  },
  search: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    minHeight: 44
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: "#5A5A59",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 36,
    minHeight: 54,
    paddingHorizontal: 16
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: layout.mainScreenTop
  },
  screenTitle: {
    ...typography.title,
    color: colors.white
  },
  summary: {
    marginTop: 18
  },
  summaryItem: {
    flex: 1
  },
  summaryLabel: {
    ...typography.label,
    color: colors.transparentWhite
  },
  summaryRows: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryValue: {
    ...typography.body,
    fontWeight: "900"
  },
  transactionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    minHeight: 84,
    paddingVertical: 9
  },
});

import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SendHorizontal } from "lucide-react-native";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { categorySummary, getAntExpenses, overviewMetrics } from "../src/utils/financeInsights";
import { formatMoney } from "../src/utils/money";

const prompts = [
  "¿En qué gasté más?",
  "¿Cuánto puedo gastar por día?",
  "¿Voy a cumplir mi meta?",
  "¿Qué tengo comprometido?",
  "¿Cuáles son mis gastos hormiga?",
  "¿Cómo puedo ahorrar?"
];

export default function Insights() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { accounts, creditCards, events, goals, loadOverview, overview, recurringPayments, transactions } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const primaryCurrency = profile?.primary_currency || "UYU";
  const metrics = overviewMetrics({ accounts, creditCards, events, goals, overview, payday: profile?.payday, primaryCurrency, recurringPayments, transactions, monthlyIncome: Number(profile?.monthly_income || 0) });
  const categories = useMemo(() => categorySummary(transactions), [transactions]);
  const ant = useMemo(() => getAntExpenses(transactions), [transactions]);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  function ask(value = question) {
    const q = value.trim();
    if (!q) return;
    setQuestion(q);
    setAnswer(buildAnswer(q));
  }

  function buildAnswer(q: string) {
    const lower = q.toLowerCase();
    if (!transactions.length) return "Todavía no hay datos suficientes. Registrá movimientos reales para que FinFlow pueda responder con contexto.";
    if (lower.includes("gasté más") || lower.includes("gaste mas")) {
      const top = categories[0];
      return top ? `Tu mayor gasto es ${top.name}: ${formatMoney(top.total, primaryCurrency, false)}, ${top.percent}% del gasto del período.` : "No encontré gastos en el período.";
    }
    if (lower.includes("por día") || lower.includes("por dia")) {
      return `Podés gastar aproximadamente ${formatMoney(metrics.dailyLimit, primaryCurrency, false)} por día hasta el próximo cobro, considerando compromisos.`;
    }
    if (lower.includes("meta")) {
      const goal = goals[0];
      return goal ? `Tu meta "${goal.name}" está en ${Math.round((goal.saved / goal.target) * 100)}%. Te faltan ${formatMoney(goal.target - goal.saved, goal.currency, false)}.` : "No hay una meta activa para evaluar.";
    }
    if (lower.includes("comprometido")) {
      return `Tenés ${formatMoney(metrics.committed, primaryCurrency, false)} comprometidos entre pagos recurrentes y cuotas próximas.`;
    }
    if (lower.includes("hormiga")) {
      const total = ant.reduce((sum, item) => sum + Math.abs(item.raw_amount ?? item.rawAmount ?? item.amount), 0);
      return `Detecté ${ant.length} gastos hormiga por ${formatMoney(total, primaryCurrency, false)}. Reducir la mitad liberaría ${formatMoney(total * 0.5, primaryCurrency, false)}.`;
    }
    return metrics.priorityInsight;
  }

  return (
    <ScreenContainer>
      <Header title="Asistente" dark back />
      <Text style={styles.lead}>Preguntá sobre tus datos reales. Las respuestas usan movimientos, cuentas, metas y vencimientos cargados.</Text>
      <View style={styles.suggestions}>
        {prompts.map((prompt) => (
          <Pressable key={prompt} accessibilityRole="button" onPress={() => ask(prompt)} style={styles.prompt}>
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
      {answer ? (
        <View style={styles.answer}>
          <Text style={styles.answerTitle}>{question}</Text>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      ) : (
        <View style={styles.answer}>
          <Text style={styles.answerTitle}>Recomendación prioritaria</Text>
          <Text style={styles.answerText}>{metrics.priorityInsight}</Text>
        </View>
      )}
      <View style={styles.inputBar}>
        <InputField
          accessibilityLabel="Preguntale a FinFlow"
          onChangeText={setQuestion}
          placeholder="Preguntale a FinFlow..."
          style={styles.input}
          value={question}
        />
        <Pressable accessibilityRole="button" onPress={() => ask()} style={styles.send}>
          <SendHorizontal color={colors.black} size={18} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.lg
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  prompt: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  promptText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  answer: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderWidth: 1,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  answerTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  answerText: {
    ...typography.body,
    color: colors.transparentWhite
  },
  inputBar: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: 4
  },
  input: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.white,
    flex: 1,
    minHeight: 44
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  }
});

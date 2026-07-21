import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SendHorizontal } from "lucide-react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { DarkScreenContainer } from "../src/components/DarkScreenContainer";
import { Dot } from "../src/components/Dot";
import { DotGrid } from "../src/components/DotGrid";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { InsightCard } from "../src/components/InsightCard";
import { generateAdvisorResult } from "../src/services/aiAdvisorService";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";
import { MovementProposal } from "../src/types/finflow";
import { formatMoney } from "../src/utils/money";

export default function Insights() {
  const [question, setQuestion] = useState("Show me ways to save more");
  const [proposal, setProposal] = useState<MovementProposal | null>(null);
  const [typing, setTyping] = useState(false);
  const { addTask, addTransaction, aiMessages, addAiMessage, budgets, goals, transactions } = useFinFlowStore();

  async function ask() {
    if (!question.trim()) return;
    const prompt = question.trim();
    addAiMessage({ role: "user", text: prompt });
    setQuestion("");
    setProposal(null);
    setTyping(true);
    const result = await generateAdvisorResult(prompt, { budgets, goals, transactions });
    addAiMessage({
      role: "assistant",
      text: `${result.summary}\n${result.recommendedActions[0]}`,
      progress: result.riskLevel === "High" ? 86 : 58
    });
    setTyping(false);
  }

  function confirmProposal() {
    if (!proposal) return;
    if (proposal.type === "task") {
      addTask({
        title: proposal.reminderText || proposal.merchant,
        date: proposal.date,
        time: "10:00 AM",
        category: "Reminder",
        reminder: true,
        note: "Created from natural language.",
        accent: "blue"
      });
    } else {
      addTransaction({
        merchant: proposal.merchant,
        category: proposal.category,
        date: proposal.date,
        time: "9:41 AM",
        amount: proposal.amount,
        currency: proposal.currency,
        type: proposal.type,
        accent: proposal.isAntExpense ? "orange" : proposal.type === "income" ? "lime" : "black",
        accountId: proposal.accountId,
        isAntExpense: proposal.isAntExpense,
        installment: proposal.installments
      });
    }
    setProposal(null);
    Alert.alert("FinFlow", "Confirmed. The movement was saved after your approval.");
  }

  return (
    <DarkScreenContainer>
      <Header title="Insights" dark back />
      <View style={styles.messages}>
        {aiMessages.map((message) => (
          <Animated.View key={message.id} entering={FadeInUp.duration(280)}>
            <InsightCard message={message} />
          </Animated.View>
        ))}
        {typing ? (
          <Animated.View entering={FadeIn.duration(220)} style={styles.typing}>
            <DotGrid columns={3} dotSize={7} gap={7} matrix={["white", "white", "white"]} animated />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.inputBar}>
        <InputField
          accessibilityLabel="Ask FinFlow anything"
          onChangeText={setQuestion}
          placeholder="Ask FinFlow anything..."
          style={styles.input}
          value={question}
        />
        <Pressable accessibilityRole="button" onPress={ask} style={styles.send}>
          <SendHorizontal color={colors.black} size={18} />
        </Pressable>
      </View>
      {proposal ? (
        <View style={styles.proposal}>
          <Text style={styles.proposalTitle}>Structured proposal</Text>
          <Text style={styles.proposalLine}>Type: {proposal.type}</Text>
          <Text style={styles.proposalLine}>Merchant: {proposal.merchant}</Text>
          <Text style={styles.proposalLine}>Amount: {formatMoney(proposal.amount, proposal.currency)}</Text>
          <Text style={styles.proposalLine}>Category: {proposal.category}</Text>
          <Text style={styles.proposalLine}>Account: {proposal.accountId}</Text>
          <Text style={styles.proposalLine}>Ant expense: {proposal.isAntExpense ? "yes" : "no"}</Text>
          {proposal.installments ? (
            <Text style={styles.proposalLine}>
              Installments: {proposal.installments.current}/{proposal.installments.total} · {formatMoney(proposal.installments.amountPerInstallment, proposal.currency, false)}
            </Text>
          ) : null}
          <View style={styles.proposalActions}>
            <Pressable accessibilityRole="button" onPress={confirmProposal} style={styles.confirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setProposal(null)} style={styles.reject}>
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.source}>
        <Dot color="lime" size={6} />
        <Text style={styles.sourceText}>AI works with Gemini backend or local fallback.</Text>
      </View>
    </DarkScreenContainer>
  );
}

const styles = StyleSheet.create({
  messages: {
    marginTop: spacing.xl
  },
  typing: {
    alignSelf: "flex-start",
    backgroundColor: colors.darkSurface,
    borderColor: colors.grayDark,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md
  },
  inputBar: {
    alignItems: "center",
    borderColor: colors.grayDark,
    borderRadius: 24,
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
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  source: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  sourceText: {
    ...typography.label,
    color: colors.transparentWhite
  },
  proposal: {
    backgroundColor: colors.white,
    borderRadius: 18,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.md
  },
  proposalTitle: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600",
    marginBottom: spacing.xs
  },
  proposalLine: {
    ...typography.label,
    color: colors.grayDark
  },
  proposalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  confirm: {
    backgroundColor: colors.black,
    borderRadius: 16,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  confirmText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "600"
  },
  reject: {
    borderColor: colors.grayLight,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  rejectText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  }
});

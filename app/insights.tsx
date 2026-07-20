import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

export default function Insights() {
  const [question, setQuestion] = useState("Show me ways to save more");
  const [typing, setTyping] = useState(false);
  const { aiMessages, addAiMessage, budgets, goals, transactions } = useFinFlowStore();

  async function ask() {
    if (!question.trim()) return;
    const prompt = question.trim();
    addAiMessage({ role: "user", text: prompt });
    setQuestion("");
    setTyping(true);
    const result = await generateAdvisorResult(prompt, { budgets, goals, transactions });
    addAiMessage({
      role: "assistant",
      text: `${result.summary}\n${result.recommendedActions[0]}`,
      progress: result.riskLevel === "High" ? 86 : 58
    });
    setTyping(false);
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
  }
});

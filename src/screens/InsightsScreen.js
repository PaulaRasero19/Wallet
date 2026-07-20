import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { InsightCard } from "../components/InsightCard";
import { insights } from "../data/insights";
import { generateAdvisorResult } from "../services/aiAdvisorService";
import { globalStyles } from "../styles/globalStyles";
import { colors, spacing } from "../styles/theme";

export function InsightsScreen() {
  const [question, setQuestion] = useState("Como puedo ahorrar mas este mes?");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleGenerateAdvice() {
    setIsLoading(true);
    const result = await generateAdvisorResult(question);
    setAnalysis(result);
    setIsLoading(false);
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Insights de IA</Text>
      <Text style={globalStyles.subtitle}>
        Asesor financiero que analiza presupuesto, gastos, suscripciones y objetivos para generar recomendaciones.
      </Text>

      <Card style={styles.advisorCard}>
        <Text style={styles.cardTitle}>Asesor FinFlow IA</Text>
        <Text style={styles.description}>
          Escribi una pregunta o usa la consulta sugerida. La respuesta se genera desde Gemini si el backend tiene API key, o desde el motor IA local si no hay key.
        </Text>
        <TextInput
          multiline
          onChangeText={setQuestion}
          placeholder="Ej: Como llego mejor a fin de mes?"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={question}
        />
        <AppButton
          loading={isLoading}
          onPress={handleGenerateAdvice}
          title="Generar recomendacion IA"
        />
      </Card>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Analizando tus datos...</Text>
        </View>
      ) : null}

      {analysis ? (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Resultado IA</Text>
            <Text style={styles.source}>{analysis.source}</Text>
          </View>
          <Text style={styles.summary}>{analysis.summary}</Text>
          <Text style={styles.risk}>Riesgo mensual: {analysis.riskLevel}</Text>
          <Text style={styles.answer}>{analysis.answer}</Text>
          {analysis.recommendedActions?.map((action) => (
            <Text key={action} style={styles.action}>- {action}</Text>
          ))}
          <Text style={styles.notification}>{analysis.notificationSuggestion}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Insights predefinidos</Text>
      {insights.map((message) => (
        <InsightCard key={message} message={message} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  advisorCard: {
    marginTop: spacing.md
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    marginVertical: spacing.md,
    minHeight: 84,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  loading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14
  },
  resultCard: {
    marginTop: spacing.md
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  resultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  source: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md
  },
  risk: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  answer: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm
  },
  action: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs
  },
  notification: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  }
});

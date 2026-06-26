import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { categories } from "../data/categories";
import { colors, spacing } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { formatCurrency, getProgress } from "../utils/formatters";

export function BudgetScreen() {
  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Presupuesto</Text>
      <Text style={globalStyles.subtitle}>Categorias principales y avance del gasto mensual.</Text>
      {categories.map((category) => {
        const progress = getProgress(category.spent, category.budget);
        const progressColor = progress > 85 ? colors.warning : colors.primary;

        return (
          <Card key={category.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{category.name}</Text>
              <Text style={styles.percent}>{progress}%</Text>
            </View>
            <Text style={styles.amount}>
              {formatCurrency(category.spent)} de {formatCurrency(category.budget)}
            </Text>
            <ProgressBar progress={progress} color={progressColor} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  percent: {
    color: colors.primary,
    fontWeight: "800"
  },
  amount: {
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  }
});

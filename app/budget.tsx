import { StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";

export default function Budget() {
  const budgets = useFinFlowStore((state) => state.budgets);

  return (
    <ScreenContainer>
      <Header title="Presupuesto" back />
      <View style={styles.panel}>
        <Text style={styles.title}>{budgets.length === 0 ? "Sin presupuesto configurado" : "Presupuesto"}</Text>
        <Text style={styles.body}>Los presupuestos reales contra Supabase se implementan en la fase 2.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title
  },
  body: {
    ...typography.body,
    color: colors.grayDark
  }
});

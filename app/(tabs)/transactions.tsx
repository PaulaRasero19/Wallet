import { StyleSheet, Text, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Transactions() {
  const transactions = useFinFlowStore((state) => state.transactions);

  return (
    <ScreenContainer>
      <Header title="Movimientos" />
      <View style={styles.panel}>
        <Text style={styles.section}>
          {transactions.length === 0 ? "Todavía no registraste movimientos." : "Movimientos cargados"}
        </Text>
        <Text style={styles.empty}>El CRUD real contra Supabase se implementa en la fase 2.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600",
    marginTop: spacing.xl
  },
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  empty: {
    ...typography.body,
    color: colors.grayDark
  }
});

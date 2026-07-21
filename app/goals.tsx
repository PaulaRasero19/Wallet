import { StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";

export default function Goals() {
  const goals = useFinFlowStore((state) => state.goals);

  return (
    <ScreenContainer>
      <Header title="Metas" back />
      <View style={styles.panel}>
        <Text style={styles.title}>{goals.length === 0 ? "Sin metas configuradas" : "Metas"}</Text>
        <Text style={styles.body}>Las metas reales contra Supabase se implementan en la fase 2.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
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

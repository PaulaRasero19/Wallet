import { StyleSheet, Text, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { translate } from "../../src/i18n";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Add() {
  const language = useSessionStore((state) => state.language);
  const t = (key: string) => translate(language, key);

  return (
    <ScreenContainer>
      <Header title="Agregar" />
      <View style={styles.empty}>
        <Text style={styles.title}>Movimientos reales en fase 2</Text>
        <Text style={styles.body}>
          {t("dashboard.addInitial")} Esta pantalla no guarda datos financieros localmente.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: {
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
    color: colors.black
  }
});

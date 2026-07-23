import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { colors, spacing, typography } from "../src/theme";

export default function Welcome() {
  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Text style={styles.title}>
          Bienvenida a{"\n"}
          <Text style={styles.brandFin}>Fin</Text>
          <Text style={styles.brandFlow}>Flow</Text>
        </Text>
        <Text style={styles.subtitle}>Organizá tu dinero de forma simple.</Text>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton onPress={() => router.push("/login")} style={styles.button}>Comenzar</PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.appGray,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  center: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: 70
  },
  title: {
    ...typography.display,
    color: colors.white,
    fontSize: 40,
    lineHeight: 43,
    textAlign: "center"
  },
  brandFin: { color: colors.white, fontWeight: "800" },
  brandFlow: { color: colors.brandOrange, fontWeight: "800" },
  bottom: {
    bottom: 48,
    left: spacing.xl,
    position: "absolute",
    right: spacing.xl
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite,
    textAlign: "center"
  },
  button: { backgroundColor: "#C2C2C2", minHeight: 62 }
});

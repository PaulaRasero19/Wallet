import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { colors, spacing } from "../styles/theme";

export function SplashScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.logo}>FinFlow</Text>
        <Text style={styles.tagline}>Tu dinero, en flujo inteligente.</Text>
      </View>
      <AppButton title="Continuar" onPress={() => navigation.replace("Onboarding")} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  logo: {
    color: colors.primary,
    fontSize: 44,
    fontWeight: "800",
    textAlign: "center"
  },
  tagline: {
    color: colors.text,
    fontSize: 17,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  button: {
    marginTop: spacing.xl,
    width: "100%"
  }
});

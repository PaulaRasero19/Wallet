import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { DotLogo } from "../src/components/DotLogo";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { colors, spacing, typography } from "../src/theme";

export default function Welcome() {
  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <DotLogo />
        <Text style={styles.title}>Welcome to{"\n"}FinFlow</Text>
        <Text style={styles.subtitle}>Take control of your finances{"\n"}and time.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton onPress={() => router.replace("/(tabs)/overview")}>Get Started</PrimaryButton>
        <SecondaryButton onPress={() => router.replace("/(tabs)/overview")}>Continue with Apple</SecondaryButton>
        <SecondaryButton onPress={() => router.replace("/(tabs)/overview")}>G Continue with Google</SecondaryButton>
        <SecondaryButton onPress={() => router.push("/login")}>Log in</SecondaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingTop: 118
  },
  top: {
    alignItems: "center",
    gap: spacing.lg
  },
  title: {
    ...typography.title,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center"
  },
  subtitle: {
    ...typography.label,
    color: colors.black,
    textAlign: "center"
  },
  actions: {
    gap: spacing.sm,
    width: "100%"
  }
});

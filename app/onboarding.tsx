import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { DotComposition } from "../src/components/DotGrid";
import { PageIndicator } from "../src/components/PageIndicator";
import { setHasSeenOnboarding } from "../src/services/onboardingStorage";
import { colors, spacing, typography } from "../src/theme";

const pages = [
  {
    title: "Controlá tu\ndinero",
    subtitle: "Organizá tus ingresos, gastos y\npagos desde un solo lugar.",
    variant: 1
  },
  {
    title: "Anticipate a\ntus gastos",
    subtitle: "Recibí alertas antes de tus\npagos y vencimientos.",
    variant: 2
  },
  {
    title: "Decidí con\nayuda de IA",
    subtitle: "Obtené análisis y recomendaciones\nbasados en tus movimientos.",
    variant: 3
  }
] as const;

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const page = pages[index];

  async function next() {
    if (index === pages.length - 1) {
      await setHasSeenOnboarding();
      router.replace("/welcome");
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>FINFLOW</Text>
        <Text style={styles.step}>{String(index + 1).padStart(2, "0")} / 03</Text>
      </View>
      <Animated.View entering={FadeInRight.delay(100).duration(420)} key={page.variant} style={styles.visual}>
        <LinearGradient colors={["#250000", "#A91409", "#EF4505", "#DCB800"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
        <DotComposition variant={page.variant} />
      </Animated.View>
      <Animated.View entering={FadeInRight.duration(420)} key={page.title} style={styles.copy}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </Animated.View>
      <View style={styles.footer}>
        <PageIndicator total={3} active={index} light />
        <Pressable accessibilityRole="button" onPress={next} style={styles.next}>
          <ArrowRight color={colors.black} size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#1C1C1B",
    flex: 1,
    padding: spacing.xl,
    paddingBottom: 42,
    paddingTop: 62
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800",
    letterSpacing: 2
  },
  step: {
    ...typography.label,
    color: colors.transparentWhite
  },
  visual: {
    alignItems: "center",
    borderRadius: 36,
    height: 330,
    justifyContent: "center",
    marginTop: spacing.xl,
    overflow: "hidden"
  },
  copy: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  title: {
    ...typography.display,
    color: colors.white
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: spacing.xl
  },
  next: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 29,
    height: 58,
    justifyContent: "center",
    width: 58
  }
});

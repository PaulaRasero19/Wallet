import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import { DotComposition } from "../src/components/DotGrid";
import { PageIndicator } from "../src/components/PageIndicator";
import { colors, spacing, typography } from "../src/theme";

const pages = [
  {
    title: "Track what\nmatters",
    subtitle: "All your finances in one\nbeautiful, simple overview.",
    variant: 1
  },
  {
    title: "Plan with\nclarity",
    subtitle: "Organize goals, habits, and\nroutines that move you forward.",
    variant: 2
  },
  {
    title: "Let AI guide\nyou",
    subtitle: "Smart insights and gentle nudges\nto help you make better decisions.",
    variant: 3
  }
] as const;

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const page = pages[index];

  function next() {
    if (index === pages.length - 1) {
      router.replace("/welcome");
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeInRight.duration(420)} key={page.title} style={styles.copy}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </Animated.View>
      <Animated.View entering={FadeInRight.delay(100).duration(420)} key={page.variant}>
        <DotComposition variant={page.variant} />
      </Animated.View>
      <View style={styles.footer}>
        <PageIndicator total={3} active={index} />
        <Pressable accessibilityRole="button" onPress={next} style={styles.next}>
          <ArrowRight color={colors.white} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingTop: 86
  },
  copy: {
    gap: spacing.sm
  },
  title: {
    ...typography.display
  },
  subtitle: {
    ...typography.body,
    color: colors.black
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  next: {
    alignItems: "center",
    backgroundColor: colors.black,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48
  }
});

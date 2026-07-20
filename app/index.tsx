import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { colors, spacing, typography } from "../src/theme";
import { DotLogo } from "../src/components/DotLogo";

export default function Splash() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace("/onboarding"), 1900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.center}>
        <DotLogo light />
        <Animated.Text entering={FadeIn.delay(700).duration(550)} style={styles.logo}>
          FinFlow
        </Animated.Text>
      </View>
      <Animated.Text entering={FadeInUp.delay(1000).duration(520)} style={styles.tagline}>
        Finance. Focus. Flow.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.black,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl
  },
  time: {
    ...typography.label,
    alignSelf: "flex-start",
    color: colors.white,
    marginTop: spacing.sm
  },
  center: {
    alignItems: "center",
    gap: spacing.lg
  },
  logo: {
    ...typography.title,
    color: colors.white
  },
  tagline: {
    ...typography.label,
    color: colors.white,
    marginBottom: spacing.xl
  }
});

import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from "react-native-reanimated";
import { FlowMark } from "../src/components/prelogin/FlowMark";
import { PreloginLiquidBackground } from "../src/components/prelogin/PreloginLiquidBackground";
import { getHasSeenOnboarding } from "../src/services/onboardingStorage";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, typography } from "../src/theme";

const introDuration = 3600;

export default function Splash() {
  const { hasInitialized, profile, status } = useSessionStore();
  const startedAt = useRef(Date.now());
  const iconProgress = useSharedValue(0);
  const gradientProgress = useSharedValue(0);

  useEffect(() => {
    iconProgress.value = withDelay(260, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    gradientProgress.value = withDelay(340, withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }));
  }, [gradientProgress, iconProgress]);

  useEffect(() => {
    if (!hasInitialized) return;
    const remaining = Math.max(introDuration - (Date.now() - startedAt.current), 120);
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        router.replace(profile?.profile_setup_completed || profile?.onboarding_completed ? "/(tabs)/overview" : "/setup");
        return;
      }
      void getHasSeenOnboarding().then((hasSeen) => router.replace(hasSeen ? "/welcome" : "/onboarding"));
    }, remaining);
    return () => clearTimeout(timer);
  }, [hasInitialized, profile?.onboarding_completed, profile?.profile_setup_completed, status]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconProgress.value,
    transform: [{ scale: 0.92 + iconProgress.value * 0.08 }]
  }));
  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientProgress.value * 0.84
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.risingGradient, gradientStyle]}>
        <PreloginLiquidBackground variant="splash" />
      </Animated.View>

      <View style={styles.center}>
        <View style={styles.markStage}>
          <Animated.View style={[styles.mark, iconStyle]}><FlowMark size={70} /></Animated.View>
        </View>
        <Animated.Text entering={FadeIn.delay(1380).duration(720)} style={styles.logo}>
          <Text style={styles.logoFin}>Fin</Text>
          <Text style={styles.logoFlow}>Flow</Text>
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(1900).duration(650)} style={styles.tagline}>Finance. Focus. Flow.</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", backgroundColor: "#1C1C1B", flex: 1, justifyContent: "center", overflow: "hidden" },
  risingGradient: { ...StyleSheet.absoluteFillObject },
  center: { alignItems: "center", zIndex: 1 },
  markStage: { alignItems: "center", height: 130, justifyContent: "center", width: 150 },
  mark: { alignItems: "center", justifyContent: "center" },
  logo: { ...typography.display, color: colors.white, fontSize: 36, lineHeight: 40, marginTop: 6 },
  logoFin: { color: colors.white, fontWeight: "800" },
  logoFlow: { color: colors.brandOrange, fontWeight: "800" },
  tagline: { ...typography.label, color: colors.transparentWhite, letterSpacing: 1.2, marginTop: 10 }
});

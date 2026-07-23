import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedWarmBackground } from "./AnimatedWarmBackground";

type Variant = "login" | "onboarding" | "register" | "splash";

const masks: Record<Variant, { colors: [string, string, ...string[]]; locations: [number, number, ...number[]] }> = {
  onboarding: {
    colors: ["rgba(28,28,27,0.58)", "rgba(28,28,27,0.74)", "rgba(28,28,27,0.9)", "rgba(28,28,27,0.98)", "#1C1C1B"],
    locations: [0, 0.16, 0.34, 0.54, 1]
  },
  login: {
    colors: ["#1C1C1B", "rgba(28,28,27,0.99)", "rgba(28,28,27,0.86)", "rgba(28,28,27,0.63)", "rgba(28,28,27,0.43)"],
    locations: [0, 0.42, 0.62, 0.82, 1]
  },
  register: {
    colors: ["#1C1C1B", "rgba(28,28,27,0.96)", "rgba(28,28,27,0.68)", "rgba(28,28,27,0.42)", "rgba(28,28,27,0.26)"],
    locations: [0, 0.24, 0.46, 0.72, 1]
  },
  splash: {
    colors: ["#1C1C1B", "#1C1C1B", "rgba(28,28,27,0.94)", "rgba(28,28,27,0.52)", "rgba(28,28,27,0.12)"],
    locations: [0, 0.08, 0.26, 0.58, 1]
  }
};

export function PreloginLiquidBackground({ variant = "login" }: { variant?: Variant }) {
  const mask = masks[variant];
  const placement = variant === "splash"
    ? "bottomLeft"
    : variant === "onboarding"
      ? "topRight"
      : variant === "register"
        ? "bottomLeft"
        : "bottomRight";

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backgroundLayer]}>
      <AnimatedWarmBackground intensity={variant === "splash" || variant === "onboarding" ? "full" : "soft"} placement={placement} />
      <LinearGradient colors={mask.colors} locations={mask.locations} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundLayer: {
    zIndex: 0
  }
});

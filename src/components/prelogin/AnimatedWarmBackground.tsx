import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

export function AnimatedWarmBackground({ intensity = "full" }: { intensity?: "full" | "soft" }) {
  const drift = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 12_000, easing: Easing.inOut(Easing.sin) }), -1, true);
    breathe.value = withRepeat(withTiming(1, { duration: 8_000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [breathe, drift]);

  const lowerGlow = useAnimatedStyle(() => ({
    opacity: (intensity === "full" ? 0.82 : 0.58) + breathe.value * 0.1,
    transform: [{ translateY: 110 - drift.value * 190 }, { scale: 1 + breathe.value * 0.08 }]
  }));

  const sideGlow = useAnimatedStyle(() => ({
    opacity: (intensity === "full" ? 0.48 : 0.3) + drift.value * 0.08,
    transform: [{ translateY: 90 - breathe.value * 120 }, { translateX: -20 + drift.value * 38 }]
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#1C1C1B", "#1C1C1B", "#180B07", "#100000"]} locations={[0, 0.48, 0.76, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.lowerGlow, lowerGlow]}>
        <LinearGradient colors={["rgba(216,184,0,0)", "rgba(241,93,8,0.76)", "rgba(116,7,3,0.86)"]} end={{ x: 0.52, y: 0 }} start={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.sideGlow, sideGlow]}>
        <LinearGradient colors={["rgba(255,176,0,0.68)", "rgba(220,48,4,0.34)", "rgba(74,0,0,0)"]} end={{ x: 0, y: 0 }} start={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={["rgba(28,28,27,0.92)", "rgba(28,28,27,0.2)", "rgba(28,28,27,0.82)"]} locations={[0, 0.58, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  lowerGlow: {
    borderRadius: 360,
    bottom: -260,
    height: 760,
    left: -170,
    overflow: "hidden",
    position: "absolute",
    width: 760
  },
  sideGlow: {
    borderRadius: 260,
    bottom: 20,
    height: 520,
    overflow: "hidden",
    position: "absolute",
    right: -300,
    width: 520
  }
});

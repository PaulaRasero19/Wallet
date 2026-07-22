import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, DimensionValue, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

const grain = Array.from({ length: 90 }, (_, index) => ({
  left: `${(index * 41) % 100}%`,
  opacity: 0.035 + ((index * 5) % 8) / 100,
  top: `${(index * 59) % 100}%`
}));

export function LiquidGradientBackground() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const flow = useSharedValue(0);
  const dots = useMemo(() => grain, []);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    flow.value = reduceMotion ? 0.5 : withRepeat(withTiming(1, { duration: 36000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [flow, reduceMotion]);

  const redWash = useAnimatedStyle(() => ({
    opacity: interpolate(flow.value, [0, 1], [0.62, 0.82]),
    transform: [
      { translateX: interpolate(flow.value, [0, 1], [-18, 22]) },
      { translateY: interpolate(flow.value, [0, 1], [18, -14]) },
      { scale: interpolate(flow.value, [0, 1], [1.04, 1.12]) }
    ]
  }));

  const amberWash = useAnimatedStyle(() => ({
    opacity: interpolate(flow.value, [0, 1], [0.76, 0.92]),
    transform: [
      { translateX: interpolate(flow.value, [0, 1], [24, -16]) },
      { translateY: interpolate(flow.value, [0, 1], [-12, 18]) },
      { scale: interpolate(flow.value, [0, 1], [1.1, 0.98]) }
    ]
  }));

  const shadowWash = useAnimatedStyle(() => ({
    opacity: interpolate(flow.value, [0, 1], [0.5, 0.66]),
    transform: [
      { translateX: interpolate(flow.value, [0, 1], [-14, 18]) },
      { translateY: interpolate(flow.value, [0, 1], [-12, 16]) }
    ]
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#020202", "#100202", "#4E0504", "#C32208", "#FF6015", "#FFE25A"]} end={{ x: 0.98, y: 0.96 }} start={{ x: 0.06, y: 0.02 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.wash, styles.redWash, redWash]}>
        <LinearGradient colors={["rgba(30,0,0,0)", "rgba(117,7,7,0.52)", "rgba(255,66,13,0.6)", "rgba(255,133,21,0)"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.wash, styles.amberWash, amberWash]}>
        <LinearGradient colors={["rgba(255,225,70,0)", "rgba(255,199,42,0.46)", "rgba(255,89,13,0.26)", "rgba(255,225,70,0)"]} end={{ x: 0.86, y: 0.96 }} start={{ x: 0.12, y: 0.1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.wash, styles.shadowWash, shadowWash]}>
        <LinearGradient colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.34)", "rgba(0,0,0,0)"]} end={{ x: 0.8, y: 1 }} start={{ x: 0.05, y: 0.05 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={["rgba(0,0,0,0.78)", "rgba(0,0,0,0.12)", "rgba(255,185,48,0.1)"]} end={{ x: 0.62, y: 1 }} start={{ x: 0.04, y: 0.02 }} style={StyleSheet.absoluteFill} />
      <View style={styles.grain}>
        {dots.map((dot, index) => (
          <View key={`${dot.left}-${dot.top}-${index}`} style={[styles.grainDot, { left: dot.left as DimensionValue, opacity: dot.opacity, top: dot.top as DimensionValue }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amberWash: {
    bottom: -160,
    height: "120%",
    right: -180,
    width: "150%"
  },
  grain: {
    ...StyleSheet.absoluteFillObject
  },
  grainDot: {
    backgroundColor: "#FFFFFF",
    height: 1.2,
    position: "absolute",
    width: 1.2
  },
  redWash: {
    bottom: -40,
    height: "112%",
    left: -110,
    width: "150%"
  },
  shadowWash: {
    height: "122%",
    left: -160,
    top: -140,
    width: "150%"
  },
  wash: {
    overflow: "hidden",
    position: "absolute"
  }
});

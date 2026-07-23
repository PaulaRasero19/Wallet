import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, DimensionValue, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

const grainDots = Array.from({ length: 72 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  opacity: 0.04 + ((index * 7) % 9) / 100,
  top: `${(index * 53) % 100}%`
}));

export function AnimatedLavaBackground() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0.45;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [progress, reduceMotion]);

  const orangeBlob = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-38, 54]) },
      { translateY: interpolate(progress.value, [0, 1], [48, -28]) },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1.22]) }
    ]
  }));

  const goldBlob = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.82, 0.98]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [28, -16]) },
      { translateY: interpolate(progress.value, [0, 1], [-20, 26]) },
      { scale: interpolate(progress.value, [0, 1], [1.06, 0.92]) }
    ]
  }));

  const redBlob = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-18, 26]) },
      { translateY: interpolate(progress.value, [0, 1], [-18, 16]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1.1]) }
    ]
  }));

  const dots = useMemo(() => grainDots, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#1C1C1B", "#861301", "#D74902", "#FDC53B", "#FFF3AB"]} end={{ x: 1, y: 1 }} start={{ x: 0.12, y: 0.08 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blob, styles.redBlob, redBlob]} />
      <Animated.View style={[styles.blob, styles.orangeBlob, orangeBlob]} />
      <Animated.View style={[styles.blob, styles.goldBlob, goldBlob]} />
      <LinearGradient colors={["rgba(28,28,27,0.72)", "rgba(28,28,27,0.12)", "rgba(215,73,2,0.08)"]} end={{ x: 0.6, y: 1 }} start={{ x: 0.16, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={styles.grain}>
        {dots.map((dot, index) => (
          <View key={`${dot.left}-${dot.top}-${index}`} style={[styles.grainDot, { left: dot.left as DimensionValue, opacity: dot.opacity, top: dot.top as DimensionValue }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute"
  },
  goldBlob: {
    backgroundColor: "#FDC53B",
    borderRadius: 190,
    bottom: -110,
    height: 300,
    right: -120,
    width: 300
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7
  },
  grainDot: {
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    height: 1.4,
    position: "absolute",
    width: 1.4
  },
  orangeBlob: {
    backgroundColor: "#D74902",
    borderRadius: 210,
    bottom: -84,
    height: 340,
    left: 70,
    opacity: 0.9,
    width: 340
  },
  redBlob: {
    backgroundColor: "#861301",
    borderRadius: 190,
    height: 300,
    opacity: 0.86,
    right: -80,
    top: 80,
    width: 300
  }
});

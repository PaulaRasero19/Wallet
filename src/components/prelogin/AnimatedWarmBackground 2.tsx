import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

type Placement = "bottomLeft" | "bottomRight" | "topLeft" | "topRight";

const placementTransform: Record<Placement, { rotate: "0deg" | "180deg"; scaleX: number; scaleY: number }> = {
  bottomLeft: { rotate: "0deg", scaleX: 1, scaleY: 1 },
  bottomRight: { rotate: "0deg", scaleX: -1, scaleY: 1 },
  topLeft: { rotate: "180deg", scaleX: -1, scaleY: 1 },
  topRight: { rotate: "180deg", scaleX: 1, scaleY: 1 }
};

export function AnimatedWarmBackground({
  intensity = "full",
  placement = "bottomLeft"
}: {
  intensity?: "full" | "soft";
  placement?: Placement;
}) {
  const drift = useSharedValue(0);
  const breathe = useSharedValue(0);
  const grain = useMemo(() => {
    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };
    return Array.from({ length: 420 }, (_, index) => ({
      left: random(index + 3) * 100,
      opacity: 0.025 + random(index + 31) * 0.025,
      size: 0.55 + random(index + 61) * 0.45,
      top: random(index + 17) * 100
    }));
  }, []);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 7_500, easing: Easing.inOut(Easing.sin) }), -1, true);
    breathe.value = withRepeat(withTiming(1, { duration: 5_800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [breathe, drift]);

  const lavaFlow = useAnimatedStyle(() => ({
    opacity: (intensity === "full" ? 0.96 : 0.68) + breathe.value * 0.04,
    transform: [
      { translateY: 70 - drift.value * 150 },
      { translateX: -42 + breathe.value * 84 },
      { rotate: `${-8 + drift.value * 15}deg` },
      { scale: 1.28 + breathe.value * 0.12 }
    ]
  }));

  const warmCurrent = useAnimatedStyle(() => ({
    opacity: (intensity === "full" ? 0.72 : 0.42) + drift.value * 0.08,
    transform: [
      { translateY: 95 - breathe.value * 190 },
      { translateX: 48 - drift.value * 102 },
      { rotate: `${12 - breathe.value * 20}deg` },
      { scale: 1.2 + drift.value * 0.14 }
    ]
  }));

  const orientation = placementTransform[placement];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: orientation.rotate }, { scaleX: orientation.scaleX }, { scaleY: orientation.scaleY }] }]}>
        <View style={[StyleSheet.absoluteFill, styles.base]} />
        <Animated.View style={[styles.lavaLayer, lavaFlow]}>
          <LinearGradient
            colors={["rgba(28,28,27,0)", "#861301", "#D74902", "#FDC53B", "rgba(255,243,171,0.72)"]}
            end={{ x: 0.94, y: 0.9 }}
            locations={[0, 0.28, 0.53, 0.78, 1]}
            start={{ x: 0.08, y: 0.06 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.currentLayer, warmCurrent]}>
          <LinearGradient
            colors={["rgba(134,19,1,0)", "rgba(134,19,1,0.74)", "rgba(215,73,2,0.82)", "rgba(253,197,59,0.42)", "rgba(28,28,27,0)"]}
            end={{ x: 0.88, y: 0.82 }}
            locations={[0, 0.25, 0.5, 0.73, 1]}
            start={{ x: 0.06, y: 0.18 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <LinearGradient
        colors={intensity === "full"
          ? ["rgba(28,28,27,0.7)", "rgba(28,28,27,0.08)", "rgba(28,28,27,0.38)"]
          : ["rgba(28,28,27,0.92)", "rgba(28,28,27,0.48)", "rgba(28,28,27,0.74)"]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.grain}>
        {grain.map((dot, index) => (
          <View
            key={`${dot.left}-${dot.top}-${index}`}
            style={[styles.grainDot, { height: dot.size, left: `${dot.left}%`, opacity: dot.opacity, top: `${dot.top}%`, width: dot.size }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#1C1C1B"
  },
  grain: {
    ...StyleSheet.absoluteFillObject
  },
  grainDot: {
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    position: "absolute"
  },
  lavaLayer: {
    bottom: -190,
    height: "112%",
    left: -190,
    position: "absolute",
    width: "155%"
  },
  currentLayer: {
    bottom: -120,
    height: "105%",
    left: -150,
    position: "absolute",
    width: "145%"
  }
});

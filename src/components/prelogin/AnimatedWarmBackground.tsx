import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Placement = "bottomLeft" | "bottomRight" | "topLeft" | "topRight";

const gradients: Record<
  Placement,
  {
    end: { x: number; y: number };
    start: { x: number; y: number };
  }
> = {
  bottomLeft: {
    end: { x: 0.08, y: 1 },
    start: { x: 0.78, y: 0 }
  },
  bottomRight: {
    end: { x: 0.92, y: 1 },
    start: { x: 0.22, y: 0 }
  },
  topLeft: {
    end: { x: 0.82, y: 1 },
    start: { x: 0.08, y: 0 }
  },
  topRight: {
    end: { x: 0.18, y: 1 },
    start: { x: 0.92, y: 0 }
  }
};

export function AnimatedWarmBackground({
  intensity = "full",
  placement = "bottomLeft"
}: {
  intensity?: "full" | "soft";
  placement?: Placement;
}) {
  const direction = gradients[placement];
  const grain = useMemo(() => {
    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    return Array.from({ length: 420 }, (_, index) => ({
      left: random(index + 3) * 100,
      opacity: 0.022 + random(index + 31) * 0.022,
      size: 0.55 + random(index + 61) * 0.45,
      top: random(index + 17) * 100
    }));
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base]}>
      <LinearGradient
        colors={
          intensity === "full"
            ? ["#1C1C1B", "#281813", "#861301", "#D74902", "#FDC53B"]
            : ["#1C1C1B", "#211C19", "#34231D", "#5A2818", "#7B3A18"]
        }
        end={direction.end}
        locations={[0, 0.34, 0.58, 0.79, 1]}
        start={direction.start}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(28,28,27,0.64)", "rgba(28,28,27,0.12)", "rgba(28,28,27,0.42)"]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.grain}>
        {grain.map((dot, index) => (
          <View
            key={`${dot.left}-${dot.top}-${index}`}
            style={[
              styles.grainDot,
              {
                height: dot.size,
                left: `${dot.left}%`,
                opacity: dot.opacity,
                top: `${dot.top}%`,
                width: dot.size
              }
            ]}
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
  }
});

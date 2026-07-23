import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Fill, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { LiquidGradientBackground } from "../home/LiquidGradientBackground";

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
    colors: ["#111110", "#111110", "rgba(17,17,16,0.94)", "rgba(17,17,16,0.52)", "rgba(17,17,16,0.12)"],
    locations: [0, 0.08, 0.26, 0.58, 1]
  }
};

const splashMaskShader = `
uniform float2 resolution;
uniform float time;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(float2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + float2(4.17, 7.31);
    amplitude *= 0.5;
  }
  return value;
}

half4 main(float2 p) {
  float2 uv = p / resolution;
  float t = time * 0.000055;
  float organic = fbm(float2(uv.x * 2.15 + t, t * 0.7));
  float wave = sin(uv.x * 5.2 + t * 2.4) * 0.035;
  float boundary = 0.43 + (organic - 0.5) * 0.22 + wave;
  float darkAlpha = 1.0 - smoothstep(boundary - 0.11, boundary + 0.13, uv.y);
  return half4(0.1098, 0.1098, 0.1059, darkAlpha);
}`;

function SplashOrganicMask() {
  const { height, width } = useWindowDimensions();
  const clock = useClock();
  const source = useMemo(() => Skia.RuntimeEffect.Make(splashMaskShader), []);
  const uniforms = useDerivedValue(() => ({
    resolution: [width, height],
    time: clock.value
  }));

  if (!source) return null;
  return <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}><Shader source={source} uniforms={uniforms} /><Fill /></Canvas>;
}

export function PreloginLiquidBackground({ variant = "login" }: { variant?: Variant }) {
  const mask = masks[variant];
  const liquidTransform = variant === "login"
    ? [{ translateX: 42 }, { scale: 1.12 }]
    : variant === "register"
      ? [{ translateX: -38 }, { translateY: 26 }, { scale: 1.15 }]
      : variant === "splash"
        ? [{ translateY: 24 }, { scale: 1.08 }]
        : [{ rotate: "180deg" }, { scale: 1.08 }];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.liquidOverscan, { transform: liquidTransform }]}>
        <LiquidGradientBackground />
      </View>
      {variant === "splash" ? null : (
        <LinearGradient colors={mask.colors} locations={mask.locations} style={StyleSheet.absoluteFill} />
      )}
      {variant === "splash" ? <SplashOrganicMask /> : null}
      {variant === "onboarding" ? (
        <LinearGradient
          colors={["rgba(188,52,38,0.2)", "rgba(210,70,8,0.14)", "rgba(210,70,8,0.04)", "rgba(28,28,27,0)"]}
          end={{ x: 0.18, y: 0.72 }}
          start={{ x: 0.92, y: 0.02 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  liquidOverscan: {
    bottom: -160,
    left: -160,
    position: "absolute",
    right: -160,
    top: -160
  }
});

import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Fill, Group, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const shaderCode = `
uniform float2 resolution;
uniform float time;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + float2(1.0, 0.0)), u.x), mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x), u.y);
}

float fbm(float2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + float2(3.1, 6.7);
    amplitude *= 0.5;
  }
  return value;
}

half4 main(float2 point) {
  float2 uv = point / float2(max(resolution.x, 1.0), max(resolution.y, 1.0));
  float phase = time * 0.34;
  float n1 = fbm(uv * float2(1.35, 1.8) + float2(phase, -phase * 0.42));
  float n2 = fbm(uv * float2(1.7, 1.25) + float2(-phase * 0.36, phase * 0.54) + 4.2);
  float wave = sin(uv.y * 2.4 + phase + n2 * 2.45) * 0.105;
  float heat = clamp(uv.x + wave + (n1 - 0.5) * 0.38 + (n2 - 0.5) * 0.22, 0.0, 1.0);

  float3 dark = float3(0.109804, 0.109804, 0.105882);
  float3 burgundy = float3(0.525490, 0.074510, 0.003922);
  float3 red = float3(0.843137, 0.286275, 0.007843);
  float3 orange = mix(red, float3(0.992157, 0.772549, 0.231373), 0.45);
  float3 yellow = float3(0.992157, 0.772549, 0.231373);
  float3 cream = float3(1.0, 0.952941, 0.670588);

  float3 color = mix(dark, burgundy, smoothstep(0.0, 0.28, heat));
  color = mix(color, red, smoothstep(0.2, 0.54, heat));
  color = mix(color, orange, smoothstep(0.46, 0.78, heat));
  color = mix(color, yellow, smoothstep(0.72, 1.0, heat));
  color = mix(color, cream, smoothstep(0.9, 1.08, heat) * 0.3);

  float glow = fbm(uv * 1.2 + float2(-phase * 0.2, phase * 0.16));
  color += (glow - 0.5) * 0.055;
  float grain = hash(floor(point * 1.45));
  color += (grain - 0.5) * 0.035;
  return half4(clamp(color, 0.0, 1.0), 1.0);
}`;

export function AmountLavaBackground() {
  const { width } = useWindowDimensions();
  const clock = useClock();
  const source = useMemo(() => Skia.RuntimeEffect.Make(shaderCode), []);
  const uniforms = useDerivedValue(() => ({ resolution: [Math.max(1, width - 34), 162], time: clock.value * 0.001 }));

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={["#1C1C1B", "#861301", "#D74902", "#FDC53B", "#FFF3AB"]} end={{ x: 1, y: 0.9 }} start={{ x: 0, y: 0.1 }} style={StyleSheet.absoluteFill} />
    {source ? <Canvas style={StyleSheet.absoluteFill}><Group><Shader source={source} uniforms={uniforms} /><Fill /></Group></Canvas> : null}
  </View>;
}

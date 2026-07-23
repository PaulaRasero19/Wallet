import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Fill, Group, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const CYCLE_SECONDS = 26;

const liquidShader = `
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
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.02 + float2(7.13, 3.71);
    a *= 0.5;
  }
  return v;
}

float softBlob(float2 uv, float2 center, float2 scale, float phase, float warpStrength) {
  float2 p = uv - center;
  float n1 = fbm(uv * 1.45 + float2(cos(phase), sin(phase)) * 0.42);
  float n2 = fbm(uv * 1.15 + float2(sin(phase * 0.73), cos(phase * 0.81)) * 0.38);
  p.x += (n1 - 0.5) * warpStrength + sin((uv.y + n2) * 3.0 + phase) * warpStrength * 0.34;
  p.y += (n2 - 0.5) * warpStrength + cos((uv.x + n1) * 2.7 - phase * 0.8) * warpStrength * 0.32;
  float d = dot(p * scale, p * scale);
  return 1.0 - smoothstep(0.08, 1.34, d);
}

half4 main(float2 p) {
  float2 screen = p / resolution;
  float aspect = resolution.x / max(resolution.y, 1.0);
  float2 uv = float2(screen.x * aspect, screen.y);
  float phase = time * 6.2831853 / ${CYCLE_SECONDS.toFixed(1)};

  float lowA = fbm(uv * 0.9 + float2(sin(phase * 0.78), cos(phase * 0.66)) * 0.48);
  float lowB = fbm(uv * 1.25 + float2(cos(phase * 0.62 + 1.7), sin(phase * 0.74 + 0.8)) * 0.42);
  float lowC = fbm(uv * 0.62 + float2(sin(phase * 0.41 + 2.4), cos(phase * 0.49 + 1.3)) * 0.56);
  float2 warped = uv;
  warped.x += (lowA - 0.5) * 0.28 + (lowC - 0.5) * 0.16 + sin(uv.y * 2.4 + phase * 0.86) * 0.075;
  warped.y += (lowB - 0.5) * 0.24 + (lowC - 0.5) * 0.13 + cos(uv.x * 2.1 - phase * 0.72) * 0.07;

  float topDark = softBlob(
    warped,
    float2((0.16 + sin(phase * 0.33) * 0.08) * aspect, -0.05 + cos(phase * 0.27) * 0.035),
    float2(0.76 + sin(phase * 0.25) * 0.07, 1.05 + cos(phase * 0.3) * 0.08),
    phase,
    0.18
  );
  float leftDark = softBlob(
    warped,
    float2((-0.12 + cos(phase * 0.28) * 0.07) * aspect, 0.18 + sin(phase * 0.36) * 0.05),
    float2(1.0, 1.22),
    phase + 1.9,
    0.16
  );
  float burgundy = softBlob(
    warped,
    float2((0.36 + sin(phase * 0.48 + 1.4) * 0.16 + cos(phase * 0.22) * 0.06) * aspect, 0.24 + cos(phase * 0.44) * 0.09),
    float2(1.02 + sin(phase * 0.35) * 0.12, 1.58 + cos(phase * 0.31) * 0.16),
    phase * 1.12 + 0.8,
    0.32
  );
  float red = softBlob(
    warped,
    float2((0.66 + sin(phase * 0.58 + 0.7) * 0.22 + cos(phase * 0.27 + 0.2) * 0.08) * aspect, 0.43 + cos(phase * 0.52 + 1.1) * 0.13),
    float2(0.86 + cos(phase * 0.37) * 0.14, 1.12 + sin(phase * 0.42) * 0.18),
    phase * 1.18 + 2.1,
    0.38
  );
  float orange = softBlob(
    warped,
    float2((0.74 + cos(phase * 0.56 + 2.0) * 0.25 + sin(phase * 0.25 + 0.6) * 0.08) * aspect, 0.58 + sin(phase * 0.62) * 0.16),
    float2(0.7 + sin(phase * 0.43 + 1.1) * 0.16, 0.96 + cos(phase * 0.39) * 0.2),
    phase * 1.22 + 3.0,
    0.42
  );
  float yellow = softBlob(
    warped,
    float2((0.58 + sin(phase * 0.66 + 2.7) * 0.3 + cos(phase * 0.29 + 1.7) * 0.1) * aspect, 0.82 + cos(phase * 0.54 + 0.5) * 0.2),
    float2(0.64 + cos(phase * 0.45 + 2.2) * 0.18, 0.78 + sin(phase * 0.4) * 0.2),
    phase * 1.24 + 4.0,
    0.46
  );
  float cream = softBlob(
    warped,
    float2((0.88 + sin(phase * 0.5 + 4.1) * 0.22 + cos(phase * 0.23) * 0.08) * aspect, 0.94 + cos(phase * 0.47 + 1.8) * 0.16),
    float2(0.68 + sin(phase * 0.36) * 0.16, 0.72 + cos(phase * 0.34 + 0.8) * 0.18),
    phase * 1.16 + 5.2,
    0.42
  );

  float bottomWarmth = smoothstep(0.08, 1.02, warped.y + (lowA - 0.5) * 0.2);
  float rightWarmth = smoothstep(0.0, 0.88, screen.x + (lowB - 0.5) * 0.16);

  float3 black = float3(0.109804, 0.109804, 0.105882);
  float3 burgundyColor = float3(0.525490, 0.074510, 0.003922);
  float3 redColor = float3(0.843137, 0.286275, 0.007843);
  float3 yellowColor = float3(0.992157, 0.772549, 0.231373);
  float3 creamColor = float3(1.0, 0.952941, 0.670588);

  float heat =
    warped.y * 0.7
    + rightWarmth * 0.24
    + burgundy * 0.12
    + red * 0.2
    + orange * 0.26
    + yellow * 0.18
    + cream * 0.12
    + (lowA - 0.5) * 0.18
    + (lowC - 0.5) * 0.16
    - topDark * 0.24
    - leftDark * 0.08;
  heat = clamp(heat, 0.0, 1.0);

  float3 color = black;
  color = mix(color, burgundyColor, smoothstep(0.02, 0.5, heat));
  color = mix(color, redColor, smoothstep(0.16, 0.78, heat) * (0.86 + red * 0.22 + orange * 0.2));
  color = mix(color, yellowColor, smoothstep(0.68, 1.02, heat) * (0.48 + yellow * 0.3 + bottomWarmth * 0.12));
  color = mix(color, creamColor, smoothstep(0.88, 1.08, heat) * (0.28 + cream * 0.24));

  float upperDark = (1.0 - smoothstep(0.05, 0.38, warped.y + (lowB - 0.5) * 0.14)) * (0.78 + topDark * 0.14 + leftDark * 0.08);
  color = mix(color, black, clamp(upperDark, 0.0, 0.9));

  float vignette = smoothstep(1.32, 0.1, length((screen - float2(0.08, 0.02)) * float2(0.95, 1.2)));
  color = mix(color * 0.82, color, vignette);

  float grain = hash(floor(p * 1.45));
  color = clamp(color + (grain - 0.5) * 0.035, 0.0, 1.0);

  return half4(color, 1.0);
}`;

export function LiquidGradientBackground() {
  const { height, width } = useWindowDimensions();
  const clock = useClock();
  const source = useMemo(() => Skia.RuntimeEffect.Make(liquidShader), []);
  const grain = useMemo(() => {
    const random = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    return Array.from({ length: 420 }, (_, index) => ({
      left: random(index + 3) * 100,
      opacity: 0.03 + random(index + 31) * 0.02,
      size: 0.55 + random(index + 61) * 0.45,
      top: random(index + 17) * 100
    }));
  }, []);

  const uniforms = useDerivedValue(() => ({
    resolution: [width, height],
    time: clock.value * 0.001
  }));

  if (!source) return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fallback]} />;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fallback]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Shader source={source} uniforms={uniforms} />
          <Fill />
        </Group>
      </Canvas>
      <View style={styles.grain}>
        {grain.map((dot, index) => (
          <View key={`${dot.left}-${dot.top}-${index}`} style={[styles.grainDot, { height: dot.size, left: `${dot.left}%`, opacity: dot.opacity, top: `${dot.top}%`, width: dot.size }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
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

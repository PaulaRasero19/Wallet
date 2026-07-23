import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ArrowRight, BellRing, Check, PiggyBank, ReceiptText, WalletCards } from "lucide-react-native";
import { router } from "expo-router";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { FlowMark } from "../src/components/prelogin/FlowMark";
import { PreloginLiquidBackground } from "../src/components/prelogin/PreloginLiquidBackground";
import { setHasSeenOnboarding } from "../src/services/onboardingStorage";
import { colors, radii, spacing, typography } from "../src/theme";

const pages = [
  {
    title: "Controlá tu dinero\nsin complicarte",
    subtitle: "Registrá ingresos y gastos de forma simple y entendé mejor en qué se va tu plata.",
    kind: "money"
  },
  {
    title: "Anticipate a pagos,\ncuotas y vencimientos",
    subtitle: "FinFlow organiza tus compromisos y te recuerda lo importante antes de que se te pase.",
    kind: "payments"
  },
  {
    title: "Ahorrá con\nmetas reales",
    subtitle: "Creá objetivos, seguí tu progreso y visualizá cuánto te falta para llegar.",
    kind: "goals"
  },
  {
    title: "Entendé tus finanzas\ncon ayuda de IA",
    subtitle: "Consultá tus datos, registrá movimientos con lenguaje natural y recibí ayuda personalizada.",
    kind: "ai"
  }
] as const;

function ProgressPill({ active }: { active: boolean }) {
  const value = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    value.value = withTiming(active ? 1 : 0, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [active, value]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + value.value * 0.55,
    width: 7 + value.value * 20
  }));
  return <Animated.View style={[styles.progressPill, animatedStyle]} />;
}

function SlideVisual({ kind }: { kind: (typeof pages)[number]["kind"] }) {
  if (kind === "money") {
    return (
      <View style={styles.visualContent}>
        <View style={styles.balanceCard}>
          <View style={styles.cardTop}><WalletCards color={colors.white} size={19} /><Text style={styles.cardLabel}>Disponible este mes</Text></View>
          <Text style={styles.balance}>$U 24.720</Text>
          <View style={styles.miniRule} />
          <View style={styles.miniRow}><View><Text style={styles.miniLabel}>Ingresos</Text><Text style={styles.miniValue}>$U 58.000</Text></View><View><Text style={styles.miniLabel}>Gastos</Text><Text style={styles.miniValue}>$U 33.280</Text></View></View>
        </View>
        <View style={[styles.floatingBadge, styles.badgeRight]}><ReceiptText color={colors.black} size={18} /><Text style={styles.badgeText}>Todo en un lugar</Text></View>
      </View>
    );
  }

  if (kind === "payments") {
    return (
      <View style={styles.visualContent}>
        <View style={styles.dateBubble}><Text style={styles.dateDay}>28</Text><Text style={styles.dateMonth}>JUL</Text></View>
        <View style={styles.notificationCard}><View style={styles.notificationIcon}><BellRing color={colors.black} size={20} /></View><View><Text style={styles.notificationTitle}>Internet vence mañana</Text><Text style={styles.notificationText}>Tenés que pagar $U 1.800</Text></View></View>
        <View style={[styles.notificationCard, styles.secondNotification]}><View style={styles.notificationIcon}><Check color={colors.black} size={20} /></View><View><Text style={styles.notificationTitle}>Cuota organizada</Text><Text style={styles.notificationText}>2 de 12 · Próximo pago</Text></View></View>
      </View>
    );
  }

  if (kind === "goals") {
    return (
      <View style={styles.visualContent}>
        <View style={styles.goalCard}><View style={styles.cardTop}><PiggyBank color={colors.black} size={20} /><Text style={styles.goalCardTitle}>Viaje a Brasil</Text></View><View style={styles.goalTrack}><View style={styles.goalFill} /></View><View style={styles.goalMeta}><Text style={styles.goalMetaText}>$U 32.400</Text><Text style={styles.goalMetaText}>de $U 60.000</Text></View></View>
      </View>
    );
  }

  return (
    <View style={styles.visualContent}>
      <View style={styles.aiPrompt}><Text style={styles.aiPromptText}>“Gasté $U 800 en PedidosYa con la Visa”</Text></View>
      <View style={styles.aiResult}><Check color={colors.black} size={16} /><Text style={styles.aiResultText}>Ficha preparada</Text></View>
    </View>
  );
}

export default function Onboarding() {
  const { fontScale, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const page = pages[index];
  const compact = height < 760 || fontScale > 1.15;

  async function finish() {
    await setHasSeenOnboarding();
    router.replace("/welcome");
  }

  async function next() {
    if (index === pages.length - 1) {
      await finish();
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <View style={styles.screen}>
      <PreloginLiquidBackground variant="onboarding" />
      <View style={[styles.brandRow, compact && styles.compactBrandRow]}>
        <View style={styles.brandLockup}>
          <FlowMark size={27} />
          <Text style={styles.brand}>
            <Text style={styles.brandFin}>Fin</Text>
            <Text style={styles.brandFlow}>Flow</Text>
          </Text>
        </View>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void finish()}><Text style={styles.skip}>Saltar</Text></Pressable>
      </View>

      <Animated.View entering={FadeInRight.duration(430)} exiting={FadeOutLeft.duration(220)} key={`visual-${page.kind}`} style={[styles.visual, compact && styles.compactVisual]}>
        <SlideVisual kind={page.kind} />
      </Animated.View>

      <Animated.View entering={FadeInRight.delay(70).duration(430)} exiting={FadeOutLeft.duration(200)} key={page.title} style={[styles.copy, compact && styles.compactCopy]}>
        <Text style={[styles.title, compact && styles.compactTitle]}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View accessibilityLabel={`Página ${index + 1} de ${pages.length}`} style={styles.progress}>
          {pages.map((item, pageIndex) => <ProgressPill active={pageIndex === index} key={item.kind} />)}
        </View>
        <Pressable accessibilityLabel={index === pages.length - 1 ? "Empezar" : "Continuar"} accessibilityRole="button" onPress={() => void next()} style={({ pressed }) => [styles.next, pressed && styles.nextPressed]}>
          <ArrowRight color={colors.black} size={23} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#1C1C1B", flex: 1, paddingBottom: 40, paddingHorizontal: spacing.xl, paddingTop: 62 },
  brandRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", zIndex: 1 },
  compactBrandRow: { marginTop: -18 },
  brandLockup: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  brand: { ...typography.label, fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  brandFin: { color: colors.white, fontWeight: "800" },
  brandFlow: { color: colors.brandOrange, fontWeight: "800" },
  skip: { ...typography.label, color: colors.transparentWhite, fontSize: 13, fontWeight: "700" },
  visual: { height: 350, justifyContent: "center", marginTop: 52, zIndex: 1 },
  compactVisual: { height: 280, marginTop: 20, transform: [{ scale: 0.9 }] },
  visualContent: { alignItems: "center", height: "100%", justifyContent: "center", width: "100%" },
  balanceCard: { backgroundColor: "rgba(24,24,23,0.82)", borderColor: "rgba(255,255,255,0.22)", borderRadius: 30, borderWidth: 1, padding: 24, transform: [{ rotate: "-2deg" }], width: "94%" },
  cardTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  cardLabel: { ...typography.label, color: colors.transparentWhite },
  balance: { ...typography.display, color: colors.white, fontSize: 42, lineHeight: 48, marginTop: spacing.md },
  miniRule: { backgroundColor: colors.appGrayBorder, height: 1, marginVertical: spacing.md },
  miniRow: { flexDirection: "row", justifyContent: "space-between" },
  miniLabel: { ...typography.label, color: colors.transparentWhite },
  miniValue: { ...typography.body, color: colors.white, fontWeight: "700", marginTop: 2 },
  floatingBadge: { alignItems: "center", backgroundColor: colors.white, borderRadius: radii.pill, flexDirection: "row", gap: spacing.sm, paddingHorizontal: 16, paddingVertical: 11, position: "absolute" },
  badgeRight: { bottom: 20, right: -4, transform: [{ rotate: "3deg" }] },
  badgeText: { ...typography.label, color: colors.black, fontWeight: "800" },
  dateBubble: { alignItems: "center", backgroundColor: "rgba(24,24,23,0.82)", borderColor: "rgba(255,255,255,0.22)", borderRadius: 28, borderWidth: 1, height: 112, justifyContent: "center", left: 14, position: "absolute", top: 14, width: 112 },
  dateDay: { ...typography.display, color: colors.white, fontSize: 42, lineHeight: 44 },
  dateMonth: { ...typography.label, color: colors.transparentWhite, fontWeight: "800", letterSpacing: 1.4 },
  notificationCard: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, flexDirection: "row", gap: spacing.md, padding: 16, position: "absolute", right: 0, top: 105, width: "88%" },
  secondNotification: { opacity: 0.88, right: 18, top: 205, transform: [{ scale: 0.94 }] },
  notificationIcon: { alignItems: "center", backgroundColor: "#E8E5DF", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  notificationTitle: { ...typography.body, color: colors.black, fontWeight: "700" },
  notificationText: { ...typography.label, color: colors.grayDark, marginTop: 2 },
  goalCard: { backgroundColor: colors.white, borderRadius: 26, padding: 20, width: "94%" },
  goalCardTitle: { ...typography.body, color: colors.black, fontWeight: "800" },
  goalTrack: { backgroundColor: "#DED9D1", borderRadius: 8, height: 10, marginTop: spacing.md, overflow: "hidden" },
  goalFill: { backgroundColor: colors.orange, borderRadius: 8, height: "100%", width: "54%" },
  goalMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  goalMetaText: { ...typography.label, color: colors.grayDark },
  aiPrompt: { backgroundColor: colors.white, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, width: "94%" },
  aiPromptText: { ...typography.body, color: colors.black, fontWeight: "600" },
  aiResult: { alignItems: "center", alignSelf: "flex-end", backgroundColor: "#E9E6DF", borderRadius: radii.pill, flexDirection: "row", gap: spacing.xs, marginRight: 8, marginTop: spacing.sm, paddingHorizontal: 14, paddingVertical: 9 },
  aiResultText: { ...typography.label, color: colors.black, fontWeight: "800" },
  copy: { gap: spacing.sm, marginTop: 28, zIndex: 1 },
  compactCopy: { marginTop: 8 },
  title: { ...typography.display, color: colors.white, fontSize: 36, lineHeight: 39 },
  compactTitle: { fontSize: 30, lineHeight: 33 },
  subtitle: { ...typography.body, color: colors.transparentWhite, fontSize: 16, lineHeight: 23, maxWidth: 390 },
  footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: "auto", paddingTop: spacing.lg, zIndex: 1 },
  progress: { alignItems: "center", flexDirection: "row", gap: 7 },
  progressPill: { backgroundColor: colors.white, borderRadius: 5, height: 7 },
  next: { alignItems: "center", backgroundColor: colors.white, borderRadius: 30, height: 60, justifyContent: "center", shadowColor: "#F05A0A", shadowOpacity: 0.22, shadowRadius: 16, width: 60 },
  nextPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] }
});

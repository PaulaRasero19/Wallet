import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CalendarDays, CreditCard, PiggyBank, WalletCards } from "lucide-react-native";
import { CalendarEventItem } from "../../src/components/CalendarEventItem";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Planner() {
  const events = useFinFlowStore((state) => state.events);
  const loadOverview = useFinFlowStore((state) => state.loadOverview);
  const toggleEventDone = useFinFlowStore((state) => state.toggleEventDone);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Plan" />
      <Text style={styles.lead}>Planificá lo que ya está comprometido antes de decidir nuevos gastos.</Text>
      <View style={styles.grid}>
        <Shortcut icon={<WalletCards color={colors.black} size={20} />} title="Presupuesto" />
        <Shortcut icon={<PiggyBank color={colors.black} size={20} />} title="Ahorro" onPress={() => router.push("/plan?tab=Ahorro")} />
        <Shortcut icon={<CreditCard color={colors.black} size={20} />} title="Tarjetas" onPress={() => router.push("/plan?tab=Tarjetas")} />
        <Shortcut icon={<CalendarDays color={colors.black} size={20} />} title="Calendario" onPress={() => router.push("/plan?tab=Calendario")} />
      </View>
      <Text style={styles.section}>Próximos eventos</Text>
      <View style={styles.agenda}>
        {events.length === 0 ? <Text style={styles.empty}>Sin eventos futuros cargados.</Text> : null}
        {events.slice(0, 5).map((event) => (
          <CalendarEventItem key={event.id} event={event} onToggle={() => toggleEventDone(event.id)} />
        ))}
      </View>
    </ScreenContainer>
  );
}

function Shortcut({ icon, onPress, title }: { icon: React.ReactNode; onPress?: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress || (() => router.push(`/plan?tab=${title}`))} style={styles.shortcut}>
      {icon}
      <Text style={styles.shortcutTitle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.grayDark,
    marginTop: spacing.lg
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  shortcut: {
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 96,
    padding: spacing.md,
    width: "48%"
  },
  shortcutTitle: {
    ...typography.body,
    color: colors.black,
    fontWeight: "700"
  },
  section: {
    ...typography.body,
    color: colors.black,
    fontWeight: "700",
    marginTop: spacing.xl
  },
  agenda: {
    marginTop: spacing.md
  },
  empty: {
    ...typography.body,
    color: colors.grayDark
  }
});

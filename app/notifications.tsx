import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { colors, spacing, typography } from "../src/theme";

const filters = ["Todas", "Pendientes", "Leídas"] as const;
type Filter = (typeof filters)[number];

export default function Notifications() {
  const [filter, setFilter] = useState<Filter>("Todas");
  const notifications = useMemo(() => [], []);

  return (
    <ScreenContainer>
      <Header title="Notificaciones" back />
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable accessibilityRole="button" key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {notifications.length ? null : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Sin notificaciones pendientes</Text>
          <Text style={styles.emptyText}>Cuando haya vencimientos, presupuestos superados o recordatorios reales, van a aparecer acá.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  activeFilter: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeFilterText: {
    color: colors.black
  },
  emptyPanel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  emptyText: {
    ...typography.body,
    color: colors.transparentWhite
  },
  emptyTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 20
  },
  filter: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  filterText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl
  }
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeftRight, CalendarDays, Home, Plus, UserRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "../theme";
import { DotGrid } from "./DotGrid";

const iconMap = {
  overview: Home,
  transactions: ArrowLeftRight,
  add: Plus,
  planner: CalendarDays,
  profile: UserRound
};

const labelMap = {
  overview: "Inicio",
  transactions: "Movimientos",
  add: "Agregar",
  planner: "Plan",
  profile: "Perfil"
};

export function BottomNavigation({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(10, insets.bottom + 8) }]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const Icon = iconMap[route.name as keyof typeof iconMap] || Home;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.item, focused && styles.activeItem]}
          >
            {focused ? <DotGrid columns={2} dotSize={5} gap={4} matrix={["black", "black", "black", "orange"]} /> : <Icon color={colors.grayMedium} size={19} strokeWidth={1.8} />}
            <Text style={[styles.label, focused && styles.activeLabel]}>{labelMap[route.name as keyof typeof labelMap] || route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.grayLight,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    height: 68,
    justifyContent: "space-between",
    paddingHorizontal: 9,
    position: "absolute",
    width: "92%"
  },
  item: {
    alignItems: "center",
    borderRadius: 18,
    gap: 3,
    height: 52,
    justifyContent: "center",
    width: 58
  },
  activeItem: {
    backgroundColor: colors.background
  },
  label: {
    ...typography.label,
    color: colors.grayMedium,
    fontSize: 9,
    lineHeight: 11
  },
  activeLabel: {
    color: colors.black
  }
});

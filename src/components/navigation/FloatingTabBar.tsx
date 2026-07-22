import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { ArrowLeftRight, Brain, CalendarDays, Camera, CircleDollarSign, Minus, Plus, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography } from "../../theme";
import { DotGrid } from "../DotGrid";

const routeOrder = ["overview", "transactions", "add", "plan", "ai"];
const BAR_COLOR = "rgba(62,62,59,0.84)";
const ACTIVE_COLOR = "#A44934";
const INACTIVE_COLOR = "#4F4E49";
const BAR_HEIGHT = 76;
const TOUCH_SIZE = 52;

const iconMap = {
  overview: DotGrid,
  transactions: ArrowLeftRight,
  add: Plus,
  plan: CalendarDays,
  ai: Brain
};

const labelMap: Record<string, string> = {
  add: "Agregar",
  ai: "IA",
  overview: "Inicio",
  plan: "Plan",
  transactions: "Movimientos"
};

const actions = [
  { icon: Minus, label: "Gasto", route: "/(tabs)/add?type=expense" },
  { icon: Plus, label: "Ingreso", route: "/(tabs)/add?type=income" },
  { icon: ArrowLeftRight, label: "Transferencia", route: "/(tabs)/add?mode=transfer" },
  { icon: CircleDollarSign, label: "Cuotas", route: "/(tabs)/add?mode=installment" },
  { icon: Camera, label: "Escanear", route: "/(tabs)/add?mode=scan" },
  { icon: Sparkles, label: "Con IA", route: "/(tabs)/add?mode=ai" }
] as const;

export function FloatingTabBar({ navigation, state }: any) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const visibleRoutes = state.routes.filter((route: any) => routeOrder.includes(route.name)).sort((a: any, b: any) => routeOrder.indexOf(a.name) - routeOrder.indexOf(b.name));
  const focusedRoute = state.routes[state.index]?.name;

  function goTo(routeName: string) {
    if (routeName === "add") {
      setOpen((value) => !value);
      return;
    }
    setOpen(false);
    navigation.navigate(routeName);
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {open ? (
        <Pressable accessibilityLabel="Cerrar acciones rápidas" onPress={() => setOpen(false)} style={styles.scrim}>
          <View style={[styles.actionSheet, { bottom: BAR_HEIGHT + Math.max(insets.bottom, 0) + 12 }]}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
                  key={action.label}
                  onPress={() => {
                    setOpen(false);
                    router.push(action.route);
                  }}
                  style={styles.action}
                >
                  <Icon color={colors.white} size={18} />
                  <Text style={styles.actionText}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      ) : null}

      <View style={[styles.wrap, { height: BAR_HEIGHT + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 0) }]}>
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={95} pointerEvents="none" style={StyleSheet.absoluteFill} tint="dark" />
        <View pointerEvents="none" style={styles.barTint} />
        <View style={styles.items}>
          {visibleRoutes.map((route: any) => {
            const focused = open ? route.name === "add" : route.name === focusedRoute;
            const Icon = iconMap[route.name as keyof typeof iconMap] || DotGrid;
            const isAdd = route.name === "add";
            const iconColor = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
            return (
              <Pressable
                accessibilityLabel={labelMap[route.name] || route.name}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                key={route.key}
                onPress={() => goTo(route.name)}
                style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
              >
                <View style={[styles.item, isAdd && styles.addItem]}>
                  {route.name === "overview" ? (
                    <DotGrid columns={2} dotSize={4} gap={4} matrix={[iconColor, iconColor, iconColor, iconColor]} />
                  ) : (
                    <Icon color={iconColor} size={isAdd ? 28 : 22} strokeWidth={isAdd ? 2.35 : 2} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14
  },
  actionSheet: {
    alignSelf: "center",
    backgroundColor: "rgba(63,64,59,0.96)",
    borderColor: colors.appGrayBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
    position: "absolute",
    width: "90%"
  },
  actionText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BAR_COLOR
  },
  items: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%"
  },
  addItem: {
    height: TOUCH_SIZE,
    width: TOUCH_SIZE
  },
  item: {
    alignItems: "center",
    borderRadius: TOUCH_SIZE / 2,
    height: TOUCH_SIZE,
    justifyContent: "center",
    width: TOUCH_SIZE
  },
  pressed: {
    transform: [{ scale: 0.97 }]
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)"
  },
  slot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: TOUCH_SIZE,
    minWidth: 48
  },
  wrap: {
    alignItems: "center",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    paddingHorizontal: 0,
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: -2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    zIndex: 100,
    width: "100%"
  }
});

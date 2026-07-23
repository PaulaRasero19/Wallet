import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { ArrowLeftRight, Brain, CalendarDays, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, typography } from "../../theme";
import { DotGrid } from "../DotGrid";

const routeOrder = ["overview", "transactions", "add", "plan", "ai"];
const BAR_COLOR = "rgba(82,82,79,0.24)";
const ACTIVE_COLOR = "#BC3426";
const INACTIVE_COLOR = "rgba(224,224,220,0.76)";
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

export function FloatingTabBar({ navigation, state }: any) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route: any) => routeOrder.includes(route.name)).sort((a: any, b: any) => routeOrder.indexOf(a.name) - routeOrder.indexOf(b.name));
  const actualFocusedRoute = state.routes[state.index]?.name;
  const focusedRoute = actualFocusedRoute?.startsWith("add-") ? "add" : actualFocusedRoute;

  function goTo(routeName: string) {
    if (routeName === "add") {
      router.replace("/(tabs)/add");
      return;
    }
    if (focusedRoute !== routeName) navigation.navigate(routeName);
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.wrap, { height: BAR_HEIGHT + Math.max(insets.bottom, 0), paddingBottom: Math.max(insets.bottom, 0) }]}>
        <BlurView
          experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
          intensity={100}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          tint="dark"
        />
        <View pointerEvents="none" style={styles.barTint} />
        <View style={styles.items}>
          {visibleRoutes.map((route: any) => {
            const focused = route.name === focusedRoute;
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
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BAR_COLOR,
    borderColor: "rgba(255,255,255,0.12)",
    borderTopWidth: 1
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { height: -1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    zIndex: 100,
    width: "100%"
  }
});

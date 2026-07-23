import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Goal } from "../../types/finflow";
import { colors, typography } from "../../theme";
import { sortGoalsForHome } from "../../utils/goals";
import { HomeGoalRow } from "./HomeGoalRow";

const NAVBAR_HEIGHT = 82;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

function nearestSnap(value: number, velocityY: number, expandedY: number, collapsedY: number) {
  "worklet";
  if (velocityY < -0.55) return expandedY;
  if (velocityY > 0.55) return collapsedY;
  return Math.abs(value - expandedY) < Math.abs(value - collapsedY) ? expandedY : collapsedY;
}

export function HomeGoalsSheet({ goals }: { goals: Goal[] }) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const expandedY = height * 0.36;
  const collapsedY = height * 0.75;
  const [expanded, setExpanded] = useState(false);
  const sheetY = useSharedValue(collapsedY);
  const startY = useSharedValue(collapsedY);
  const orderedGoals = useMemo(() => sortGoalsForHome(goals), [goals]);
  const visibleGoals = useMemo(() => orderedGoals.slice(0, 3), [orderedGoals]);
  const bottomPadding = NAVBAR_HEIGHT + Math.max(10, insets.bottom) + 24;
  const cutoutWidth = Math.min(156, width * 0.31);
  const cutoutDepth = 20;
  const center = width / 2;
  const panelPath = `M 0 32 Q 0 0 32 0 H ${center - cutoutWidth / 2} C ${center - 50} 0 ${center - 48} ${cutoutDepth} ${center - 26} ${cutoutDepth} H ${center + 26} C ${center + 48} ${cutoutDepth} ${center + 50} 0 ${center + cutoutWidth / 2} 0 H ${width - 32} Q ${width} 0 ${width} 32 V ${height} H 0 Z`;

  useEffect(() => {
    sheetY.value = collapsedY;
    startY.value = collapsedY;
    setExpanded(false);
  }, [collapsedY, sheetY, startY]);

  const snapTo = (destination: number) => {
    "worklet";
    sheetY.value = withSpring(destination, { damping: 22, mass: 0.9, stiffness: 190 });
    runOnJS(setExpanded)(destination === expandedY);
  };

  const toggleSheet = () => {
    const destination = expanded ? collapsedY : expandedY;
    sheetY.value = withSpring(destination, { damping: 22, mass: 0.9, stiffness: 190 });
    setExpanded(destination === expandedY);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onBegin(() => {
      startY.value = sheetY.value;
    })
    .onUpdate((event) => {
      sheetY.value = clamp(startY.value + event.translationY, expandedY, collapsedY);
    })
    .onEnd((event) => {
      snapTo(nearestSnap(sheetY.value, event.velocityY, expandedY, collapsedY));
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    snapTo(expanded ? collapsedY : expandedY);
  });

  const sheetGesture = Gesture.Exclusive(panGesture, tapGesture);
  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }]
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={sheetGesture}>
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width={width}>
            <Path d={panelPath} fill="#292927" />
          </Svg>
          <View pointerEvents="none" style={styles.handleLayer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.dragArea}>
            <View style={styles.titleRow}>
              <Pressable accessibilityLabel="Desplegar tus metas" accessibilityRole="button" onPress={toggleSheet} style={styles.titleButton}>
              <Text style={styles.title}>Tus metas</Text>
              </Pressable>
              {goals.length > 3 ? <Pressable accessibilityRole="button" onPress={() => router.push("/goals")}><Text style={styles.seeAll}>Ver todas</Text></Pressable> : null}
            </View>
          </View>

          <View style={styles.listWrap}>
            {visibleGoals.length ? (
              <ScrollView
                bounces={false}
                contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
                nestedScrollEnabled
                scrollEnabled={expanded}
                showsVerticalScrollIndicator={expanded}
              >
                {visibleGoals.map((goal, index) => {
                  const opacity = expanded ? 1 : index === 0 ? 1 : index === 1 ? 0.5 : 0.2;
                  return (
                    <View key={goal.id} style={{ opacity }}>
                      <HomeGoalRow goal={goal} />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[styles.emptyState, { paddingBottom: bottomPadding }]}>
                <Text style={styles.emptyText}>No tenés metas activas.</Text>
                <Text style={styles.emptyHint}>Creá una para empezar a ahorrar con un objetivo.</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/add-goal")} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Crear meta</Text>
                </Pressable>
              </View>
            )}
            {!expanded ? (
              <View pointerEvents="none" style={styles.fade}>
                <LinearGradient colors={["rgba(41,41,39,0)", "rgba(41,41,39,0.72)", "#292927"]} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>
      <Pressable
        accessibilityLabel={expanded ? "Cerrar tus metas" : "Desplegar tus metas"}
        accessibilityRole="button"
        onPress={toggleSheet}
        style={[styles.sheetTapTarget, { top: expanded ? expandedY : collapsedY }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dragArea: {
    paddingHorizontal: 32,
    paddingTop: 42
  },
  emptyButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 40,
    paddingHorizontal: 16
  },
  emptyButtonText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "900"
  },
  emptyState: {
    paddingHorizontal: 22,
    paddingTop: 26
  },
  emptyText: {
    ...typography.body,
    color: "rgba(255,255,255,0.74)",
    fontSize: 16,
    lineHeight: 22
  },
  emptyHint: { ...typography.label, color: "rgba(255,255,255,0.58)", marginTop: 6 },
  fade: {
    bottom: 0,
    height: 150,
    left: 0,
    position: "absolute",
    right: 0
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#171716",
    borderRadius: 3,
    height: 5,
    width: 74
  },
  handleLayer: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -7,
    zIndex: 4
  },
  list: {
    gap: 17,
    paddingHorizontal: 32,
    paddingTop: 28
  },
  listWrap: {
    flex: 1,
    overflow: "hidden"
  },
  sheet: {
    backgroundColor: "transparent",
    bottom: 0,
    height: "100%",
    left: 0,
    overflow: "visible",
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { height: -10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    zIndex: 40
  },
  sheetTapTarget: {
    height: 28,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 46
  },
  title: {
    ...typography.title,
    color: colors.white,
    fontSize: 21,
    lineHeight: 27,
    marginTop: 0
  },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  titleButton: { flex: 1 },
  seeAll: { ...typography.label, color: colors.white, fontWeight: "900" }
});

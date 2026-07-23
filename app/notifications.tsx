import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { fetchNotifications } from "../src/services/notificationsService";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, typography } from "../src/theme";
import { FinFlowNotification } from "../src/types/finflow";

function dateLabel(value?: string | null) {
  if (!value) return "Hoy";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Hoy";
  return "Esta semana";
}

function openRelated(notification: FinFlowNotification) {
  const type = notification.relatedEntityType || notification.related_entity_type;
  const id = notification.relatedEntityId || notification.related_entity_id;
  if (!id) return;
  if (type === "payment") router.push({ pathname: "/payment/[id]", params: { id } });
  if (type === "installment") router.push({ pathname: "/installment/[id]", params: { id, installmentId: String(notification.metadata?.installmentId || "") } });
  if (type === "card") router.push({ pathname: "/card/[id]", params: { id } });
  if (type === "transaction") router.push({ pathname: "/transaction/[id]", params: { id } });
  if (type === "goal") router.push({ pathname: "/goal/[id]", params: { id } });
}

export default function Notifications() {
  const { markNotificationRead } = useFinFlowStore();
  const [notifications, setNotifications] = useState<FinFlowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const next = await fetchNotifications();
        if (alive) {
          const rows = Array.isArray(next) ? next : [];
          setNotifications(rows.filter((item) => item.status !== "completed" && item.status !== "snoozed"));
        }
      } catch (error) {
        if (alive) {
          setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las notificaciones.");
          setNotifications([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(() => {
    const rows: Array<{ title: string; data: FinFlowNotification[] }> = [
      { title: "Hoy", data: [] },
      { title: "Esta semana", data: [] }
    ];
    notifications.forEach((notification) => {
      const title = dateLabel(notification.scheduledFor || notification.scheduled_for || notification.createdAt || notification.created_at);
      const existing = rows.find((row) => row.title === title);
      if (existing) existing.data.push(notification);
    });
    return rows.filter((row) => row.data.length);
  }, [notifications]);

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <Header title="Notificaciones" back />
      {loading ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Cargando notificaciones...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No se pudieron cargar</Text>
          <Text style={styles.emptyText}>{loadError}</Text>
        </View>
      ) : groups.length ? (
        groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.data.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpen={() => {
                  void markNotificationRead(notification.id);
                  setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "read" } : item)));
                  openRelated(notification);
                }}
              />
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No tenés recordatorios pendientes.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function NotificationRow({
  notification,
  onOpen
}: {
  notification: FinFlowNotification;
  onOpen: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.row}>
      <View style={styles.notificationIcon}><Bell color="#282828" fill="#282828" size={14} strokeWidth={2.2} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text numberOfLines={1} style={styles.message}>{notification.message}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0
  },
  emptyPanel: {
    marginTop: 28
  },
  emptyText: {
    ...typography.body,
    color: colors.transparentWhite
  },
  emptyTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  group: {
    gap: 10,
    marginTop: 25
  },
  groupTitle: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 1
  },
  message: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 16
  },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#D7D7D7",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  row: {
    alignItems: "center",
    backgroundColor: "#595958",
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    minHeight: 55,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  screen: {
    paddingBottom: 60,
    paddingHorizontal: 18,
    paddingTop: 24
  },
  title: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18
  }
});

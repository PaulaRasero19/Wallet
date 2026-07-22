import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";
import { FinFlowNotification } from "../src/types/finflow";

const filters = ["Todas", "Pendientes", "Leídas"] as const;
type Filter = (typeof filters)[number];

function dateLabel(value?: string | null) {
  if (!value) return "Hoy";
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date < today) return "Atrasadas";
  return "Próximas";
}

function openRelated(notification: FinFlowNotification) {
  const type = notification.relatedEntityType || notification.related_entity_type;
  const id = notification.relatedEntityId || notification.related_entity_id;
  if (!id) return;
  if (type === "payment") router.push(`/payment/${id}`);
  if (type === "installment") router.push("/(tabs)/plan?tab=Calendario");
  if (type === "card") router.push(`/card/${id}`);
  if (type === "transaction") router.push(`/transaction/${id}`);
  if (type === "goal") router.push(`/goal/${id}`);
}

export default function Notifications() {
  const { completeNotification, loadNotifications, markAllNotificationsRead, markInstallmentPaid, markNotificationRead, markPaymentPaid, notifications, snoozeNotification } = useFinFlowStore();
  const [filter, setFilter] = useState<Filter>("Todas");

  useEffect(() => {
    void loadNotifications(filter === "Pendientes" ? "pending" : filter === "Leídas" ? "read" : undefined);
  }, [filter, loadNotifications]);

  const visible = useMemo(() => {
    if (filter === "Pendientes") return notifications.filter((item) => item.status === "pending");
    if (filter === "Leídas") return notifications.filter((item) => item.status === "read");
    return notifications;
  }, [filter, notifications]);

  const groups = useMemo(() => {
    const rows: Array<{ title: string; data: FinFlowNotification[] }> = [];
    visible.forEach((notification) => {
      const title = dateLabel(notification.scheduledFor || notification.scheduled_for || notification.createdAt || notification.created_at);
      const existing = rows.find((row) => row.title === title);
      if (existing) existing.data.push(notification);
      else rows.push({ data: [notification], title });
    });
    return rows;
  }, [visible]);

  return (
    <ScreenContainer>
      <Header
        title="Notificaciones"
        back
        right={
          notifications.some((item) => item.status === "pending") ? (
            <Pressable accessibilityRole="button" onPress={() => void markAllNotificationsRead()}>
              <Text style={styles.readAll}>Leer todo</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable accessibilityRole="button" key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {groups.length ? (
        groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.data.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onComplete={() => {
                  const type = notification.relatedEntityType || notification.related_entity_type;
                  const id = notification.relatedEntityId || notification.related_entity_id;
                  const installmentId = typeof notification.metadata?.installmentId === "string" ? notification.metadata.installmentId : "";
                  if (type === "payment" && id) void markPaymentPaid(id).then(() => completeNotification(notification.id));
                  else if (type === "installment" && id && installmentId) void markInstallmentPaid(id, installmentId).then(() => completeNotification(notification.id));
                  else void completeNotification(notification.id);
                }}
                onOpen={() => {
                  void markNotificationRead(notification.id);
                  openRelated(notification);
                }}
                onRead={() => void markNotificationRead(notification.id)}
                onSnooze={() => void snoozeNotification(notification.id)}
              />
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Cuando haya vencimientos, cierres de tarjeta o recordatorios reales, van a aparecer acá.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function NotificationRow({
  notification,
  onComplete,
  onOpen,
  onRead,
  onSnooze
}: {
  notification: FinFlowNotification;
  onComplete: () => void;
  onOpen: () => void;
  onRead: () => void;
  onSnooze: () => void;
}) {
  const unread = notification.status === "pending";
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.row}>
      <View style={[styles.dot, unread && styles.unreadDot]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <View style={styles.actions}>
          {unread ? (
            <Pressable accessibilityRole="button" onPress={onRead}>
              <Text style={styles.actionText}>Marcar leída</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onSnooze}>
            <Text style={styles.actionText}>Posponer</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onComplete}>
            <Text style={styles.actionText}>Marcar como pagado</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm
  },
  activeFilter: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeFilterText: {
    color: colors.black
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 5,
    height: 10,
    marginTop: 7,
    width: 10
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
  },
  group: {
    marginTop: spacing.xl
  },
  groupTitle: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  message: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: 3
  },
  readAll: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900"
  },
  row: {
    alignItems: "flex-start",
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "900"
  },
  unreadDot: {
    backgroundColor: "#E65C50"
  }
});

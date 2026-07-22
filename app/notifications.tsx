import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CalendarClock, CircleDollarSign, CreditCard, Landmark } from "lucide-react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { fetchNotifications } from "../src/services/notificationsService";
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

function timeRemaining(notification: FinFlowNotification) {
  const raw = typeof notification.metadata?.dueDate === "string" ? notification.metadata.dueDate : notification.scheduledFor || notification.scheduled_for;
  if (!raw) return "Hoy";
  const due = new Date(raw);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < -1) return `Venció hace ${Math.abs(days)} días`;
  if (days === -1) return "Venció ayer";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  if (days === 7) return "Vence en una semana";
  return `Vence en ${days} días`;
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
  const { completeNotification, markAllNotificationsRead, markInstallmentPaid, markNotificationRead, markPaymentPaid, snoozeNotification } = useFinFlowStore();
  const [notifications, setNotifications] = useState<FinFlowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("Todas");
  const markedOnOpen = useRef(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const status = filter === "Pendientes" ? "pending" : filter === "Leídas" ? "read" : undefined;
        const next = await fetchNotifications(status);
        if (alive) {
          const rows = Array.isArray(next) ? next : [];
          if (!markedOnOpen.current) {
            markedOnOpen.current = true;
            if (rows.some((item) => item.status === "pending")) {
              await markAllNotificationsRead();
              setNotifications(rows.map((item) => item.status === "pending" ? { ...item, status: "read" } : item));
            } else setNotifications(rows);
          } else setNotifications(rows);
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
  }, [filter, markAllNotificationsRead]);

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
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void markAllNotificationsRead();
                setNotifications((items) => items.map((item) => (item.status === "pending" ? { ...item, status: "read" } : item)));
              }}
            >
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
      {loading ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Cargando notificaciones...</Text>
          <Text style={styles.emptyText}>Estamos buscando tus avisos pendientes.</Text>
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
                onComplete={() => {
                  const type = notification.relatedEntityType || notification.related_entity_type;
                  const id = notification.relatedEntityId || notification.related_entity_id;
                  const installmentId = typeof notification.metadata?.installmentId === "string" ? notification.metadata.installmentId : "";
                  Alert.alert("FinFlow", type === "installment" ? "¿Marcar esta cuota como pagada?" : "¿Marcar este pago como realizado?", [
                    { style: "cancel", text: "Cancelar" },
                    { text: "Confirmar", onPress: () => void (async () => {
                      if (type === "payment" && id) await markPaymentPaid(id);
                      else if (type === "installment" && id && installmentId) await markInstallmentPaid(id, installmentId);
                      await completeNotification(notification.id);
                      setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "completed" } : item)));
                    })() }
                  ]);
                }}
                onOpen={() => {
                  void markNotificationRead(notification.id);
                  setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "read" } : item)));
                  openRelated(notification);
                }}
                onRead={() => {
                  void markNotificationRead(notification.id);
                  setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "read" } : item)));
                }}
                onSnooze={() => {
                  void snoozeNotification(notification.id);
                  setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "snoozed" } : item)));
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
  const relatedType = notification.relatedEntityType || notification.related_entity_type;
  const Icon = relatedType === "installment" ? CreditCard : notification.type === "income_reminder" ? Landmark : relatedType === "payment" ? CircleDollarSign : CalendarClock;
  const canMarkPaid = relatedType === "payment" || relatedType === "installment";
  const isIncome = notification.type === "income_reminder" || notification.metadata?.kind === "income";
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.row}>
      <View style={[styles.notificationIcon, unread && styles.unreadIcon]}><Icon color={colors.white} size={17} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{timeRemaining(notification)} · {unread ? "Sin leer" : notification.status === "completed" ? "Resuelta" : "Leída"}</Text>
        <View style={styles.actions}>
          {unread ? (
            <Pressable accessibilityRole="button" onPress={onRead}>
              <Text style={styles.actionText}>Marcar leída</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onSnooze}>
            <Text style={styles.actionText}>Posponer</Text>
          </Pressable>
          {canMarkPaid ? <Pressable accessibilityRole="button" onPress={onComplete}>
            <Text style={styles.actionText}>{isIncome ? "Marcar como recibido" : "Marcar como pagado"}</Text>
          </Pressable> : null}
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
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  unreadIcon: {
    backgroundColor: "#E65C50"
  },
  time: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xs
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

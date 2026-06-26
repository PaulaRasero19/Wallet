import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { NotificationToggle } from "../components/NotificationToggle";
import { notificationTypes } from "../data/notificationTypes";
import {
  cancelScheduledNotifications,
  requestNotificationPermissions,
  scheduleLocalNotification,
  sendTestNotification
} from "../services/notificationService";
import { loadJson, saveJson } from "../services/storageService";
import { colors, spacing } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";

const STORAGE_KEY = "finflow_notification_settings";

export function NotificationsScreen() {
  const [settings, setSettings] = useState(notificationTypes);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      const storedSettings = await loadJson(STORAGE_KEY, notificationTypes);
      setSettings(storedSettings);
    }

    loadSettings();
  }, []);

  async function runAction(actionName, action, successMessage) {
    try {
      setLoadingAction(actionName);
      await action();
      if (successMessage) {
        Alert.alert("FinFlow", successMessage);
      }
    } catch (error) {
      Alert.alert("No se pudo completar", error.message || "Ocurrio un error inesperado.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRequestPermission() {
    await runAction(
      "permission",
      async () => {
        const result = await requestNotificationPermissions();
        Alert.alert("Permisos", result.message);
      },
      null
    );
  }

  async function handleToggle(typeId) {
    const nextSettings = settings.map((type) =>
      type.id === typeId ? { ...type, enabled: !type.enabled } : type
    );

    setSettings(nextSettings);
    await saveJson(STORAGE_KEY, nextSettings);
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Notificaciones inteligentes</Text>
      <Text style={globalStyles.subtitle}>
        Preparado con expo-notifications para probar permisos, alertas locales y recordatorios en Android.
      </Text>

      <Card style={styles.actionsCard}>
        <AppButton
          title="Pedir permiso de notificaciones"
          loading={loadingAction === "permission"}
          onPress={handleRequestPermission}
        />
        <AppButton
          title="Enviar notificacion de prueba"
          loading={loadingAction === "test"}
          onPress={() =>
            runAction("test", sendTestNotification, "Se envio una notificacion local de prueba.")
          }
          variant="secondary"
          style={styles.actionButton}
        />
        <AppButton
          title="Programar notificacion local"
          loading={loadingAction === "schedule"}
          onPress={() =>
            runAction(
              "schedule",
              scheduleLocalNotification,
              "Se programo una notificacion para dentro de 10 segundos."
            )
          }
          variant="secondary"
          style={styles.actionButton}
        />
        <AppButton
          title="Cancelar notificaciones"
          loading={loadingAction === "cancel"}
          onPress={() =>
            runAction(
              "cancel",
              cancelScheduledNotifications,
              "Se cancelaron las notificaciones programadas."
            )
          }
          variant="secondary"
          style={styles.actionButton}
        />
      </Card>

      <Text style={styles.sectionTitle}>Tipos de alertas</Text>
      <Card>
        {settings.map((type) => (
          <NotificationToggle
            key={type.id}
            enabled={type.enabled}
            label={type.label}
            onToggle={() => handleToggle(type.id)}
          />
        ))}
      </Card>

      <Card style={styles.examplesCard}>
        <Text style={styles.examplesTitle}>Ejemplos preparados</Text>
        <View style={styles.exampleList}>
          <Text style={styles.example}>FinFlow: estas cerca de alcanzar tu presupuesto mensual.</Text>
          <Text style={styles.example}>Recordatorio: manana vence tu tarjeta.</Text>
          <Text style={styles.example}>Detectamos una suscripcion proxima a cobrarse.</Text>
          <Text style={styles.example}>Gastaste mas de lo habitual en salidas esta semana.</Text>
          <Text style={styles.example}>Buen trabajo: estas mas cerca de tu objetivo de ahorro.</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    marginTop: spacing.md
  },
  actionButton: {
    marginTop: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
    marginTop: spacing.lg
  },
  examplesCard: {
    marginTop: spacing.md
  },
  examplesTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  exampleList: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  example: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});

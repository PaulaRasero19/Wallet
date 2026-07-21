import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Card } from "../components/Card";
import { SubscriptionItem } from "../components/SubscriptionItem";
import { subscriptions as initialSubscriptions } from "../data/subscriptions";
import { globalStyles } from "../styles/globalStyles";

export function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  function handleToggle(subscriptionId) {
    setSubscriptions((currentSubscriptions) =>
      currentSubscriptions.map((subscription) =>
        subscription.id === subscriptionId
          ? { ...subscription, reminderEnabled: !subscription.reminderEnabled }
          : subscription
      )
    );
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Suscripciones</Text>
      <Text style={globalStyles.subtitle}>Los pagos recurrentes reales se cargaran desde Supabase.</Text>
      <Card style={{ marginTop: 16 }}>
        {subscriptions.map((subscription) => (
          <SubscriptionItem key={subscription.id} subscription={subscription} onToggle={handleToggle} />
        ))}
      </Card>
    </ScrollView>
  );
}

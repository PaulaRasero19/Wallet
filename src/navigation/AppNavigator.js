import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../styles/theme";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { BudgetScreen } from "../screens/BudgetScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { GoalsScreen } from "../screens/GoalsScreen";
import { SubscriptionsScreen } from "../screens/SubscriptionsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons = {
  Inicio: "home-outline",
  Movimientos: "swap-horizontal-outline",
  Presupuesto: "wallet-outline",
  IA: "sparkles-outline",
  Perfil: "person-outline"
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons color={color} name={tabIcons[route.name]} size={size} />
        )
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Movimientos" component={TransactionsScreen} />
      <Tab.Screen name="Presupuesto" component={BudgetScreen} />
      <Tab.Screen name="IA" component={InsightsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.primary
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notificaciones" }} />
      <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: "Objetivos de ahorro" }} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: "Suscripciones" }} />
    </Stack.Navigator>
  );
}

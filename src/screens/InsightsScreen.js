import { ScrollView, Text } from "react-native";
import { InsightCard } from "../components/InsightCard";
import { insights } from "../data/insights";
import { globalStyles } from "../styles/globalStyles";

export function InsightsScreen() {
  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Insights de IA</Text>
      <Text style={globalStyles.subtitle}>Consejos simulados para explicar como podria funcionar la inteligencia financiera.</Text>
      {insights.map((message) => (
        <InsightCard key={message} message={message} />
      ))}
    </ScrollView>
  );
}

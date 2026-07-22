import { AddScreen } from "./add";
import { useLocalSearchParams } from "expo-router";

export default function AddGoal() {
  const params = useLocalSearchParams<Record<string, string>>();
  return <AddScreen initialData={params} initialMode="goal" />;
}

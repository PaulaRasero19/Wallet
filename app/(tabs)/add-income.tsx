import { AddScreen } from "./add";
import { useLocalSearchParams } from "expo-router";

export default function AddIncome() {
  const params = useLocalSearchParams<Record<string, string>>();
  return <AddScreen initialData={params} initialMode="income" />;
}

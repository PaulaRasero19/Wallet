import { ScrollView, Text } from "react-native";
import { Card } from "../components/Card";
import { TransactionItem } from "../components/TransactionItem";
import { transactions } from "../data/transactions";
import { globalStyles } from "../styles/globalStyles";

export function TransactionsScreen() {
  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Movimientos</Text>
      <Text style={globalStyles.subtitle}>Lista simple de ingresos y gastos recientes.</Text>
      <Card style={{ marginTop: 16 }}>
        {transactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </Card>
    </ScrollView>
  );
}

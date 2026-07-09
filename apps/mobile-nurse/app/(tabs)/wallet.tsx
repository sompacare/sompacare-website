import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, RefreshControl } from "react-native";
import { formatCurrency } from "@sompacare/mobile-shared";
import { api } from "@/lib/api";
import { Card, ScreenHeader } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const wallet = await api.getWallet();
    setBalance(wallet.balance ?? 0);
  }, []);

  useEffect(() => {
    load().catch(() => setBalance(0));
  }, [load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <ScreenHeader title="Wallet" subtitle="Earnings and instant pay" />
      <Card>
        <Text style={styles.label}>Available balance</Text>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        <Text style={styles.hint}>Instant pay available after shift approval and pay run processing.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingTop: spacing.lg },
  label: { fontSize: 12, color: colors.muted, fontWeight: "600", textTransform: "uppercase" },
  balance: { fontSize: 36, fontWeight: "700", color: colors.navy, marginVertical: 12 },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 20 },
});

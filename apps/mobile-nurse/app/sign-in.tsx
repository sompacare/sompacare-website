import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignIn() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      setError("Additional verification is required. Try signing in on the web portal.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLogo height={40} />
        <Text style={styles.title}>Sign in to Sompacare</Text>
        <Text style={styles.subtitle}>Find and claim healthcare shifts near you</Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? "Signing in..." : "Sign in"}
          onPress={onSignIn}
          disabled={loading || !email || !password}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Sompacare?</Text>
          <Link href="/sign-up" asChild>
            <Pressable>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.navy,
    marginTop: spacing.lg,
  },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.navy,
    backgroundColor: colors.card,
  },
  error: { color: colors.danger, fontSize: 14 },
  footer: { flexDirection: "row", gap: 6, marginTop: spacing.md, justifyContent: "center" },
  footerText: { color: colors.muted },
  link: { color: colors.primary, fontWeight: "600" },
});

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
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }
      setError("Verification incomplete. Check your email code and try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Sompacare as a nurse</Text>

        {!pendingVerification ? (
          <>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
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
            <PrimaryButton
              label={loading ? "Creating..." : "Create account"}
              onPress={onSignUp}
              disabled={loading || !email || !password}
            />
          </>
        ) : (
          <>
            <Text style={styles.hint}>Enter the verification code sent to {email}</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Verification code"
              placeholderTextColor={colors.muted}
              value={code}
              onChangeText={setCode}
            />
            <PrimaryButton
              label={loading ? "Verifying..." : "Verify email"}
              onPress={onVerify}
              disabled={loading || !code}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" asChild>
            <Pressable>
              <Text style={styles.link}>Sign in</Text>
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
  hint: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
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

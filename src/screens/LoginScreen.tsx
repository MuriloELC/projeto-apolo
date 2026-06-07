import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { Field } from "../components/FormControls";
import { useAppData } from "../storage/AppDataContext";
import { colors } from "../utils/statusColors";

export function LoginScreen() {
  const { login } = useAppData();
  const [email, setEmail] = useState("admin@prefeitura.local");
  const [password, setPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.ok && result.reason === "locked") {
        const lockedUntil = result.lockedUntil ? new Date(result.lockedUntil).toLocaleTimeString("pt-BR") : "alguns instantes";
        Alert.alert("Acesso temporariamente bloqueado", `Aguarde ate ${lockedUntil} para tentar novamente.`);
        return;
      }

      if (!result.ok) {
        Alert.alert("Acesso negado", "Confira e-mail e senha.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }} selectable>
          Sistema de iluminacao publica
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Acesso offline de demonstracao com hash local e bloqueio temporario por tentativas.
        </Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 }}>
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
        <ButtonPrimary label={isSubmitting ? "Entrando..." : "Entrar"} disabled={isSubmitting} onPress={handleLogin} />
      </View>

      <View style={{ backgroundColor: "#e7f0ef", borderRadius: 8, padding: 14, gap: 6 }}>
        <Text style={{ color: colors.text, fontWeight: "800" }} selectable>
          Contas de teste
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          admin@prefeitura.local / admin123
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          funcionario@prefeitura.local / funcionario123
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          cidadao@app.local / cidadao123
        </Text>
      </View>
    </ScrollView>
  );
}

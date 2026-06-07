import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../utils/statusColors";
import { ButtonPrimary } from "./ButtonPrimary";

type Props = {
  allowed: boolean;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
};

export function AccessGuard({
  allowed,
  title = "Acesso restrito",
  message,
  actionLabel = "Voltar ao dashboard",
  onAction,
  children,
}: Props) {
  if (allowed) return <>{children}</>;

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", textAlign: "center" }} selectable>
        {title}
      </Text>
      <Text style={{ color: colors.muted, textAlign: "center", lineHeight: 20 }} selectable>
        {message}
      </Text>
      {onAction ? <ButtonPrimary label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

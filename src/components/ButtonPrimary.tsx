import { Pressable, Text, ViewStyle } from "react-native";
import { colors } from "../utils/statusColors";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
};

export function ButtonPrimary({ label, onPress, variant = "primary", disabled = false, style }: Props) {
  const backgroundColor =
    variant === "secondary" ? "#e7f0ef" : variant === "danger" ? colors.danger : colors.primary;
  const color = variant === "secondary" ? colors.primaryDark : "#ffffff";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: 46,
          borderRadius: 8,
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color, fontWeight: "700", fontSize: 15 }} selectable>
        {label}
      </Text>
    </Pressable>
  );
}

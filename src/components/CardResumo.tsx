import { Text, View } from "react-native";
import { colors } from "../utils/statusColors";

type Props = {
  title: string;
  value: string | number;
  accentColor?: string;
};

export function CardResumo({ title, value, accentColor = colors.primary }: Props) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 145,
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
      }}
    >
      <View style={{ width: 34, height: 4, borderRadius: 4, backgroundColor: accentColor }} />
      <Text style={{ color: colors.muted, fontSize: 13 }} selectable>
        {title}
      </Text>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }} selectable>
        {value}
      </Text>
    </View>
  );
}

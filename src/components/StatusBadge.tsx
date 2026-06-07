import { Text, View } from "react-native";
import { colors } from "../utils/statusColors";
import { labelFromValue } from "../utils/labels";

type Props = {
  label: string;
  color?: string;
};

export function StatusBadge({ label, color = colors.primary }: Props) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}55`,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "700" }} selectable>
        {labelFromValue(label)}
      </Text>
    </View>
  );
}

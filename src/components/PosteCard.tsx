import { Pressable, Text, View } from "react-native";
import { Poste } from "../types/Poste";
import { getLuminariaEstadoColor, getPosteStatusColor, colors } from "../utils/statusColors";
import { StatusBadge } from "./StatusBadge";

type Props = {
  poste: Poste;
  onPress: () => void;
};

export function PosteCard({ poste, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 10,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
            {poste.codigo}
          </Text>
          <Text style={{ color: colors.muted }} selectable>
            {poste.bairro} · {poste.patrimonioId}
          </Text>
        </View>
        <StatusBadge label={poste.status} color={getPosteStatusColor(poste.status)} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <StatusBadge label={poste.luminaria.tipo} color={colors.blue} />
        <StatusBadge label={poste.luminaria.estado} color={getLuminariaEstadoColor(poste.luminaria.estado)} />
      </View>
    </Pressable>
  );
}

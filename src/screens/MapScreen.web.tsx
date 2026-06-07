import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, Text, View, ViewStyle } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { colors, getMapPinColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export function MapScreen({ navigation }: Props) {
  const { postes } = useAppData();
  const latitudes = postes.map((poste) => poste.latitude);
  const longitudes = postes.map((poste) => poste.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  function getPosition(latitude: number, longitude: number): ViewStyle {
    const top = maxLat === minLat ? 50 : 10 + ((maxLat - latitude) / (maxLat - minLat)) * 80;
    const left = maxLng === minLng ? 50 : 10 + ((longitude - minLng) / (maxLng - minLng)) * 80;
    return { top: `${top}%`, left: `${left}%` } as ViewStyle;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }} selectable>
          Mapa web dos ativos
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Visualização compatível com navegador. No celular, o app usa mapa nativo com pins.
        </Text>
      </View>

      <View
        style={{
          height: 360,
          borderRadius: 8,
          backgroundColor: "#dfe9e6",
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "#c5d3ce" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "#c5d3ce" }} />
        {postes.map((poste) => (
          <View
            key={poste.id}
            style={{
              position: "absolute",
              ...getPosition(poste.latitude, poste.longitude),
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              borderRadius: 999,
              backgroundColor: getMapPinColor(poste.status, poste.luminaria.estado),
              borderWidth: 3,
              borderColor: "#ffffff",
            }}
          />
        ))}
      </View>

      <Text style={{ color: colors.muted }} selectable>
        Verde funcionando · Amarelo manutenção/oscilando · Vermelho problema · Cinza inativo
      </Text>

      {postes.map((poste) => (
        <View key={poste.id} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} selectable>
            {poste.codigo} · {poste.bairro}
          </Text>
          <Text style={{ color: colors.muted }} selectable>
            {poste.latitude.toFixed(5)}, {poste.longitude.toFixed(5)} · {poste.luminaria.estado}
          </Text>
          <ButtonPrimary label="Ver detalhes" onPress={() => navigation.navigate("PosteDetails", { posteId: poste.id })} />
        </View>
      ))}
    </ScrollView>
  );
}

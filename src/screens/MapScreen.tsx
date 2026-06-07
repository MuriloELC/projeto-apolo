import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { colors, getMapPinColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

export function MapScreen({ navigation, route }: Props) {
  const { postes } = useAppData();
  const selected = postes.find((poste) => poste.id === route.params?.posteId) ?? postes[0];

  if (!selected) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted }} selectable>
          Nenhum poste cadastrado.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: selected.latitude,
          longitude: selected.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {postes.map((poste) => (
          <Marker
            key={poste.id}
            coordinate={{ latitude: poste.latitude, longitude: poste.longitude }}
            pinColor={getMapPinColor(poste.status, poste.luminaria.estado)}
          >
            <Callout tooltip={false}>
              <View style={{ width: 220, gap: 8, padding: 4 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }} selectable>
                  {poste.codigo}
                </Text>
                <Text style={{ color: colors.muted }} selectable>
                  {poste.bairro}
                </Text>
                <Text style={{ color: colors.text }} selectable>
                  Luminária: {poste.luminaria.estado}
                </Text>
                <ButtonPrimary label="Ver detalhes" onPress={() => navigation.navigate("PosteDetails", { posteId: poste.id })} />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 16,
          backgroundColor: colors.surface,
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 6,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "800" }} selectable>
          Legenda
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          Verde funcionando · Amarelo manutenção/oscilando · Vermelho problema · Cinza inativo
        </Text>
      </View>
    </View>
  );
}

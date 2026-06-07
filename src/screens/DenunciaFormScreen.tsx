import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { Field, SelectField } from "../components/FormControls";
import { useAppData } from "../storage/AppDataContext";
import { Denuncia, DenunciaTipo } from "../types/Denuncia";
import { RootStackParamList } from "../types/Navigation";
import { getErrorMessage } from "../utils/errors";
import { todayIsoDate } from "../utils/formatDate";
import { sanitizeUserFacingText } from "../utils/security";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "DenunciaForm">;

export function DenunciaFormScreen({ navigation, route }: Props) {
  const { postes, denuncias, currentUser, saveDenuncia } = useAppData();
  const [posteId, setPosteId] = useState(route.params?.posteId ?? "");
  const [tipo, setTipo] = useState<DenunciaTipo>("luminaria_apagada");
  const [descricao, setDescricao] = useState("");
  const [enderecoReferencia, setEnderecoReferencia] = useState("");
  const [bairro, setBairro] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [fotoUri, setFotoUri] = useState<string | undefined>();

  async function capturarLocalizacao() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("GPS indisponível", "A denúncia pode ser registrada só com endereço de referência.");
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setLatitude(String(current.coords.latitude));
    setLongitude(String(current.coords.longitude));
  }

  async function escolherFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Foto não anexada", "Permissão de galeria negada.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoUri(result.assets[0]?.uri);
    }
  }

  async function salvar() {
    if (!currentUser) return;

    if (!descricao.trim() || !enderecoReferencia.trim() || !bairro.trim()) {
      Alert.alert("Campos obrigatórios", "Informe descrição, referência e bairro.");
      return;
    }

    const parsedLatitude = latitude ? Number(latitude) : undefined;
    const parsedLongitude = longitude ? Number(longitude) : undefined;
    const nextNumber = String(denuncias.length + 1).padStart(4, "0");
    const today = todayIsoDate();
    const denuncia: Denuncia = {
      id: `den-${Date.now()}`,
      codigo: `DEN-${nextNumber}`,
      posteId: posteId || undefined,
      tipo,
      status: "recebida",
      descricao: sanitizeUserFacingText(descricao),
      enderecoReferencia: sanitizeUserFacingText(enderecoReferencia),
      bairro: sanitizeUserFacingText(bairro),
      latitude: Number.isFinite(parsedLatitude) ? parsedLatitude : undefined,
      longitude: Number.isFinite(parsedLongitude) ? parsedLongitude : undefined,
      fotoUri,
      criadaPorId: currentUser.id,
      criadaPorNome: currentUser.nome,
      dataAbertura: today,
      dataAtualizacao: today,
    };

    try {
      await saveDenuncia(denuncia);
      navigation.replace("Denuncias");
    } catch (error) {
      Alert.alert("Denuncia nao enviada", getErrorMessage(error));
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <SelectField
        label="Poste relacionado"
        value={posteId}
        options={["", ...postes.map((poste) => poste.id)]}
        onChange={setPosteId}
        format={(id) => (id ? postes.find((poste) => poste.id === id)?.codigo ?? id : "Não sei informar")}
      />
      <SelectField
        label="Tipo de denúncia"
        value={tipo}
        options={["luminaria_apagada", "oscilando", "poste_danificado", "fio_exposto", "outro"]}
        onChange={setTipo}
      />
      <Field
        label="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o problema observado"
        multiline
        style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field label="Endereço/referência" value={enderecoReferencia} onChangeText={setEnderecoReferencia} placeholder="Rua, esquina, ponto de referência" />
      <Field label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Centro" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Field label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" style={{ flex: 1 }} />
        <Field label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" style={{ flex: 1 }} />
      </View>
      <ButtonPrimary label="Capturar GPS" variant="secondary" onPress={capturarLocalizacao} />
      {fotoUri ? (
        <Image source={{ uri: fotoUri }} style={{ width: "100%", height: 170, borderRadius: 8, backgroundColor: colors.border }} />
      ) : (
        <View style={{ height: 92, borderRadius: 8, backgroundColor: "#e7eef2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted, fontWeight: "700" }} selectable>
            Foto opcional não anexada
          </Text>
        </View>
      )}
      <ButtonPrimary label="Selecionar foto opcional" variant="secondary" onPress={escolherFoto} />
      <ButtonPrimary label="Enviar denúncia" onPress={salvar} />
    </ScrollView>
  );
}

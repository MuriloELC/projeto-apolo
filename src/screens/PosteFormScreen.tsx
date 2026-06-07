import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { AccessGuard } from "../components/AccessGuard";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { Field, SelectField } from "../components/FormControls";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import {
  BracoEstado,
  BracoMaterial,
  BracoTipo,
  LuminariaEstado,
  LuminariaTipo,
  Poste,
  PosteStatus,
  TipoPoste,
} from "../types/Poste";
import { todayIsoDate } from "../utils/formatDate";
import { getErrorMessage } from "../utils/errors";
import { colors } from "../utils/statusColors";
import { canManageAssets } from "../types/Usuario";

type Props = NativeStackScreenProps<RootStackParamList, "PosteForm">;

const fallbackCoords = {
  latitude: -11.6721,
  longitude: -61.1936,
};

export function PosteFormScreen({ navigation, route }: Props) {
  const { postes, currentUser, savePoste } = useAppData();
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const editingPoste = useMemo(
    () => postes.find((poste) => poste.id === route.params?.posteId),
    [postes, route.params?.posteId],
  );

  const [codigo, setCodigo] = useState(editingPoste?.codigo ?? `PB-${String(postes.length + 1).padStart(4, "0")}`);
  const [patrimonioId, setPatrimonioId] = useState(editingPoste?.patrimonioId ?? `PAT-ILUM-${String(postes.length + 1).padStart(4, "0")}`);
  const [latitude, setLatitude] = useState(String(editingPoste?.latitude ?? fallbackCoords.latitude));
  const [longitude, setLongitude] = useState(String(editingPoste?.longitude ?? fallbackCoords.longitude));
  const [enderecoReferencia, setEnderecoReferencia] = useState(editingPoste?.enderecoReferencia ?? "");
  const [bairro, setBairro] = useState(editingPoste?.bairro ?? "");
  const [status, setStatus] = useState<PosteStatus>(editingPoste?.status ?? "ativo");
  const [tipoPoste, setTipoPoste] = useState<TipoPoste>(editingPoste?.tipoPoste ?? "concreto");
  const [alturaMetros, setAlturaMetros] = useState(String(editingPoste?.alturaMetros ?? 9));
  const [circuito, setCircuito] = useState(editingPoste?.circuito ?? "");
  const [transformadorReferencia, setTransformadorReferencia] = useState(editingPoste?.transformadorReferencia ?? "");
  const [bracoTipo, setBracoTipo] = useState<BracoTipo>(editingPoste?.braco.tipo ?? "medio");
  const [bracoMaterial, setBracoMaterial] = useState<BracoMaterial>(editingPoste?.braco.material ?? "aco");
  const [bracoEstado, setBracoEstado] = useState<BracoEstado>(editingPoste?.braco.estado ?? "bom");
  const [luminariaTipo, setLuminariaTipo] = useState<LuminariaTipo>(editingPoste?.luminaria.tipo ?? "LED");
  const [potencia, setPotencia] = useState(String(editingPoste?.luminaria.potencia ?? 150));
  const [marca, setMarca] = useState(editingPoste?.luminaria.marca ?? "");
  const [modelo, setModelo] = useState(editingPoste?.luminaria.modelo ?? "");
  const [especificacao, setEspecificacao] = useState(editingPoste?.luminaria.especificacao ?? "");
  const [produtoId, setProdutoId] = useState(editingPoste?.luminaria.produtoId ?? "");
  const [numeroSerie, setNumeroSerie] = useState(editingPoste?.luminaria.numeroSerie ?? "");
  const [numeroLicitacao, setNumeroLicitacao] = useState(editingPoste?.luminaria.numeroLicitacao ?? "");
  const [dataCompra, setDataCompra] = useState(editingPoste?.luminaria.dataCompra ?? todayIsoDate());
  const [fornecedor, setFornecedor] = useState(editingPoste?.luminaria.fornecedor ?? "");
  const [garantiaMeses, setGarantiaMeses] = useState(String(editingPoste?.luminaria.garantiaMeses ?? 36));
  const [dataInstalacao, setDataInstalacao] = useState(editingPoste?.luminaria.dataInstalacao ?? todayIsoDate());
  const [luminariaEstado, setLuminariaEstado] = useState<LuminariaEstado>(editingPoste?.luminaria.estado ?? "funcionando");
  const [fotoUri, setFotoUri] = useState<string | undefined>(editingPoste?.fotoUri);

  if (!canManage) {
    return (
      <AccessGuard
        allowed={false}
        message="Somente admin e funcionarios podem cadastrar ou editar postes e luminarias."
        onAction={() => navigation.navigate("Dashboard")}
      >
        <View />
      </AccessGuard>
    );
  }

  async function capturarLocalizacao() {
    const { status: permission } = await Location.requestForegroundPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert("GPS indisponível", "Usando coordenada mockada para manter o protótipo funcionando.");
      setLatitude(String(fallbackCoords.latitude));
      setLongitude(String(fallbackCoords.longitude));
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setLatitude(String(current.coords.latitude));
    setLongitude(String(current.coords.longitude));
  }

  async function escolherFoto() {
    const { status: permission } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission !== "granted") {
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

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedPotencia = Number(potencia);
    const parsedAltura = Number(alturaMetros);
    const parsedGarantia = Number(garantiaMeses);

    if (!codigo.trim() || !patrimonioId.trim() || !bairro.trim() || !enderecoReferencia.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha código, patrimônio, bairro e referência.");
      return;
    }

    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      !Number.isFinite(parsedPotencia) ||
      !Number.isFinite(parsedAltura) ||
      !Number.isFinite(parsedGarantia)
    ) {
      Alert.alert("Dados inválidos", "Confira latitude, longitude, potência, altura e garantia.");
      return;
    }

    const id = editingPoste?.id ?? `poste-${Date.now()}`;
    const today = todayIsoDate();
    const nextPoste: Poste = {
      id,
      codigo: codigo.trim(),
      patrimonioId: patrimonioId.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      enderecoReferencia: enderecoReferencia.trim(),
      bairro: bairro.trim(),
      status,
      tipoPoste,
      alturaMetros: parsedAltura,
      circuito: circuito.trim() || "Não informado",
      transformadorReferencia: transformadorReferencia.trim() || "Não informado",
      dataCadastro: editingPoste?.dataCadastro ?? today,
      cadastradoPor: editingPoste?.cadastradoPor ?? currentUser.nome,
      dataAtualizacao: today,
      atualizadoPor: currentUser.nome,
      fotoUri,
      luminaria: {
        id: editingPoste?.luminaria.id ?? `lum-${Date.now()}`,
        posteId: id,
        tipo: luminariaTipo,
        potencia: parsedPotencia,
        marca: marca.trim() || "Não informado",
        modelo: modelo.trim() || "Não informado",
        especificacao: especificacao.trim() || "Não informado",
        produtoId: produtoId.trim() || "Não informado",
        numeroSerie: numeroSerie.trim() || undefined,
        numeroLicitacao: numeroLicitacao.trim() || "Não informado",
        dataCompra,
        dataInstalacao,
        fornecedor: fornecedor.trim() || "Não informado",
        garantiaMeses: parsedGarantia,
        estado: luminariaEstado,
      },
      braco: {
        id: editingPoste?.braco.id ?? `br-${Date.now()}`,
        posteId: id,
        tipo: bracoTipo,
        material: bracoMaterial,
        estado: bracoEstado,
      },
      historicoManutencoes: editingPoste?.historicoManutencoes ?? [],
    };

    try {
      await savePoste(nextPoste);
      navigation.replace("PosteDetails", { posteId: nextPoste.id });
    } catch (error) {
      Alert.alert("Cadastro nao salvo", getErrorMessage(error));
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Field label="Código identificador" value={codigo} onChangeText={setCodigo} placeholder="PB-0005" />
      <Field label="ID patrimonial" value={patrimonioId} onChangeText={setPatrimonioId} placeholder="PAT-ILUM-0005" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Field label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" style={{ flex: 1 }} />
        <Field label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" style={{ flex: 1 }} />
      </View>
      <ButtonPrimary label="Capturar localização GPS" variant="secondary" onPress={capturarLocalizacao} />
      <Field label="Endereço/referência" value={enderecoReferencia} onChangeText={setEnderecoReferencia} placeholder="Rua, esquina, ponto de referência" />
      <Field label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Centro" />

      <SelectField label="Status" value={status} options={["ativo", "manutencao", "inativo"]} onChange={setStatus} />
      <SelectField label="Tipo do poste" value={tipoPoste} options={["concreto", "metalico", "madeira", "outro"]} onChange={setTipoPoste} />
      <Field label="Altura do poste (m)" value={alturaMetros} onChangeText={setAlturaMetros} keyboardType="numeric" placeholder="9" />
      <Field label="Circuito" value={circuito} onChangeText={setCircuito} placeholder="CIR-01" />
      <Field label="Transformador de referência" value={transformadorReferencia} onChangeText={setTransformadorReferencia} placeholder="TR-CENTRO-01" />
      <SelectField label="Tipo do braço" value={bracoTipo} options={["curto", "medio", "longo"]} onChange={setBracoTipo} />
      <SelectField label="Material do braço" value={bracoMaterial} options={["aco", "aluminio", "outro"]} onChange={setBracoMaterial} />
      <SelectField label="Estado do braço" value={bracoEstado} options={["bom", "danificado", "necessita troca"]} onChange={setBracoEstado} />
      <SelectField label="Tipo de luminária" value={luminariaTipo} options={["LED", "Vapor de Sódio", "Vapor Metálico"]} onChange={setLuminariaTipo} />
      <Field label="Potência" value={potencia} onChangeText={setPotencia} keyboardType="numeric" placeholder="150" />
      <Field label="Marca" value={marca} onChangeText={setMarca} placeholder="Philips" />
      <Field label="Modelo" value={modelo} onChangeText={setModelo} placeholder="Street Light X" />
      <Field
        label="Especificação"
        value={especificacao}
        onChangeText={setEspecificacao}
        placeholder="LED IP66, 5000K, fotocélula integrada"
        multiline
        style={{ minHeight: 86, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field label="ID do produto" value={produtoId} onChangeText={setProdutoId} placeholder="PRD-LED-150" />
      <Field label="Número de série" value={numeroSerie} onChangeText={setNumeroSerie} placeholder="Opcional" />
      <Field label="Número da licitação" value={numeroLicitacao} onChangeText={setNumeroLicitacao} placeholder="PE-012/2025" />
      <Field label="Data de compra" value={dataCompra} onChangeText={setDataCompra} placeholder="AAAA-MM-DD" />
      <Field label="Fornecedor" value={fornecedor} onChangeText={setFornecedor} placeholder="Fornecedor contratado" />
      <Field label="Garantia (meses)" value={garantiaMeses} onChangeText={setGarantiaMeses} keyboardType="numeric" placeholder="36" />
      <Field label="Data de instalação" value={dataInstalacao} onChangeText={setDataInstalacao} placeholder="AAAA-MM-DD" />
      <SelectField
        label="Estado da luminária"
        value={luminariaEstado}
        options={["funcionando", "queimada", "oscilando", "danificada"]}
        onChange={setLuminariaEstado}
      />

      {fotoUri ? (
        <Image source={{ uri: fotoUri }} style={{ width: "100%", height: 180, borderRadius: 8, backgroundColor: colors.border }} />
      ) : (
        <View style={{ height: 92, borderRadius: 8, backgroundColor: "#e7eef2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted, fontWeight: "700" }} selectable>
            Nenhuma foto anexada
          </Text>
        </View>
      )}
      <ButtonPrimary label="Selecionar foto" variant="secondary" onPress={escolherFoto} />
      <ButtonPrimary label="Salvar cadastro local" onPress={salvar} />
    </ScrollView>
  );
}

import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { AccessGuard } from "../components/AccessGuard";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { Field, SelectField } from "../components/FormControls";
import { useAppData } from "../storage/AppDataContext";
import { DenunciaTipo } from "../types/Denuncia";
import { RootStackParamList } from "../types/Navigation";
import { OrdemPrioridade, OrdemServico, OrdemTipo } from "../types/OrdemServico";
import { canManageAssets } from "../types/Usuario";
import { getErrorMessage } from "../utils/errors";
import { todayIsoDate } from "../utils/formatDate";
import { denunciaTipoLabel } from "../utils/labels";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "OrdemForm">;

export function OrdemFormScreen({ navigation, route }: Props) {
  const { postes, ordens, denuncias, currentUser, saveOrdem, updateDenunciaStatus } = useAppData();
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const denunciaOrigem = denuncias.find((denuncia) => denuncia.id === route.params?.denunciaId);
  const [posteId, setPosteId] = useState(route.params?.posteId ?? denunciaOrigem?.posteId ?? postes[0]?.id ?? "");
  const [tipo, setTipo] = useState<OrdemTipo>(denunciaOrigem ? ordemTipoFromDenuncia(denunciaOrigem.tipo) : "manutencao");
  const [prioridade, setPrioridade] = useState<OrdemPrioridade>(
    denunciaOrigem ? prioridadeFromDenuncia(denunciaOrigem.tipo) : "media",
  );
  const [descricao, setDescricao] = useState(denunciaOrigem ? descricaoFromDenuncia(denunciaOrigem) : "");
  const [fotoUri, setFotoUri] = useState<string | undefined>();

  if (!canManage) {
    return (
      <AccessGuard
        allowed={false}
        message="Somente admin e funcionarios podem criar ordens de servico."
        onAction={() => navigation.navigate("Dashboard")}
      >
        <View />
      </AccessGuard>
    );
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
    if (!currentUser || !canManage) {
      Alert.alert("Acesso restrito", "Somente admin e funcionários podem criar ordens de serviço neste protótipo.");
      return;
    }

    if (!posteId) {
      Alert.alert("Sem poste", "Cadastre um poste antes de abrir uma ordem de serviço.");
      return;
    }

    if (!descricao.trim()) {
      Alert.alert("Descrição obrigatória", "Informe o que precisa ser feito.");
      return;
    }

    const nextNumber = String(ordens.length + 1).padStart(4, "0");
    const today = todayIsoDate();
    const ordem: OrdemServico = {
      id: `os-${Date.now()}`,
      codigo: `OS-${nextNumber}`,
      posteId,
      origem: denunciaOrigem ? "denuncia" : "manual",
      denunciaId: denunciaOrigem?.id,
      denunciaCodigo: denunciaOrigem?.codigo,
      solicitante: denunciaOrigem?.criadaPorNome,
      tipo,
      prioridade,
      status: "aberta",
      descricao: descricao.trim(),
      dataAbertura: today,
      dataAtualizacao: today,
      atualizadaPor: currentUser.nome,
      fotoUri,
      criadaPor: currentUser.nome,
    };

    try {
      await saveOrdem(ordem);
      if (denunciaOrigem) {
        await updateDenunciaStatus(denunciaOrigem.id, "convertida_os");
      }
      navigation.replace("Ordens");
    } catch (error) {
      Alert.alert("OS nao criada", getErrorMessage(error));
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      {denunciaOrigem ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }} selectable>
            Origem: {denunciaOrigem.codigo}
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
            {denunciaTipoLabel(denunciaOrigem.tipo)} - {denunciaOrigem.bairro} - por {denunciaOrigem.criadaPorNome}
          </Text>
        </View>
      ) : null}
      <SelectField
        label="Poste relacionado"
        value={posteId}
        options={postes.map((poste) => poste.id)}
        onChange={setPosteId}
        format={(id) => postes.find((poste) => poste.id === id)?.codigo ?? id}
      />
      <SelectField
        label="Tipo de serviço"
        value={tipo}
        options={["troca_lampada", "manutencao", "vistoria", "instalacao"]}
        onChange={setTipo}
      />
      <SelectField label="Prioridade" value={prioridade} options={["baixa", "media", "alta"]} onChange={setPrioridade} />
      <Field
        label="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o serviço necessário"
        multiline
        style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }}
      />
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
      <ButtonPrimary label="Criar ordem de serviço" onPress={salvar} />
    </ScrollView>
  );
}

function ordemTipoFromDenuncia(tipo: DenunciaTipo): OrdemTipo {
  if (tipo === "luminaria_apagada") return "troca_lampada";
  if (tipo === "poste_danificado" || tipo === "fio_exposto") return "manutencao";
  return "vistoria";
}

function prioridadeFromDenuncia(tipo: DenunciaTipo): OrdemPrioridade {
  if (tipo === "fio_exposto") return "alta";
  if (tipo === "luminaria_apagada" || tipo === "poste_danificado") return "media";
  return "baixa";
}

function descricaoFromDenuncia(denuncia: {
  codigo: string;
  tipo: DenunciaTipo;
  descricao: string;
  enderecoReferencia: string;
  bairro: string;
  criadaPorNome: string;
}) {
  return `${denuncia.codigo} - ${denunciaTipoLabel(denuncia.tipo)}. ${denuncia.descricao} Referencia: ${denuncia.enderecoReferencia}, ${denuncia.bairro}. Solicitante: ${denuncia.criadaPorNome}.`;
}

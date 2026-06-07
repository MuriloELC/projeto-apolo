import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { AccessGuard } from "../components/AccessGuard";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { Field, SelectField } from "../components/FormControls";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { BracoEstado, LuminariaEstado, PosteStatus } from "../types/Poste";
import { canManageAssets } from "../types/Usuario";
import { getErrorMessage } from "../utils/errors";
import { todayIsoDate } from "../utils/formatDate";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "ManutencaoForm">;

export function ManutencaoFormScreen({ navigation, route }: Props) {
  const { postes, currentUser, addManutencao } = useAppData();
  const poste = postes.find((item) => item.id === route.params.posteId);
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(todayIsoDate());
  const [responsavel, setResponsavel] = useState(currentUser?.nome ?? "");
  const [status, setStatus] = useState<PosteStatus>(poste?.status ?? "ativo");
  const [luminariaEstado, setLuminariaEstado] = useState<LuminariaEstado>(poste?.luminaria.estado ?? "funcionando");
  const [bracoEstado, setBracoEstado] = useState<BracoEstado>(poste?.braco.estado ?? "bom");

  if (!canManage || !poste) {
    return (
      <AccessGuard
        allowed={false}
        message="Somente admin e funcionarios podem registrar manutencao em ativos."
        onAction={() => navigation.navigate("Dashboard")}
      >
        <View />
      </AccessGuard>
    );
  }

  const selectedPoste = poste;

  async function salvar() {
    if (!descricao.trim() || !responsavel.trim()) {
      Alert.alert("Campos obrigatorios", "Informe descricao e responsavel pela manutencao.");
      return;
    }

    try {
      await addManutencao(
        selectedPoste.id,
        {
          id: `mnt-${Date.now()}`,
          descricao: descricao.trim(),
          data,
          responsavel: responsavel.trim(),
        },
        {
          status,
          luminariaEstado,
          bracoEstado,
        },
      );
      navigation.replace("PosteDetails", { posteId: selectedPoste.id });
    } catch (error) {
      Alert.alert("Manutencao nao registrada", getErrorMessage(error));
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }} selectable>
          {selectedPoste.codigo}
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          {selectedPoste.bairro} - {selectedPoste.enderecoReferencia}
        </Text>
      </View>

      <Field
        label="Descricao da manutencao"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descreva o servico executado em campo"
        multiline
        style={{ minHeight: 112, textAlignVertical: "top", paddingTop: 12 }}
      />
      <Field label="Data" value={data} onChangeText={setData} placeholder="AAAA-MM-DD" />
      <Field label="Responsavel" value={responsavel} onChangeText={setResponsavel} placeholder="Equipe de campo" />
      <SelectField label="Status do poste apos manutencao" value={status} options={["ativo", "manutencao", "inativo"]} onChange={setStatus} />
      <SelectField
        label="Estado da luminaria apos manutencao"
        value={luminariaEstado}
        options={["funcionando", "queimada", "oscilando", "danificada"]}
        onChange={setLuminariaEstado}
      />
      <SelectField label="Estado do braco apos manutencao" value={bracoEstado} options={["bom", "danificado", "necessita troca"]} onChange={setBracoEstado} />
      <ButtonPrimary label="Salvar manutencao local" onPress={salvar} />
    </ScrollView>
  );
}

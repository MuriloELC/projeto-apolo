import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, FlatList, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { Denuncia, DenunciaStatus } from "../types/Denuncia";
import { RootStackParamList } from "../types/Navigation";
import { canManageAssets } from "../types/Usuario";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatDate";
import { denunciaTipoLabel } from "../utils/labels";
import { colors, getDenunciaStatusColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Denuncias">;

function nextStatus(status: DenunciaStatus): DenunciaStatus {
  if (status === "recebida") return "em_analise";
  if (status === "em_analise") return "convertida_os";
  if (status === "convertida_os") return "resolvida";
  return "resolvida";
}

export function DenunciasScreen({ navigation }: Props) {
  const { denuncias, ordens, postes, currentUser, updateDenunciaStatus } = useAppData();
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const visibleDenuncias = canManage
    ? denuncias
    : denuncias.filter((denuncia) => denuncia.criadaPorId === currentUser?.id);

  async function handleUpdateStatus(denunciaId: string, status: DenunciaStatus) {
    try {
      await updateDenunciaStatus(denunciaId, status);
    } catch (error) {
      Alert.alert("Status nao atualizado", getErrorMessage(error));
    }
  }

  function renderItem({ item }: { item: Denuncia }) {
    const poste = item.posteId ? postes.find((posteItem) => posteItem.id === item.posteId) : undefined;
    const ordemGerada = ordens.find((ordem) => ordem.denunciaId === item.id);
    const isDone = item.status === "resolvida";

    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} selectable>
              {item.codigo}
            </Text>
            <Text style={{ color: colors.muted }} selectable>
              {item.bairro} · {formatDate(item.dataAbertura)}
            </Text>
          </View>
          <StatusBadge label={item.status} color={getDenunciaStatusColor(item.status)} />
        </View>
        <Text style={{ color: colors.text, fontWeight: "700" }} selectable>
          {denunciaTipoLabel(item.tipo)}
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          {item.descricao}
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          Referência: {item.enderecoReferencia}
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          Poste: {poste?.codigo ?? "não informado"} · por {item.criadaPorNome}
        </Text>
        {ordemGerada ? (
          <Text style={{ color: colors.muted }} selectable>
            OS gerada: {ordemGerada.codigo}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ButtonPrimary
            label={ordemGerada ? "OS gerada" : "Gerar OS"}
            disabled={!canManage || !poste || Boolean(ordemGerada) || isDone}
            style={{ flex: 1 }}
            onPress={() => poste && navigation.navigate("OrdemForm", { posteId: poste.id, denunciaId: item.id })}
          />
          <ButtonPrimary
            label="Poste"
            variant="secondary"
            disabled={!poste}
            style={{ flex: 1 }}
            onPress={() => poste && navigation.navigate("PosteDetails", { posteId: poste.id })}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ButtonPrimary
            label={isDone ? "Resolvida" : "Avançar status"}
            disabled={!canManage || isDone}
            style={{ flex: 1 }}
            onPress={() => handleUpdateStatus(item.id, nextStatus(item.status))}
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={[...visibleDenuncias].sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura))}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={<ButtonPrimary label="Registrar denúncia" onPress={() => navigation.navigate("DenunciaForm")} />}
      renderItem={renderItem}
      ListEmptyComponent={
        <Text style={{ color: colors.muted, textAlign: "center", padding: 20 }} selectable>
          Nenhuma denúncia registrada para este perfil.
        </Text>
      }
    />
  );
}

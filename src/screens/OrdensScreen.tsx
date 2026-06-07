import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, FlatList, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { OrdemServico, OrdemStatus } from "../types/OrdemServico";
import { canManageAssets } from "../types/Usuario";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatDate";
import { ordemTipoLabel } from "../utils/labels";
import { colors, getOrdemStatusColor, getPrioridadeColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Ordens">;

function nextStatus(status: OrdemStatus): OrdemStatus {
  if (status === "aberta") return "em_andamento";
  if (status === "em_andamento") return "concluida";
  return "concluida";
}

export function OrdensScreen({ navigation }: Props) {
  const { ordens, postes, currentUser, updateOrdemStatus } = useAppData();
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;

  async function handleUpdateStatus(ordemId: string, status: OrdemStatus) {
    try {
      await updateOrdemStatus(ordemId, status);
    } catch (error) {
      Alert.alert("Status nao atualizado", getErrorMessage(error));
    }
  }

  function renderItem({ item }: { item: OrdemServico }) {
    const poste = postes.find((posteItem) => posteItem.id === item.posteId);
    const isDone = item.status === "concluida";

    return (
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} selectable>
              {item.codigo}
            </Text>
            <Text style={{ color: colors.muted }} selectable>
              {poste?.codigo ?? "Poste não encontrado"} · {formatDate(item.dataAbertura)}
            </Text>
          </View>
          <StatusBadge label={item.status} color={getOrdemStatusColor(item.status)} />
        </View>
        <Text style={{ color: colors.text }} selectable>
          {ordemTipoLabel(item.tipo)}
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          Origem: {item.origem === "denuncia" ? item.denunciaCodigo ?? "denuncia" : "manual"}
          {item.solicitante ? ` - solicitante ${item.solicitante}` : ""}
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          Atualizada em {formatDate(item.dataAtualizacao)} por {item.atualizadaPor}
        </Text>
        {item.dataConclusao ? (
          <Text style={{ color: colors.muted }} selectable>
            Concluida em {formatDate(item.dataConclusao)} por {item.concluidaPor ?? item.atualizadaPor}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          {item.descricao}
        </Text>
        <StatusBadge label={`prioridade ${item.prioridade}`} color={getPrioridadeColor(item.prioridade)} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ButtonPrimary
            label={isDone ? "Concluída" : item.status === "aberta" ? "Iniciar" : "Concluir"}
            variant={isDone ? "secondary" : "primary"}
            disabled={!canManage || isDone}
            style={{ flex: 1 }}
            onPress={() => handleUpdateStatus(item.id, nextStatus(item.status))}
          />
          <ButtonPrimary
            label="Poste"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => poste && navigation.navigate("PosteDetails", { posteId: poste.id })}
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={[...ordens].sort((a, b) => a.status.localeCompare(b.status))}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={<ButtonPrimary label="Criar nova OS" disabled={!canManage} onPress={() => navigation.navigate("OrdemForm")} />}
      renderItem={renderItem}
    />
  );
}

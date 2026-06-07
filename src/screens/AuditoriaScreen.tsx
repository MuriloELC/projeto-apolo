import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, Share, Text, TextInput, View } from "react-native";
import { AccessGuard } from "../components/AccessGuard";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { canControlSystem, canManageAssets } from "../types/Usuario";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatDate";
import { buildLocalBackupJson } from "../utils/localBackup";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Auditoria">;

export function AuditoriaScreen({ navigation }: Props) {
  const {
    auditLogs,
    denuncias,
    ordens,
    postes,
    syncQueue,
    currentUser,
    markSyncQueueAsSynced,
    retryFailedSyncQueue,
    restoreLocalBackupFromJson,
  } = useAppData();
  const [backupJson, setBackupJson] = useState("");
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const canSync = currentUser ? canControlSystem(currentUser.perfil) : false;
  const pendingSync = syncQueue.filter((item) => item.status === "pending");
  const failedSync = syncQueue.filter((item) => item.status === "failed");

  if (!canManage) {
    return (
      <AccessGuard
        allowed={false}
        message="A trilha de auditoria e visivel apenas para admin e funcionarios."
        onAction={() => navigation.navigate("Dashboard")}
      >
        <View />
      </AccessGuard>
    );
  }

  async function compartilharBackupLocal() {
    try {
      await Share.share({
        title: "backup-luminarias.json",
        message: buildLocalBackupJson({
          postes,
          ordens,
          denuncias,
          auditLogs,
          syncQueue,
          currentUser,
        }),
      });
    } catch {
      Alert.alert("Backup nao compartilhado", "Nao foi possivel abrir o compartilhamento do dispositivo.");
    }
  }

  async function restaurarBackupLocal() {
    if (!backupJson.trim()) {
      Alert.alert("Backup vazio", "Cole o JSON de backup antes de restaurar.");
      return;
    }

    try {
      await restoreLocalBackupFromJson(backupJson);
      setBackupJson("");
      Alert.alert("Backup restaurado", "O estado local foi restaurado no dispositivo.");
    } catch (error) {
      Alert.alert("Backup nao restaurado", getErrorMessage(error));
    }
  }

  function confirmarRestauracaoBackup() {
    Alert.alert(
      "Restaurar backup",
      "Esta acao substitui postes, ordens, denuncias, auditoria e fila de sync locais pelo conteudo do backup.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Restaurar", style: "destructive", onPress: () => void restaurarBackupLocal() },
      ],
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }} selectable>
          Sincronizacao offline
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          {pendingSync.length} pendente(s) e {failedSync.length} com falha aguardando acao local.
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Apenas admin pode marcar pendencias como sincronizadas.
        </Text>
        <ButtonPrimary
          label="Simular envio ao backend"
          disabled={!canSync || pendingSync.length === 0}
          onPress={markSyncQueueAsSynced}
        />
        <ButtonPrimary
          label="Reprocessar falhas"
          variant="secondary"
          disabled={!canSync || failedSync.length === 0}
          onPress={retryFailedSyncQueue}
        />
        <ButtonPrimary
          label="Compartilhar backup JSON"
          variant="secondary"
          disabled={!canSync}
          onPress={compartilharBackupLocal}
        />
        <TextInput
          value={backupJson}
          onChangeText={setBackupJson}
          editable={canSync}
          placeholder="Cole aqui um backup JSON para restaurar"
          multiline
          style={{
            minHeight: 96,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: "#ffffff",
            color: colors.text,
            padding: 12,
            textAlignVertical: "top",
          }}
        />
        <ButtonPrimary
          label="Restaurar backup JSON"
          variant="danger"
          disabled={!canSync || backupJson.trim().length === 0}
          onPress={confirmarRestauracaoBackup}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Fila local
        </Text>
        {syncQueue.slice(0, 20).map((item) => (
          <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <Text style={{ color: colors.text, fontWeight: "800", flex: 1 }} selectable>
                {item.entityCode ?? item.entityId}
              </Text>
              <StatusBadge label={item.status} color={syncStatusColor(item.status)} />
            </View>
            <Text style={{ color: colors.muted }} selectable>
              {item.operation} - {item.entity} - tentativas {item.attempts}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
              Ator {item.actorId} ({item.actorRole}) - payload {item.payloadSnapshot ? "pronto" : "ausente"}
            </Text>
            {item.remoteVersion ? (
              <Text style={{ color: colors.muted }} selectable>
                Versao remota {item.remoteVersion}
              </Text>
            ) : null}
            {item.lastError ? (
              <Text style={{ color: colors.danger, lineHeight: 20 }} selectable>
                Erro: {item.lastError}
              </Text>
            ) : null}
            <Text style={{ color: colors.muted, fontSize: 12 }} selectable>
              Idempotencia: {item.idempotencyKey}
            </Text>
          </View>
        ))}
        {syncQueue.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 20 }} selectable>
            Nenhuma alteracao local pendente.
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Trilha de auditoria
        </Text>
        {auditLogs.slice(0, 50).map((log) => (
          <View key={log.id} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: "800" }} selectable>
              {log.summary}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
              {log.actorName} - {log.actorRole} - {formatDate(log.timestamp)}
            </Text>
            <StatusBadge label={log.action} color={colors.blue} />
          </View>
        ))}
        {auditLogs.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 20 }} selectable>
            Nenhum evento registrado ainda.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function syncStatusColor(status: "pending" | "synced" | "failed") {
  if (status === "pending") return colors.warning;
  if (status === "failed") return colors.danger;
  return colors.success;
}

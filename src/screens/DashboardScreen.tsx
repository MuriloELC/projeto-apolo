import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { CardResumo } from "../components/CardResumo";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { canControlSystem, canManageAssets } from "../types/Usuario";
import { formatDate } from "../utils/formatDate";
import { colors, getLuminariaEstadoColor, getPosteStatusColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const { postes, ordens, denuncias, syncQueue, currentUser, logout, isLoading } = useAppData();
  const canManage = currentUser ? canManageAssets(currentUser.perfil) : false;
  const canControl = currentUser ? canControlSystem(currentUser.perfil) : false;
  const totalLed = postes.filter((poste) => poste.luminaria.tipo === "LED").length;
  const luminariasComProblema = postes.filter((poste) => poste.luminaria.estado !== "funcionando").length;
  const ordensAbertas = ordens.filter((ordem) => ordem.status !== "concluida").length;
  const denunciasAbertas = denuncias.filter((denuncia) => denuncia.status !== "resolvida").length;
  const syncPendente = syncQueue.filter((item) => item.status === "pending").length;
  const ultimosCadastros = [...postes]
    .sort((a, b) => b.dataCadastro.localeCompare(a.dataCadastro))
    .slice(0, 3);

  if (isLoading || !currentUser) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.muted }} selectable>
          Carregando sessao local...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }} selectable>
          Parque de iluminacao
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Visao rapida para cadastro, vistoria, denuncias e manutencao em campo.
        </Text>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }} selectable>
          Sessao
        </Text>
        <Text style={{ color: colors.muted }} selectable>
          {currentUser.nome} - {currentUser.email} - {currentUser.perfil}
        </Text>
        <ButtonPrimary label="Sair" variant="secondary" onPress={logout} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <CardResumo title="Postes cadastrados" value={postes.length} />
        <CardResumo title="Luminarias LED" value={totalLed} accentColor={colors.blue} />
        <CardResumo title="Com problema" value={luminariasComProblema} accentColor={colors.danger} />
        <CardResumo title="OS abertas" value={ordensAbertas} accentColor={colors.warning} />
        <CardResumo title="Denuncias abertas" value={denunciasAbertas} accentColor={colors.blue} />
        <CardResumo title="Sync pendente" value={syncPendente} accentColor={colors.primary} />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Acoes rapidas
        </Text>
        <View style={{ gap: 10 }}>
          <ButtonPrimary label="Cadastrar poste" disabled={!canManage} onPress={() => navigation.navigate("PosteForm")} />
          <ButtonPrimary label="Ver mapa" variant="secondary" onPress={() => navigation.navigate("Map")} />
          <ButtonPrimary label="Ver lista de postes" variant="secondary" onPress={() => navigation.navigate("PostesList")} />
          <ButtonPrimary label="Inventario e relatorios" variant="secondary" onPress={() => navigation.navigate("Inventario")} />
          <ButtonPrimary label="Abrir ordem de servico" disabled={!canManage} variant="secondary" onPress={() => navigation.navigate("OrdemForm")} />
          <ButtonPrimary label="Denuncias" variant="secondary" onPress={() => navigation.navigate("Denuncias")} />
          <ButtonPrimary label="Auditoria e sincronizacao" disabled={!canManage} variant="secondary" onPress={() => navigation.navigate("Auditoria")} />
          <ButtonPrimary label="Usuarios e perfis" disabled={!canControl} variant="secondary" onPress={() => navigation.navigate("Usuarios")} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Ultimos cadastros
        </Text>
        {ultimosCadastros.map((poste) => (
          <View
            key={poste.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }} selectable>
                  {poste.codigo}
                </Text>
                <Text style={{ color: colors.muted }} selectable>
                  {poste.bairro} - instalado em {formatDate(poste.luminaria.dataInstalacao)}
                </Text>
              </View>
              <StatusBadge label={poste.status} color={getPosteStatusColor(poste.status)} />
            </View>
            <StatusBadge label={poste.luminaria.estado} color={getLuminariaEstadoColor(poste.luminaria.estado)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

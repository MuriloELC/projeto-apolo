import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, Text, View } from "react-native";
import { AccessGuard } from "../components/AccessGuard";
import { StatusBadge } from "../components/StatusBadge";
import { mockUsers } from "../data/mockUsers";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { PerfilAcesso, canControlSystem, canManageAssets } from "../types/Usuario";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Usuarios">;

const permissions: Array<{ label: string; check: (perfil: PerfilAcesso) => boolean }> = [
  { label: "Consultar ativos", check: () => true },
  { label: "Registrar denuncias", check: () => true },
  { label: "Cadastrar/editar postes", check: canManageAssets },
  { label: "Atualizar OS e denuncias", check: canManageAssets },
  { label: "Registrar manutencao", check: canManageAssets },
  { label: "Auditoria e sync administrativo", check: canControlSystem },
];

export function UsuariosScreen({ navigation }: Props) {
  const { currentUser } = useAppData();
  const isAdmin = currentUser ? canControlSystem(currentUser.perfil) : false;

  if (!isAdmin) {
    return (
      <AccessGuard
        allowed={false}
        message="A gestao de usuarios e perfis e visivel apenas para administradores."
        onAction={() => navigation.navigate("Dashboard")}
      >
        <View />
      </AccessGuard>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }} selectable>
          Usuarios e perfis
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Contas mockadas para validar a divisao de acesso antes do backend real.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Contas
        </Text>
        {mockUsers.map((user) => (
          <View key={user.id} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} selectable>
                  {user.nome}
                </Text>
                <Text style={{ color: colors.muted }} selectable>
                  {user.email}
                </Text>
              </View>
              <StatusBadge label={user.perfil} color={user.perfil === "admin" ? colors.danger : user.perfil === "funcionario" ? colors.primary : colors.blue} />
            </View>
            <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
              Credencial demonstrativa com hash e salt local. Edicao de usuarios deve ser feita pelo backend futuro.
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Matriz de permissoes
        </Text>
        {permissions.map((permission) => (
          <View key={permission.label} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
            <Text style={{ color: colors.text, fontWeight: "800" }} selectable>
              {permission.label}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(["admin", "funcionario", "cidadao"] satisfies PerfilAcesso[]).map((perfil) => (
                <StatusBadge
                  key={perfil}
                  label={`${perfil}: ${permission.check(perfil) ? "sim" : "nao"}`}
                  color={permission.check(perfil) ? colors.success : colors.inactive}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

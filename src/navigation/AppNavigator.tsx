import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuditoriaScreen } from "../screens/AuditoriaScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DenunciaFormScreen } from "../screens/DenunciaFormScreen";
import { DenunciasScreen } from "../screens/DenunciasScreen";
import { InventarioScreen } from "../screens/InventarioScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ManutencaoFormScreen } from "../screens/ManutencaoFormScreen";
import { MapScreen } from "../screens/MapScreen";
import { OrdemFormScreen } from "../screens/OrdemFormScreen";
import { OrdensScreen } from "../screens/OrdensScreen";
import { PosteDetailsScreen } from "../screens/PosteDetailsScreen";
import { PosteFormScreen } from "../screens/PosteFormScreen";
import { PostesListScreen } from "../screens/PostesListScreen";
import { UsuariosScreen } from "../screens/UsuariosScreen";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { colors } from "../utils/statusColors";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated } = useAppData();

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Dashboard" : "Login"}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Acesso" }} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Iluminacao Publica" }} />
          <Stack.Screen name="PostesList" component={PostesListScreen} options={{ title: "Postes" }} />
          <Stack.Screen name="PosteDetails" component={PosteDetailsScreen} options={{ title: "Detalhes do poste" }} />
          <Stack.Screen name="PosteForm" component={PosteFormScreen} options={{ title: "Cadastro de poste" }} />
          <Stack.Screen name="ManutencaoForm" component={ManutencaoFormScreen} options={{ title: "Registrar manutencao" }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: "Mapa de postes" }} />
          <Stack.Screen name="Ordens" component={OrdensScreen} options={{ title: "Ordens de servico" }} />
          <Stack.Screen name="OrdemForm" component={OrdemFormScreen} options={{ title: "Nova ordem de servico" }} />
          <Stack.Screen name="Denuncias" component={DenunciasScreen} options={{ title: "Denuncias" }} />
          <Stack.Screen name="DenunciaForm" component={DenunciaFormScreen} options={{ title: "Nova denuncia" }} />
          <Stack.Screen name="Auditoria" component={AuditoriaScreen} options={{ title: "Auditoria e sync" }} />
          <Stack.Screen name="Inventario" component={InventarioScreen} options={{ title: "Inventario" }} />
          <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: "Usuarios e perfis" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

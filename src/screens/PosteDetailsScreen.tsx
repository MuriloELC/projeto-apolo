import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, ScrollView, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { formatDate } from "../utils/formatDate";
import { ordemTipoLabel } from "../utils/labels";
import { colors, getLuminariaEstadoColor, getPosteStatusColor } from "../utils/statusColors";
import { canManageAssets } from "../types/Usuario";

type Props = NativeStackScreenProps<RootStackParamList, "PosteDetails">;

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }} selectable>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 15 }} selectable>
        {value}
      </Text>
    </View>
  );
}

export function PosteDetailsScreen({ navigation, route }: Props) {
  const { postes, ordens, currentUser } = useAppData();
  const poste = postes.find((item) => item.id === route.params.posteId);

  if (!poste || !currentUser) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: colors.muted }} selectable>
          Poste não encontrado.
        </Text>
      </View>
    );
  }

  const ordensDoPoste = ordens.filter((ordem) => ordem.posteId === poste.id);
  const canManage = canManageAssets(currentUser.perfil);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }} selectable>
              {poste.codigo}
            </Text>
            <Text style={{ color: colors.muted }} selectable>
              {poste.bairro}
            </Text>
          </View>
          <StatusBadge label={poste.status} color={getPosteStatusColor(poste.status)} />
        </View>
        <InfoRow label="Referência" value={poste.enderecoReferencia} />
        <InfoRow label="Patrimônio" value={poste.patrimonioId} />
        <InfoRow label="Localização" value={`${poste.latitude.toFixed(5)}, ${poste.longitude.toFixed(5)}`} />
        <InfoRow label="Circuito" value={`${poste.circuito} · ${poste.transformadorReferencia}`} />
        <InfoRow label="Altura" value={`${poste.alturaMetros} m`} />
        <InfoRow label="Cadastro" value={`${formatDate(poste.dataCadastro)} por ${poste.cadastradoPor}`} />
        <InfoRow label="Última alteração" value={`${formatDate(poste.dataAtualizacao)} por ${poste.atualizadoPor}`} />
      </View>

      {poste.fotoUri ? (
        <Image source={{ uri: poste.fotoUri }} style={{ width: "100%", height: 190, borderRadius: 8, backgroundColor: colors.border }} />
      ) : (
        <View style={{ height: 120, borderRadius: 8, backgroundColor: "#e7eef2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted, fontWeight: "700" }} selectable>
            Foto mockada não anexada
          </Text>
        </View>
      )}

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Luminária
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <StatusBadge label={poste.luminaria.tipo} color={colors.blue} />
          <StatusBadge label={poste.luminaria.estado} color={getLuminariaEstadoColor(poste.luminaria.estado)} />
        </View>
        <InfoRow label="Potência" value={`${poste.luminaria.potencia} W`} />
        <InfoRow label="Marca/modelo" value={`${poste.luminaria.marca} · ${poste.luminaria.modelo}`} />
        <InfoRow label="Especificação" value={poste.luminaria.especificacao} />
        <InfoRow label="Produto/licitação" value={`${poste.luminaria.produtoId} · ${poste.luminaria.numeroLicitacao}`} />
        <InfoRow label="Compra" value={`${formatDate(poste.luminaria.dataCompra)} · ${poste.luminaria.fornecedor}`} />
        <InfoRow label="Garantia" value={`${poste.luminaria.garantiaMeses} meses`} />
        <InfoRow label="Data de instalação" value={formatDate(poste.luminaria.dataInstalacao)} />
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Braço e poste
        </Text>
        <InfoRow label="Tipo do poste" value={poste.tipoPoste} />
        <InfoRow label="Braço" value={`${poste.braco.tipo} · ${poste.braco.material} · ${poste.braco.estado}`} />
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Histórico de manutenções
        </Text>
        {poste.historicoManutencoes.map((item) => (
          <InfoRow key={item.id} label={`${formatDate(item.data)} · ${item.responsavel}`} value={item.descricao} />
        ))}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
          Ordens de serviço
        </Text>
        {ordensDoPoste.length === 0 ? (
          <Text style={{ color: colors.muted }} selectable>
            Nenhuma OS vinculada.
          </Text>
        ) : (
          ordensDoPoste.map((ordem) => (
            <InfoRow
              key={ordem.id}
              label={`${ordem.codigo} · ${ordem.status}`}
              value={`${ordemTipoLabel(ordem.tipo)}${ordem.denunciaCodigo ? ` - origem ${ordem.denunciaCodigo}` : ""} - atualizada por ${ordem.atualizadaPor}`}
            />
          ))
        )}
      </View>

      <View style={{ gap: 10 }}>
        <ButtonPrimary label="Editar cadastro" disabled={!canManage} onPress={() => navigation.navigate("PosteForm", { posteId: poste.id })} />
        <ButtonPrimary label="Abrir ordem de serviço" disabled={!canManage} variant="secondary" onPress={() => navigation.navigate("OrdemForm", { posteId: poste.id })} />
        <ButtonPrimary label="Registrar denúncia" variant="secondary" onPress={() => navigation.navigate("DenunciaForm", { posteId: poste.id })} />
        <ButtonPrimary label="Ver no mapa" variant="secondary" onPress={() => navigation.navigate("Map", { posteId: poste.id })} />
        <ButtonPrimary
          label="Registrar manutenção"
          disabled={!canManage}
          variant="secondary"
          onPress={() => navigation.navigate("ManutencaoForm", { posteId: poste.id })}
        />
      </View>
    </ScrollView>
  );
}

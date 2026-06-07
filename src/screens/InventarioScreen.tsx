import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode } from "react";
import { Alert, ScrollView, Share, Text, View } from "react-native";
import { ButtonPrimary } from "../components/ButtonPrimary";
import { CardResumo } from "../components/CardResumo";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import {
  countBy,
  installationAgeMonths,
  isWarrantyExpired,
  isWarrantyExpiringSoon,
  toCountRows,
  warrantyEndDate,
} from "../utils/assetMetrics";
import { formatDate } from "../utils/formatDate";
import { buildDenunciasCsv, buildOrdensCsv, buildPostesCsv } from "../utils/reportCsv";
import { colors, getLuminariaEstadoColor, getPosteStatusColor } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "Inventario">;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }} selectable>
        {title}
      </Text>
      {children}
    </View>
  );
}

function CountList({ rows }: { rows: { label: string; count: number }[] }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={{
            padding: 14,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: colors.border,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "700", flex: 1 }} selectable>
            {row.label}
          </Text>
          <Text style={{ color: colors.muted, fontWeight: "800", fontVariant: ["tabular-nums"] }} selectable>
            {row.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function InventarioScreen({ navigation }: Props) {
  const { postes, ordens, denuncias } = useAppData();
  const totalPotencia = postes.reduce((sum, poste) => sum + poste.luminaria.potencia, 0);
  const problemas = postes.filter((poste) => poste.status !== "ativo" || poste.luminaria.estado !== "funcionando");
  const garantiaVencida = postes.filter((poste) => isWarrantyExpired(poste));
  const garantiaVencendo = postes.filter((poste) => isWarrantyExpiringSoon(poste));
  const ordensPendentes = ordens.filter((ordem) => ordem.status !== "concluida");
  const denunciasPendentes = denuncias.filter((denuncia) => denuncia.status !== "resolvida");
  const porBairro = toCountRows(countBy(postes.map((poste) => poste.bairro)));
  const porTipoLuminaria = toCountRows(countBy(postes.map((poste) => poste.luminaria.tipo)));
  const porLicitacao = toCountRows(countBy(postes.map((poste) => poste.luminaria.numeroLicitacao)));
  const porFornecedor = toCountRows(countBy(postes.map((poste) => poste.luminaria.fornecedor)));
  const ativosCriticos = [...problemas]
    .sort((a, b) => b.dataAtualizacao.localeCompare(a.dataAtualizacao))
    .slice(0, 8);

  async function compartilharCsv(title: string, csv: string) {
    try {
      await Share.share({ title, message: csv });
    } catch {
      Alert.alert("Relatorio nao compartilhado", "Nao foi possivel abrir o compartilhamento do dispositivo.");
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }} selectable>
          Inventario dos ativos
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
          Controle patrimonial, tecnico e operacional do parque de iluminacao.
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <CardResumo title="Ativos" value={postes.length} />
        <CardResumo title="Potencia instalada" value={`${totalPotencia} W`} accentColor={colors.blue} />
        <CardResumo title="Com problema" value={problemas.length} accentColor={colors.danger} />
        <CardResumo title="Garantia vencida" value={garantiaVencida.length} accentColor={colors.warning} />
        <CardResumo title="Garantia 120 dias" value={garantiaVencendo.length} accentColor={colors.primary} />
        <CardResumo title="Demandas abertas" value={ordensPendentes.length + denunciasPendentes.length} accentColor={colors.warning} />
      </View>

      <Section title="Distribuicao por bairro">
        <CountList rows={porBairro} />
      </Section>

      <Section title="Tecnologia instalada">
        <CountList rows={porTipoLuminaria} />
      </Section>

      <Section title="Contratos e compras">
        <CountList rows={porLicitacao} />
        <CountList rows={porFornecedor} />
      </Section>

      <Section title="Relatorios locais">
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
          <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
            Gere CSV com os dados locais atuais para conferencia, prestacao de contas ou analise fora do app.
          </Text>
          <ButtonPrimary label="Compartilhar CSV de postes" onPress={() => compartilharCsv("postes.csv", buildPostesCsv(postes))} />
          <ButtonPrimary label="Compartilhar CSV de OS" variant="secondary" onPress={() => compartilharCsv("ordens.csv", buildOrdensCsv(ordens))} />
          <ButtonPrimary
            label="Compartilhar CSV de denuncias"
            variant="secondary"
            onPress={() => compartilharCsv("denuncias.csv", buildDenunciasCsv(denuncias))}
          />
        </View>
      </Section>

      <Section title="Ativos com atencao">
        {ativosCriticos.map((poste) => {
          const warrantyEnd = warrantyEndDate(poste);
          return (
            <View key={poste.id} style={{ backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} selectable>
                    {poste.codigo} - {poste.patrimonioId}
                  </Text>
                  <Text style={{ color: colors.muted }} selectable>
                    {poste.bairro} - {poste.luminaria.marca} {poste.luminaria.modelo}
                  </Text>
                </View>
                <StatusBadge label={poste.status} color={getPosteStatusColor(poste.status)} />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <StatusBadge label={poste.luminaria.estado} color={getLuminariaEstadoColor(poste.luminaria.estado)} />
                <StatusBadge label={`${installationAgeMonths(poste)} meses instalada`} color={colors.blue} />
              </View>
              <Text style={{ color: colors.muted, lineHeight: 20 }} selectable>
                Compra {formatDate(poste.luminaria.dataCompra)} - Licitacao {poste.luminaria.numeroLicitacao} - Garantia ate {warrantyEnd ? formatDate(warrantyEnd.toISOString()) : "nao informada"}
              </Text>
              <Text
                style={{ color: colors.primaryDark, fontWeight: "800" }}
                selectable
                onPress={() => navigation.navigate("PosteDetails", { posteId: poste.id })}
              >
                Ver cadastro completo
              </Text>
            </View>
          );
        })}
      </Section>
    </ScrollView>
  );
}

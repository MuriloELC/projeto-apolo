import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Field, SelectField } from "../components/FormControls";
import { PosteCard } from "../components/PosteCard";
import { useAppData } from "../storage/AppDataContext";
import { RootStackParamList } from "../types/Navigation";
import { LuminariaTipo, PosteStatus } from "../types/Poste";
import { colors } from "../utils/statusColors";

type Props = NativeStackScreenProps<RootStackParamList, "PostesList">;
type ProblemaFiltro = "todos" | "com_problema" | "sem_problema";

export function PostesListScreen({ navigation }: Props) {
  const { postes } = useAppData();
  const [busca, setBusca] = useState("");
  const [bairro, setBairro] = useState("todos");
  const [status, setStatus] = useState<PosteStatus | "todos">("todos");
  const [tipo, setTipo] = useState<LuminariaTipo | "todos">("todos");
  const [problema, setProblema] = useState<ProblemaFiltro>("todos");

  const bairros = useMemo(() => ["todos", ...Array.from(new Set(postes.map((poste) => poste.bairro)))], [postes]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return postes.filter((poste) => {
      const matchesBusca =
        !termo ||
        poste.codigo.toLowerCase().includes(termo) ||
        poste.patrimonioId.toLowerCase().includes(termo) ||
        poste.bairro.toLowerCase().includes(termo) ||
        poste.enderecoReferencia.toLowerCase().includes(termo);
      const matchesBairro = bairro === "todos" || poste.bairro === bairro;
      const matchesStatus = status === "todos" || poste.status === status;
      const matchesTipo = tipo === "todos" || poste.luminaria.tipo === tipo;
      const hasProblema = poste.luminaria.estado !== "funcionando" || poste.status !== "ativo";
      const matchesProblema =
        problema === "todos" || (problema === "com_problema" ? hasProblema : !hasProblema);

      return matchesBusca && matchesBairro && matchesStatus && matchesTipo && matchesProblema;
    });
  }, [bairro, busca, postes, problema, status, tipo]);

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <Field label="Buscar" value={busca} onChangeText={setBusca} placeholder="Código, bairro ou referência" />
          <SelectField label="Bairro" value={bairro} options={bairros} onChange={setBairro} />
          <SelectField
            label="Status"
            value={status}
            options={["todos", "ativo", "manutencao", "inativo"]}
            onChange={setStatus}
          />
          <SelectField
            label="Tipo de luminária"
            value={tipo}
            options={["todos", "LED", "Vapor de Sódio", "Vapor Metálico"]}
            onChange={setTipo}
          />
          <SelectField
            label="Problema"
            value={problema}
            options={["todos", "com_problema", "sem_problema"]}
            onChange={setProblema}
          />
          <Text style={{ color: colors.muted, fontWeight: "700" }} selectable>
            {filtrados.length} poste(s) encontrado(s)
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <PosteCard poste={item} onPress={() => navigation.navigate("PosteDetails", { posteId: item.id })} />
      )}
      ListEmptyComponent={
        <Text style={{ color: colors.muted, textAlign: "center", padding: 20 }} selectable>
          Nenhum poste encontrado com os filtros atuais.
        </Text>
      }
    />
  );
}

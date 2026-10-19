import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import api from "../lib/api";

type Usuario = { id: number; nome: string; email: string };
type NomeIcone = keyof typeof Feather.glyphMap;

type Inscricao = {
  id: number;
  status: string | null;
  inscrito_em: string | null;
  editais: {
    titulo: string;
    premio: string | null;
    categorias: { nome: string };
    edital_cidades: { cidades: { nome: string } }[];
  };
};

const statusInfo: Record<string, { rotulo: string; bg: string; texto: string; icone: NomeIcone }> = {
  pendente: { rotulo: "Em análise", bg: "#faeeda", texto: "#633806", icone: "clock" },
  selecionado: { rotulo: "Selecionado", bg: "#e1f5ee", texto: "#085041", icone: "check-circle" },
  nao_selecionado: { rotulo: "Não selecionado", bg: "#f1efe8", texto: "#5f5e5a", icone: "x-circle" },
};

const coresTag: Record<string, { bg: string; texto: string }> = {
  "Música": { bg: "#eeedfe", texto: "#3c3489" },
  "Teatro": { bg: "#e1f5ee", texto: "#085041" },
  "Dança": { bg: "#faeeda", texto: "#633806" },
};
const corPadrao = { bg: "#faece7", texto: "#4a1b0c" };

function formatarData(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
}

export default function MinhasInscricoes({ usuario }: { usuario: Usuario }) {
  const insets = useSafeAreaInsets();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const res = await api.get(`/artistas/${usuario.id}/inscricoes`);
      setInscricoes(res.data);
    } catch {
      setErro("Não foi possível carregar suas inscrições");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const selecionadas = inscricoes.filter((i) => i.status === "selecionado").length;
  const emAnalise = inscricoes.filter((i) => i.status === "pendente").length;

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 10 }]}>
        <Text style={estilos.titulo}>Minhas inscrições</Text>
      </View>

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar();
            }}
          />
        }
      >
        <View style={estilos.resumo}>
          <Resumo valor={inscricoes.length} rotulo="Inscrições" />
          <Resumo valor={selecionadas} rotulo="Selecionado" />
          <Resumo valor={emAnalise} rotulo="Em análise" />
        </View>

        {carregando ? (
          <ActivityIndicator color="#4a35d4" style={{ marginTop: 24 }} />
        ) : erro !== "" ? (
          <Text style={estilos.erro}>{erro}</Text>
        ) : inscricoes.length === 0 ? (
          <Text style={estilos.vazio}>Você ainda não se inscreveu em nenhum edital.</Text>
        ) : (
          inscricoes.map((inscricao) => {
            const edital = inscricao.editais;
            const status = statusInfo[inscricao.status ?? "pendente"] ?? statusInfo.pendente;
            const cor = coresTag[edital.categorias.nome] ?? corPadrao;
            const cidades = edital.edital_cidades.map((ec) => ec.cidades.nome).join(", ");

            return (
              <View key={inscricao.id} style={estilos.cartao}>
                <View style={estilos.cartaoTopo}>
                  <Text style={estilos.cartaoTitulo}>{edital.titulo}</Text>
                  <View style={[estilos.tag, { backgroundColor: cor.bg }]}>
                    <Text style={[estilos.tagTexto, { color: cor.texto }]}>{edital.categorias.nome}</Text>
                  </View>
                </View>

                <View style={estilos.linhaMeta}>
                  <Feather name="map-pin" size={12} color="#888" />
                  <Text style={estilos.metaTexto}>{cidades}</Text>
                </View>
                <View style={estilos.linhaMeta}>
                  <Feather name="calendar" size={12} color="#888" />
                  <Text style={estilos.metaTexto}>Inscrito em {formatarData(inscricao.inscrito_em)}</Text>
                </View>

                <View style={[estilos.status, { backgroundColor: status.bg }]}>
                  <Feather name={status.icone} size={13} color={status.texto} />
                  <Text style={[estilos.statusTexto, { color: status.texto }]}>{status.rotulo}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={estilos.resumoItem}>
      <Text style={estilos.resumoValor}>{valor}</Text>
      <Text style={estilos.resumoRotulo}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#f7f7f8" },
  topo: {
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  titulo: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  conteudo: { padding: 14, paddingBottom: 24 },
  resumo: { flexDirection: "row", gap: 8, marginBottom: 14 },
  resumoItem: {
    flex: 1, backgroundColor: "#fff", borderRadius: 10, borderWidth: 0.5,
    borderColor: "#e5e5e5", paddingVertical: 10, alignItems: "center",
  },
  resumoValor: { fontSize: 20, fontWeight: "600", color: "#1a1a2e" },
  resumoRotulo: { fontSize: 10, color: "#999", marginTop: 2 },
  cartao: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 0.5,
    borderColor: "#e5e5e5", padding: 12, marginBottom: 8,
  },
  cartaoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  cartaoTitulo: { flex: 1, marginRight: 8, fontSize: 13, fontWeight: "600", color: "#1a1a2e", lineHeight: 18 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tagTexto: { fontSize: 10, fontWeight: "600" },
  linhaMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  metaTexto: { fontSize: 11, color: "#888", flex: 1 },
  status: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusTexto: { fontSize: 11, fontWeight: "600" },
  erro: { fontSize: 13, color: "#a33", marginTop: 24, textAlign: "center" },
  vazio: { fontSize: 13, color: "#888", marginTop: 24, textAlign: "center" },
});
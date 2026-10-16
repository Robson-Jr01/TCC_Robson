import { useCallback, useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import axios from "axios";
import api from "../lib/api";

type Usuario = { id: number; nome: string; email: string };

type Edital = {
  id: number;
  titulo: string;
  descricao: string | null;
  premio: string | null;
  prazo_inscricao: string;
  exige_documentos: boolean;
  instrucoes_documentos: string | null;
  ja_inscrito: boolean;
  categorias: { nome: string };
  edital_cidades: { cidades: { nome: string } }[];
};

const coresTag: Record<string, { bg: string; texto: string }> = {
  "Música": { bg: "#eeedfe", texto: "#3c3489" },
  "Teatro": { bg: "#e1f5ee", texto: "#085041" },
  "Dança": { bg: "#faeeda", texto: "#633806" },
};
const corPadrao = { bg: "#faece7", texto: "#4a1b0c" };

// O prazo vem como "2026-12-15T00:00:00.000Z": só a data, sem conversão de fuso
function formatarPrazo(iso: string) {
  const [, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}`;
}

export default function Home({ usuario }: { usuario: Usuario }) {
  const insets = useSafeAreaInsets();
  const [editais, setEditais] = useState<Edital[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const res = await api.get(`/artistas/${usuario.id}/editais-compativeis`);
      setEditais(res.data);
    } catch (e) {
      setErro(
        axios.isAxiosError(e) && !e.response
          ? "Sem conexão com a API"
          : "Não foi possível carregar os editais"
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function inscrever(edital: Edital) {
    try {
      await api.post("/inscricoes", { edital_id: edital.id, artista_id: usuario.id });
      Alert.alert("Inscrição feita!", `Você se inscreveu em "${edital.titulo}".`);
      carregar();
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.erro
          ? e.response.data.erro
          : "Não foi possível se inscrever";
      Alert.alert("Ops", msg);
    }
  }

  function verDetalhes(edital: Edital) {
    const partes = [
      edital.descricao,
      edital.premio ? `Prêmio: ${edital.premio}` : null,
      edital.exige_documentos
        ? `Documentos: ${edital.instrucoes_documentos ?? "consulte o publicador"}`
        : null,
    ].filter(Boolean);
    Alert.alert(edital.titulo, partes.join("\n\n") || "Sem detalhes adicionais.");
  }

  const filtrados = editais.filter((e) =>
    e.titulo.toLowerCase().includes(busca.toLowerCase())
  );
  const [destaque, ...demais] = filtrados;

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 10 }]}>
        <Text style={estilos.logo}>PECAC</Text>
        <View style={estilos.sino}>
          <Feather name="bell" size={16} color="#4a35d4" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
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
        <Text style={estilos.saudacao}>
          Olá, <Text style={estilos.saudacaoNome}>{usuario.nome}!</Text>
        </Text>
        <Text style={estilos.subtitulo}>
          {editais.length} {editais.length === 1 ? "edital compatível" : "editais compatíveis"} com seu perfil
        </Text>

        <View style={estilos.busca}>
          <Feather name="search" size={15} color="#bbb" />
          <TextInput
            style={estilos.buscaInput}
            placeholder="Buscar editais..."
            placeholderTextColor="#bbb"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {carregando ? (
          <ActivityIndicator color="#4a35d4" style={{ marginTop: 24 }} />
        ) : erro !== "" ? (
          <Text style={estilos.erro}>{erro}</Text>
        ) : filtrados.length === 0 ? (
          <Text style={estilos.vazio}>Nenhum edital compatível no momento.</Text>
        ) : (
          <>
            <Text style={estilos.secao}>Em destaque</Text>
            <CartaoEdital
              edital={destaque}
              aoInscrever={() => inscrever(destaque)}
              aoVerDetalhes={() => verDetalhes(destaque)}
            />

            {demais.length > 0 && <Text style={estilos.secao}>Compatíveis com você</Text>}
            {demais.map((edital) => (
              <CartaoEdital
                key={edital.id}
                edital={edital}
                aoInscrever={() => inscrever(edital)}
                aoVerDetalhes={() => verDetalhes(edital)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CartaoEdital({
  edital,
  aoInscrever,
  aoVerDetalhes,
}: {
  edital: Edital;
  aoInscrever: () => void;
  aoVerDetalhes: () => void;
}) {
  const cor = coresTag[edital.categorias.nome] ?? corPadrao;
  const cidades = edital.edital_cidades.map((ec) => ec.cidades.nome).join(", ");
  const podeUmClique = !edital.exige_documentos && !edital.ja_inscrito;

  return (
    <View style={estilos.cartao}>
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
        <Text style={estilos.metaTexto}>Prazo: {formatarPrazo(edital.prazo_inscricao)}</Text>
      </View>
      {edital.premio ? <Text style={estilos.premio}>{edital.premio}</Text> : null}

      {edital.ja_inscrito ? (
        <View style={estilos.botaoInscrito}>
          <Text style={estilos.botaoInscritoTexto}>✓ Inscrito</Text>
        </View>
      ) : podeUmClique ? (
        <TouchableOpacity style={estilos.botao} onPress={aoInscrever}>
          <Text style={estilos.botaoTexto}>Inscrever-se com 1 clique</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={estilos.botaoContorno} onPress={aoVerDetalhes}>
        <Text style={estilos.botaoContornoTexto}>Ver detalhes</Text>
      </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 16, fontWeight: "600", color: "#4a35d4", fontFamily: "serif"},
  sino: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0eefe",
    alignItems: "center", justifyContent: "center",
  },
  conteudo: { padding: 14, paddingBottom: 24 },
  saudacao: { fontSize: 14, color: "#666" },
  saudacaoNome: { color: "#1a1a2e", fontWeight: "600" },
  subtitulo: { fontSize: 11, color: "#aaa", marginTop: 2 },
  busca: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff",
    borderWidth: 0.5, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, marginVertical: 12,
  },
  buscaInput: { flex: 1, fontSize: 13, color: "#333", paddingVertical: 6 },
  secao: {
    fontSize: 11, fontWeight: "600", color: "#999", textTransform: "uppercase",
    letterSpacing: 0.5, marginTop: 14, marginBottom: 8,
  },
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
  premio: { fontSize: 12, color: "#3a9e75", fontWeight: "600", marginTop: 6 },
  botao: { marginTop: 10, padding: 9, borderRadius: 8, backgroundColor: "#4a35d4", alignItems: "center" },
  botaoTexto: { color: "#fff", fontSize: 12, fontWeight: "600" },
  botaoContorno: {
    marginTop: 8, padding: 9, borderRadius: 8, borderWidth: 0.5,
    borderColor: "#4a35d4", alignItems: "center",
  },
  botaoContornoTexto: { color: "#4a35d4", fontSize: 12, fontWeight: "600" },
  botaoInscrito: { marginTop: 10, padding: 9, borderRadius: 8, backgroundColor: "#e1f5ee", alignItems: "center" },
  botaoInscritoTexto: { color: "#085041", fontSize: 12, fontWeight: "600" },
  erro: { fontSize: 13, color: "#a33", marginTop: 24, textAlign: "center" },
  vazio: { fontSize: 13, color: "#888", marginTop: 24, textAlign: "center" },
});
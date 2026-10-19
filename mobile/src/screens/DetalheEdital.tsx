import { useCallback, useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import axios from "axios";
import api from "../lib/api";

type Usuario = { id: number; nome: string; email: string };
type NomeIcone = keyof typeof Feather.glyphMap;

type Edital = {
  id: number;
  titulo: string;
  descricao: string | null;
  premio: string | null;
  prazo_inscricao: string;
  vagas: number | null;
  status: string | null;
  exige_documentos: boolean | null;
  instrucoes_documentos: string | null;
  categorias: { nome: string };
  especialidades: { nome: string } | null;
  publicadores: { nome: string };
  edital_cidades: { cidades: { nome: string } }[];
  inscricao: { id: number; status: string | null } | null;
  _count: { inscricoes: number };
};

const statusInfo: Record<string, { rotulo: string; bg: string; texto: string; icone: NomeIcone }> = {
  pendente: { rotulo: "Em análise", bg: "#faeeda", texto: "#633806", icone: "clock" },
  selecionado: { rotulo: "Selecionado", bg: "#e1f5ee", texto: "#085041", icone: "check-circle" },
  nao_selecionado: { rotulo: "Não selecionado", bg: "#f1efe8", texto: "#5f5e5a", icone: "x-circle" },
};

// O prazo vem como "2026-12-15T00:00:00.000Z": usamos só a parte da data, sem conversão de fuso
function formatarPrazo(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function prazoVencido(iso: string) {
  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  return iso.slice(0, 10) < hoje;
}

export default function DetalheEdital({
  usuario,
  editalId,
  aoVoltar,
}: {
  usuario: Usuario;
  editalId: number;
  aoVoltar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [edital, setEdital] = useState<Edital | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [linkDocs, setLinkDocs] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setErro("");
      const res = await api.get(`/artistas/${usuario.id}/editais/${editalId}`);
      setEdital(res.data);
    } catch {
      setErro("Não foi possível carregar este edital");
    } finally {
      setCarregando(false);
    }
  }, [usuario.id, editalId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function inscrever() {
    if (!edital) return;
    if (edital.exige_documentos && linkDocs.trim() === "") {
      Alert.alert("Documentos", "Cole o link dos documentos pedidos antes de enviar a inscrição.");
      return;
    }
    setEnviando(true);
    try {
      await api.post("/inscricoes", {
        edital_id: edital.id,
        artista_id: usuario.id,
        documentos_url: edital.exige_documentos ? linkDocs.trim() : null,
      });
      Alert.alert("Inscrição feita!", `Você se inscreveu em "${edital.titulo}".`);
      await carregar();
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.erro
          ? e.response.data.erro
          : "Não foi possível se inscrever";
      Alert.alert("Ops", msg);
    } finally {
      setEnviando(false);
    }
  }

  const fechado = edital ? edital.status !== "aberto" || prazoVencido(edital.prazo_inscricao) : false;
  const statusAtual = edital?.inscricao
    ? statusInfo[edital.inscricao.status ?? "pendente"] ?? statusInfo.pendente
    : null;
  const cidades = edital ? edital.edital_cidades.map((ec) => ec.cidades.nome) : [];
  const resumoCidades =
    cidades.length <= 2 ? cidades.join(", ") : `${cidades[0]} +${cidades.length - 1}`;
  const documentos = (edital?.instrucoes_documentos ?? "")
    .split(/[\n;,]+/)
    .map((d) => d.trim())
    .filter(Boolean);

  return (
    <View style={estilos.tela}>
      <StatusBar style="light" />

      <View style={[estilos.cabecalho, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={estilos.voltar} onPress={aoVoltar}>
          <Feather name="arrow-left" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={estilos.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        {edital ? (
          <>
            <View style={estilos.tagsCabecalho}>
              <View style={estilos.tagCabecalho}>
                <Text style={estilos.tagCabecalhoTexto}>{edital.categorias.nome}</Text>
              </View>
              {edital.especialidades ? (
                <View style={estilos.tagCabecalho}>
                  <Text style={estilos.tagCabecalhoTexto}>{edital.especialidades.nome}</Text>
                </View>
              ) : null}
            </View>
            <Text style={estilos.tituloEdital}>{edital.titulo}</Text>
            <Text style={estilos.organizacao}>{edital.publicadores.nome}</Text>
          </>
        ) : null}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled">
        {carregando ? (
          <ActivityIndicator color="#4a35d4" style={{ marginTop: 24 }} />
        ) : erro !== "" || edital === null ? (
          <Text style={estilos.erro}>{erro || "Edital não encontrado"}</Text>
        ) : (
          <>
            <View style={estilos.chips}>
              {edital.premio ? (
                <Chip icone="dollar-sign" texto={edital.premio} bg="#e1f5ee" cor="#085041" />
              ) : null}
              <Chip
                icone="calendar"
                texto={`Prazo: ${formatarPrazo(edital.prazo_inscricao)}`}
                bg="#faeeda"
                cor="#633806"
              />
              <Chip icone="map-pin" texto={resumoCidades} bg="#eeedfe" cor="#3c3489" />
            </View>

            <View style={estilos.linhaInfo}>
              <Feather name="users" size={14} color="#4a35d4" />
              <Text style={estilos.linhaInfoTexto}>
                {edital.vagas !== null
                  ? `${Math.max(0, edital.vagas - edital._count.inscricoes)} de ${edital.vagas} vagas restantes`
                  : "Sem limite de vagas"}
              </Text>
            </View>

            {edital.descricao ? (
              <>
                <Text style={estilos.secao}>Sobre o edital</Text>
                <Text style={estilos.descricao}>{edital.descricao}</Text>
              </>
            ) : null}

            {cidades.length > 2 ? (
              <>
                <Text style={estilos.secao}>Cidades participantes</Text>
                <Text style={estilos.descricao}>{cidades.join(", ")}</Text>
              </>
            ) : null}

            {edital.exige_documentos && !edital.inscricao ? (
              <>
                <Text style={estilos.secao}>Documentos necessários</Text>
                {(documentos.length > 0 ? documentos : ["Consulte o publicador do edital"]).map((doc, i) => (
                  <View key={`${i}-${doc}`} style={estilos.itemDoc}>
                    <Feather name="paperclip" size={14} color="#d85a30" />
                    <Text style={estilos.itemDocTexto}>{doc}</Text>
                  </View>
                ))}
                {!fechado ? (
                  <TextInput
                    style={estilos.input}
                    placeholder="Cole aqui o link dos documentos (ex: Google Drive)"
                    placeholderTextColor="#bbb"
                    value={linkDocs}
                    onChangeText={setLinkDocs}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                ) : null}
              </>
            ) : null}

            {!edital.inscricao && !fechado ? (
              <>
                <Text style={estilos.secao}>Seu perfil já preenche</Text>
                <View style={estilos.caixaPerfil}>
                  <Feather name="check-circle" size={14} color="#085041" />
                  <Text style={estilos.caixaPerfilTexto}>
                    Nome, contato, portfólio e redes sociais serão enviados automaticamente com seu perfil.
                  </Text>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {edital ? (
        <View style={[estilos.barraInferior, { paddingBottom: insets.bottom + 10 }]}>
          {statusAtual ? (
            <View style={[estilos.caixaStatus, { backgroundColor: statusAtual.bg }]}>
              <Feather name={statusAtual.icone} size={16} color={statusAtual.texto} />
              <Text style={[estilos.caixaStatusTexto, { color: statusAtual.texto }]}>
                Sua inscrição: {statusAtual.rotulo}
              </Text>
            </View>
          ) : fechado ? (
            <View style={[estilos.caixaStatus, { backgroundColor: "#f1efe8" }]}>
              <Feather name="lock" size={16} color="#5f5e5a" />
              <Text style={[estilos.caixaStatusTexto, { color: "#5f5e5a" }]}>Inscrições encerradas</Text>
            </View>
          ) : (
            <TouchableOpacity style={estilos.botao} onPress={inscrever} disabled={enviando}>
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={estilos.botaoConteudo}>
                  <Feather name="send" size={15} color="#fff" />
                  <Text style={estilos.botaoTexto}>
                    {edital.exige_documentos ? "Enviar inscrição" : "Inscrever-se com 1 clique"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ icone, texto, bg, cor }: { icone: NomeIcone; texto: string; bg: string; cor: string }) {
  return (
    <View style={[estilos.chip, { backgroundColor: bg }]}>
      <Feather name={icone} size={12} color={cor} />
      <Text style={[estilos.chipTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#f7f7f8" },
  cabecalho: { backgroundColor: "#4a35d4", paddingHorizontal: 14, paddingBottom: 20 },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, alignSelf: "flex-start" },
  voltarTexto: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  tagsCabecalho: { flexDirection: "row", gap: 6, marginBottom: 6 },
  tagCabecalho: {
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  tagCabecalhoTexto: { color: "#fff", fontSize: 11 },
  tituloEdital: { color: "#fff", fontSize: 16, fontWeight: "600", lineHeight: 22 },
  organizacao: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  corpo: { padding: 14, paddingBottom: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  chipTexto: { fontSize: 11, fontWeight: "600" },
  linhaInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  linhaInfoTexto: { fontSize: 12, color: "#555" },
  secao: {
    fontSize: 11, fontWeight: "600", color: "#999", textTransform: "uppercase",
    letterSpacing: 0.5, marginTop: 14, marginBottom: 6,
  },
  descricao: { fontSize: 12, color: "#555", lineHeight: 19 },
  itemDoc: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  itemDocTexto: { fontSize: 12, color: "#d85a30", flex: 1 },
  input: {
    backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#ddd", borderRadius: 8,
    padding: 10, fontSize: 12, marginTop: 8, color: "#333",
  },
  caixaPerfil: {
    flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#e1f5ee",
    borderRadius: 8, padding: 10,
  },
  caixaPerfilTexto: { flex: 1, fontSize: 12, color: "#085041", lineHeight: 17 },
  barraInferior: {
    backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#eee",
    paddingTop: 10, paddingHorizontal: 14,
  },
  botao: { backgroundColor: "#4a35d4", borderRadius: 10, padding: 12, alignItems: "center" },
  botaoConteudo: { flexDirection: "row", alignItems: "center", gap: 8 },
  botaoTexto: { color: "#fff", fontSize: 14, fontWeight: "600" },
  caixaStatus: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 10, padding: 12,
  },
  caixaStatusTexto: { fontSize: 13, fontWeight: "600" },
  erro: { fontSize: 13, color: "#a33", marginTop: 24, textAlign: "center" },
});
import { useCallback, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import api from "../lib/api";

type Usuario = { id: number; nome: string; email: string };
type Notificacao = {
  id: number;
  edital_id: number | null;
  mensagem: string;
  lida: boolean | null;
  criado_em: string | null;
};
type NomeIcone = keyof typeof Feather.glyphMap;

function tempoRelativo(iso: string | null) {
  if (!iso) return "";
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function iconeDe(mensagem: string): { nome: NomeIcone; cor: string; fundo: string } {
  if (mensagem.startsWith("Inscrição confirmada")) {
    return { nome: "check-circle", cor: "#085041", fundo: "#e1f5ee" };
  }
  if (mensagem.startsWith("Você foi selecionado") || mensagem.startsWith("Resultado")) {
    return { nome: "award", cor: "#633806", fundo: "#faeeda" };
  }
  return { nome: "file-text", cor: "#4a35d4", fundo: "#eeedfe" };
}

export default function Notificacoes({
  usuario,
  aoAtualizar,
  aoAbrirEdital,
}: {
  usuario: Usuario;
  aoAtualizar: () => void;
  aoAbrirEdital: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/artistas/${usuario.id}/notificacoes`);
      setNotificacoes(res.data);
    } catch {
      // sem conexão: mantém a lista que já estava na tela
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function marcarLidas() {
    try {
      await api.patch(`/artistas/${usuario.id}/notificacoes/lidas`);
      await carregar();
      aoAtualizar();
    } catch {
      // ignora, o usuário pode tentar de novo
    }
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.topo, { paddingTop: insets.top + 10 }]}>
        <Text style={estilos.titulo}>Notificações</Text>
        <TouchableOpacity onPress={marcarLidas}>
          <Text style={estilos.marcar}>Marcar lidas</Text>
        </TouchableOpacity>
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
        {carregando ? (
          <ActivityIndicator color="#4a35d4" style={{ marginTop: 24 }} />
        ) : notificacoes.length === 0 ? (
          <Text style={estilos.vazio}>Você ainda não tem notificações.</Text>
        ) : (
          notificacoes.map((n) => {
            const icone = iconeDe(n.mensagem);
            const nova = !n.lida;
            const idEdital = n.edital_id;
            return (
              <TouchableOpacity
                key={n.id}
                style={[estilos.item, nova && estilos.itemNovo]}
                activeOpacity={idEdital ? 0.6 : 1}
                onPress={() => {
                  if (idEdital) aoAbrirEdital(idEdital);
                }}
              >
                <View style={[estilos.icone, { backgroundColor: icone.fundo }]}>
                  <Feather name={icone.nome} size={16} color={icone.cor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.mensagem}>{n.mensagem}</Text>
                  <Text style={estilos.tempo}>{tempoRelativo(n.criado_em)}</Text>
                </View>
                {nova && <View style={estilos.ponto} />}
                {idEdital ? <Feather name="chevron-right" size={16} color="#bbb" /> : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  titulo: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  marcar: { fontSize: 12, color: "#4a35d4", fontWeight: "600" },
  conteudo: { padding: 14, paddingBottom: 24 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 0.5, borderColor: "#e5e5e5", padding: 12, marginBottom: 8,
  },
  itemNovo: { backgroundColor: "#f5f3ff", borderColor: "#d9d4fb" },
  icone: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  mensagem: { fontSize: 12, color: "#1a1a2e", lineHeight: 17 },
  tempo: { fontSize: 10, color: "#aaa", marginTop: 3 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4a35d4" },
  vazio: { fontSize: 13, color: "#888", marginTop: 24, textAlign: "center" },
});
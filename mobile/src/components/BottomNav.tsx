import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

export type Aba = "inicio" | "explorar" | "inscricoes" | "perfil";

const abas: { id: Aba; icone: keyof typeof Feather.glyphMap; rotulo: string }[] = [
  { id: "inicio", icone: "home", rotulo: "Início" },
  { id: "explorar", icone: "compass", rotulo: "Explorar" },
  { id: "inscricoes", icone: "file-text", rotulo: "Minhas Inscrições" },
  { id: "perfil", icone: "user", rotulo: "Perfil" },
];

export default function BottomNav({ ativa, aoMudar }: { ativa: Aba; aoMudar: (aba: Aba) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.barra, { paddingBottom: insets.bottom + 8 }]}>
      {abas.map((aba) => {
        const ativaAgora = aba.id === ativa;
        return (
          <TouchableOpacity key={aba.id} style={estilos.item} onPress={() => aoMudar(aba.id)}>
            <Feather name={aba.icone} size={20} color={ativaAgora ? "#4a35d4" : "#aaa"} />
            <Text style={[estilos.rotulo, ativaAgora && estilos.rotuloAtivo]}>{aba.rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e5e5",
    paddingTop: 10,
  },
  item: { alignItems: "center", gap: 3, flex: 1 },
  rotulo: { fontSize: 9, color: "#aaa" },
  rotuloAtivo: { color: "#4a35d4", fontWeight: "600" },
});
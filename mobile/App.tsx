import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import api from "./src/lib/api";
import Login from "./src/screens/Login";
import Home from "./src/screens/Home";
import Notificacoes from "./src/screens/Notificacoes";
import MinhasInscricoes from "./src/screens/MinhasInscricoes";
import DetalheEdital from "./src/screens/DetalheEdital";
import BottomNav, { type Aba } from "./src/components/BottomNav";

type Usuario = { id: number; nome: string; email: string };

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aba, setAba] = useState<Aba>("inicio");
  const [verNotificacoes, setVerNotificacoes] = useState(false);
  const [editalAberto, setEditalAberto] = useState<number | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);

  const atualizarContagem = useCallback(async () => {
    if (!usuario) return;
    try {
      const res = await api.get(`/artistas/${usuario.id}/notificacoes`);
      setNaoLidas(res.data.filter((n: { lida: boolean | null }) => !n.lida).length);
    } catch {
      // sem conexão: mantém a contagem anterior
    }
  }, [usuario]);

  useEffect(() => {
    atualizarContagem();
    const intervalo = setInterval(atualizarContagem, 10000);
    return () => clearInterval(intervalo);
  }, [atualizarContagem]);

  // Botão voltar do Android: fecha o detalhe, depois as notificações
  useEffect(() => {
    const assinatura = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editalAberto !== null) {
        setEditalAberto(null);
        return true;
      }
      if (verNotificacoes) {
        setVerNotificacoes(false);
        return true;
      }
      return false;
    });
    return () => assinatura.remove();
  }, [editalAberto, verNotificacoes]);

  function mudarAba(nova: Aba) {
    setAba(nova);
    setVerNotificacoes(false);
    setEditalAberto(null);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {usuario === null ? (
        <Login aoEntrar={(u) => setUsuario(u)} />
      ) : (
        <View style={{ flex: 1 }}>
          {editalAberto !== null ? (
            <DetalheEdital
              usuario={usuario}
              editalId={editalAberto}
              aoVoltar={() => setEditalAberto(null)}
            />
          ) : verNotificacoes ? (
            <Notificacoes
              usuario={usuario}
              aoAtualizar={atualizarContagem}
              aoAbrirEdital={(id) => setEditalAberto(id)}
            />
          ) : aba === "inicio" ? (
            <Home
              usuario={usuario}
              naoLidas={naoLidas}
              aoAbrirNotificacoes={() => setVerNotificacoes(true)}
              aoAbrirEdital={(id) => setEditalAberto(id)}
            />
          ) : aba === "inscricoes" ? (
            <MinhasInscricoes usuario={usuario} />
          ) : (
            <View style={estilos.embreve}>
              <Text style={estilos.embreveTexto}>Em breve</Text>
            </View>
          )}
          <BottomNav ativa={aba} aoMudar={mudarAba} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  embreve: { flex: 1, backgroundColor: "#f7f7f8", alignItems: "center", justifyContent: "center" },
  embreveTexto: { fontSize: 14, color: "#888" },
});
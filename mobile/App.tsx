import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Login from "./src/screens/Login";
import Home from "./src/screens/Home";
import BottomNav, { type Aba } from "./src/components/BottomNav";

type Usuario = { id: number; nome: string; email: string };

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aba, setAba] = useState<Aba>("inicio");

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {usuario === null ? (
        <Login aoEntrar={(u) => setUsuario(u)} />
      ) : (
        <View style={{ flex: 1 }}>
          {aba === "inicio" ? (
            <Home usuario={usuario} />
          ) : (
            <View style={estilos.embreve}>
              <Text style={estilos.embreveTexto}>Em breve</Text>
            </View>
          )}
          <BottomNav ativa={aba} aoMudar={setAba} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  embreve: { flex: 1, backgroundColor: "#f7f7f8", alignItems: "center", justifyContent: "center" },
  embreveTexto: { fontSize: 14, color: "#888" },
});
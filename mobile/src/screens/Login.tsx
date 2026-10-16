import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import api from "../lib/api";

type Usuario = { id: number; nome: string; email: string };
type Props = { aoEntrar: (usuario: Usuario, token: string) => void };

export default function Login({ aoEntrar }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro("");
    setCarregando(true);
    try {
      const res = await api.post("/login", { email, senha, tipo: "artista" });
      aoEntrar(res.data.usuario, res.data.token);
    } catch {
      setErro("Email ou senha inválidos, ou não foi possível conectar à API");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.tela}>
      <View style={estilos.cartao}>
        <Text style={estilos.logo}>PECAC</Text>
        <Text style={estilos.subtitulo}>Entre para ver editais compatíveis com você</Text>

        {erro !== "" && <Text style={estilos.erro}>{erro}</Text>}

        <Text style={estilos.label}>Email</Text>
        <TextInput
          style={estilos.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={estilos.label}>Senha</Text>
        <TextInput style={estilos.input} value={senha} onChangeText={setSenha} secureTextEntry />

        <TouchableOpacity style={estilos.botao} onPress={entrar} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoBotao}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#f4f4f6", justifyContent: "center", padding: 20 },
  cartao: { backgroundColor: "#fff", borderRadius: 12, padding: 24, borderWidth: 0.5, borderColor: "#e5e5e5" },
  logo: { fontSize: 22, fontWeight: "600", color: "#4a35d4", marginBottom: 4 },
  subtitulo: { fontSize: 13, color: "#888", marginBottom: 20 },
  erro: { fontSize: 12, color: "#a33", marginBottom: 12 },
  label: { fontSize: 12, color: "#666", marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 0.5, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14 },
  botao: { backgroundColor: "#4a35d4", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 24 },
  textoBotao: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      const resposta = await api.post("/login", { email, senha, tipo: "publicador" });
      localStorage.setItem("token", resposta.data.token);
      localStorage.setItem("usuario", JSON.stringify(resposta.data.usuario));
      navigate("/painel");
    } catch {
      setErro("* Email ou senha inválidos");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 32, borderRadius: 12, border: "0.5px solid var(--cor-borda)", width: 320 }}>
        <div style={{ fontSize: 25, fontWeight: 700, color: "var(--cor-primaria)", marginBottom: 24, textAlign: "center", fontFamily: "serif" }}>
          PECAC<br></br>Painel do Publicador
        </div>
        {erro && <div style={{ fontSize: 15, color: "#a33", marginBottom: 12 }}>{erro}</div>}
        <label style={{ fontSize: 15, color: "#666" }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: 15, color: "#666", marginTop: 12, display: "block" }}>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />
        <button type="submit" style={btnStyle}>ENTRAR</button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ddd",
  fontSize: 15, marginTop: 5, marginBottom: 5,
};

const btnStyle: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: 10, borderRadius: 8, border: "none",
  background: "var(--cor-primaria)", color: "#fff", fontWeight: 500, fontSize: 20,
};
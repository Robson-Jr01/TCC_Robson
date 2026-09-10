import { useEffect, useState } from "react";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

type Edital = { id: number; titulo: string };
type Inscricao = {
  id: number;
  status: string;
  inscrito_em: string;
  artistas: { id: number; nome: string; curriculo: string | null; portfolio_url: string | null };
};

export default function Inscricoes() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [editalId, setEditalId] = useState("");
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    api.get(`/publicadores/${usuario.id}/editais`).then((res) => setEditais(res.data));
  }, []);

  useEffect(() => {
    if (!editalId) { setInscricoes([]); return; }
    carregarInscricoes();
  }, [editalId]);

  function carregarInscricoes() {
    setCarregando(true);
    api.get(`/editais/${editalId}/inscricoes`).then((res) => {
      setInscricoes(res.data);
      setCarregando(false);
    });
  }

  async function atualizarStatus(id: number, status: string) {
    await api.patch(`/inscricoes/${id}/status`, { status });
    carregarInscricoes();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar paginaAtiva="inscricoes" />
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Inscrições</div>

        <select value={editalId} onChange={(e) => setEditalId(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, marginBottom: 16, width: 320 }}>
          <option value="">Escolha um edital...</option>
          {editais.map((e) => <option key={e.id} value={e.id}>{e.titulo}</option>)}
        </select>

        {carregando && <div>Carregando...</div>}

        {!carregando && editalId && inscricoes.length === 0 && (
          <div style={{ fontSize: 13, color: "#888" }}>Nenhuma inscrição para este edital ainda.</div>
        )}

        {inscricoes.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid var(--cor-borda)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <Th>Artista</Th><Th>Currículo</Th><Th>Portfólio</Th><Th>Inscrito em</Th><Th>Status</Th><Th>Ação</Th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((inscricao) => (
                  <tr key={inscricao.id}>
                    <Td>{inscricao.artistas.nome}</Td>
                    <Td>{inscricao.artistas.curriculo || "—"}</Td>
                    <Td>
                      {inscricao.artistas.portfolio_url ? (
                        <a href={inscricao.artistas.portfolio_url} target="_blank" rel="noreferrer" style={{ color: "var(--cor-primaria)" }}>Ver</a>
                      ) : "—"}
                    </Td>
                    <Td>{new Date(inscricao.inscrito_em).toLocaleDateString("pt-BR")}</Td>
                    <Td><StatusBadge status={inscricao.status} /></Td>
                    <Td>
                      {inscricao.status === "pendente" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => atualizarStatus(inscricao.id, "selecionado")} style={btnSelecionar}>Selecionar</button>
                          <button onClick={() => atualizarStatus(inscricao.id, "nao_selecionado")} style={btnRejeitar}>Rejeitar</button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ fontSize: 10, fontWeight: 500, color: "#999", textTransform: "uppercase", padding: "8px 14px", textAlign: "left" }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ fontSize: 12, padding: "9px 14px", borderTop: "0.5px solid #f0f0f0" }}>{children}</td>;
}
function StatusBadge({ status }: { status: string }) {
  const cores: Record<string, [string, string]> = {
    pendente: ["var(--cor-alerta-bg)", "var(--cor-alerta-texto)"],
    selecionado: ["var(--cor-sucesso-bg)", "var(--cor-sucesso-texto)"],
    nao_selecionado: ["#f1efe8", "#5f5e5a"],
  };
  const [bg, texto] = cores[status] || cores.pendente;
  return <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, background: bg, color: texto }}>{status}</span>;
}

const btnSelecionar: React.CSSProperties = {
  fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: "var(--cor-sucesso-texto)", color: "#fff",
};
const btnRejeitar: React.CSSProperties = {
  fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#a33",
};
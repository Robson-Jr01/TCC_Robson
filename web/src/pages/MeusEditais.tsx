import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

type Edital = {
  id: number;
  titulo: string;
  status: string;
  prazo_inscricao: string;
  vagas: number | null;
  categorias: { nome: string };
  _count: { inscricoes: number };
};

export default function MeusEditais() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    carregarEditais();
  }, []);

  function carregarEditais() {
    api.get(`/publicadores/${usuario.id}/editais`).then((res) => {
      setEditais(res.data);
      setCarregando(false);
    });
  }

  async function encerrarEdital(id: number) {
    if (!confirm("Tem certeza que deseja encerrar este edital? Essa ação não pode ser desfeita.")) return;
    await api.patch(`/editais/${id}/status`, { status: "encerrado" });
    carregarEditais();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar paginaAtiva="meus-editais" />
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Meus editais</div>

        {carregando ? (
          <div>Carregando...</div>
        ) : editais.length === 0 ? (
          <div style={{ fontSize: 13, color: "#888" }}>Você ainda não publicou nenhum edital.</div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid var(--cor-borda)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <Th>Edital</Th><Th>Categoria</Th><Th>Prazo</Th><Th>Vagas</Th><Th>Inscrições</Th><Th>Status</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {editais.map((edital) => (
                  <tr key={edital.id}>
                    <Td>
                      <span onClick={() => navigate(`/editais/${edital.id}`)} style={{ color: "var(--cor-primaria)", cursor: "pointer" }}>
                        {edital.titulo}
                      </span>
                    </Td>
                    <Td>{edital.categorias.nome}</Td>
                    <Td>{new Date(edital.prazo_inscricao).toLocaleDateString("pt-BR")}</Td>
                    <Td>{edital.vagas ?? "Sem limite"}</Td>
                    <Td><b>{edital._count.inscricoes}</b></Td>
                    <Td><StatusBadge status={edital.status} /></Td>
                    <Td>
                      {edital.status !== "encerrado" && (
                        <button onClick={() => encerrarEdital(edital.id)} style={btnEncerrar}>
                          Encerrar
                        </button>
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
    aberto: ["var(--cor-sucesso-bg)", "var(--cor-sucesso-texto)"],
    em_analise: ["var(--cor-alerta-bg)", "var(--cor-alerta-texto)"],
    encerrado: ["#f1efe8", "#5f5e5a"],
  };
  const [bg, texto] = cores[status] || cores.encerrado;
  return <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 500, background: bg, color: texto }}>{status}</span>;
}

const btnEncerrar: React.CSSProperties = {
  fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd",
  background: "#fff", color: "#a33",
};
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

type Edital = {
  id: number;
  titulo: string;
  status: string;
  prazo_inscricao: string;
  categorias: { nome: string };
  _count: { inscricoes: number };
};

export default function Dashboard() {
  const [editais, setEditais] = useState<Edital[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    api.get(`/publicadores/${usuario.id}/editais`).then((res) => {
      setEditais(res.data);
      setCarregando(false);
    });
  }, [usuario.id]);

  const editaisAtivos = editais.filter((e) => e.status === "aberto").length;
  const totalInscricoes = editais.reduce((soma, e) => soma + e._count.inscricoes, 0);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sidebar paginaAtiva="painel" />

      {/* CONTEÚDO */}
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Painel do publicador</div>
        <div style={{ fontSize: 12, color: "var(--cor-texto-secundario)", marginBottom: 16 }}>
          {usuario.nome}
        </div>

        {carregando ? (
          <div>Carregando...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
              <StatCard valor={editaisAtivos} label="Editais ativos" />
              <StatCard valor={totalInscricoes} label="Inscrições recebidas" />
              <StatCard valor={editais.length} label="Total de editais" />
            </div>

            <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid var(--cor-borda)", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "0.5px solid #eee", fontSize: 13, fontWeight: 500 }}>
                Editais recentes
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    <Th>Edital</Th><Th>Categoria</Th><Th>Prazo</Th><Th>Inscrições</Th><Th>Status</Th>
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
                      <Td><b>{edital._count.inscricoes}</b> candidatos</Td>
                      <Td><StatusBadge status={edital.status} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ valor, label }: { valor: number; label: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid var(--cor-borda)", padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 500 }}>{valor}</div>
      <div style={{ fontSize: 11, color: "var(--cor-texto-secundario)", marginTop: 2 }}>{label}</div>
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
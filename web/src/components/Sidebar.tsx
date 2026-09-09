import { useNavigate } from "react-router-dom";

export default function Sidebar({ paginaAtiva }: { paginaAtiva: string }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div style={{ width: 200, background: "#fff", borderRight: "0.5px solid var(--cor-borda)", padding: "16px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 16px 16px", fontSize: 14, fontWeight: 500, color: "var(--cor-primaria)", borderBottom: "0.5px solid #eee", marginBottom: 8 }}>
        PECAC
      </div>
      <MenuItem label="Painel" ativo={paginaAtiva === "painel"} aoClicar={() => navigate("/painel")} />
      <MenuItem label="Publicar edital" ativo={paginaAtiva === "publicar-edital"} aoClicar={() => navigate("/publicar-edital")} />
      <MenuItem label="Meus editais" ativo={paginaAtiva === "meus-editais"} />
      <MenuItem label="Inscrições" ativo={paginaAtiva === "inscricoes"} />
      <div style={{ marginTop: "auto", padding: "8px 16px" }}>
        <button onClick={handleLogout} style={{ fontSize: 12, color: "#999", background: "none", border: "none" }}>
          Sair
        </button>
      </div>
    </div>
  );
}

function MenuItem({ label, ativo, aoClicar }: { label: string; ativo?: boolean; aoClicar?: () => void }) {
  return (
    <div
      onClick={aoClicar}
      style={{
        padding: "8px 16px", fontSize: 13, cursor: "pointer",
        color: ativo ? "var(--cor-primaria)" : "#666",
        background: ativo ? "#f5f3ff" : "transparent",
        borderLeft: ativo ? "3px solid var(--cor-primaria)" : "3px solid transparent",
        fontWeight: ativo ? 500 : 400,
      }}
    >
      {label}
    </div>
  );
}
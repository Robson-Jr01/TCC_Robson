import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

type Especialidade = { id: number; nome: string };
type Categoria = { id: number; nome: string; especialidades: Especialidade[] };
type Cidade = { id: number; nome: string };
type Edital = {
  titulo: string;
  descricao: string | null;
  prazo_inscricao: string;
  vagas: number | null;
  exige_documentos: boolean;
  instrucoes_documentos: string | null;
};

export default function EditalDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [cidadeIds, setCidadeIds] = useState<number[]>([]);
  const [temLimiteVagas, setTemLimiteVagas] = useState(false);
  const [exigeDocumentos, setExigeDocumentos] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [edital, setEdital] = useState<Edital | null>(null);

  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data));
    api.get("/cidades").then((res) => setCidades(res.data));
    api.get(`/editais/${id}`).then((res) => {
      const dados = res.data;
      setCategoriaId(String(dados.categoria_id));
      setEspecialidadeId(dados.especialidade_id ? String(dados.especialidade_id) : "");
      setCidadeIds(dados.edital_cidades.map((ec: { cidade_id: number }) => ec.cidade_id));
      setTemLimiteVagas(dados.vagas !== null);
      setExigeDocumentos(dados.exige_documentos);
      setEdital(dados);
      setCarregando(false);
    });
  }, [id]);

  const categoriaEscolhida = categorias.find((c) => c.id === Number(categoriaId));

  function toggleCidade(cidadeId: number) {
    setCidadeIds((prev) =>
      prev.includes(cidadeId) ? prev.filter((c) => c !== cidadeId) : [...prev, cidadeId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");
    const form = new FormData(e.currentTarget);

    try {
      await api.put(`/editais/${id}`, {
        titulo: form.get("titulo"),
        categoria_id: Number(categoriaId),
        especialidade_id: especialidadeId ? Number(especialidadeId) : null,
        cidade_ids: cidadeIds,
        descricao: form.get("descricao"),
        premio: form.get("premio")
          ? `R$ ${Number(form.get("premio")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : null,
        prazo_inscricao: form.get("prazo_inscricao"),
        exige_documentos: exigeDocumentos,
        instrucoes_documentos: exigeDocumentos ? form.get("instrucoes_documentos") : null,
        vagas: temLimiteVagas ? Number(form.get("vagas")) : null,
      });
      setMensagem("Alterações salvas com sucesso!");
      setTimeout(() => navigate("/meus-editais"), 1000);
    } catch {
      setMensagem("Não foi possível salvar as alterações");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar paginaAtiva="meus-editais" />
      <div style={{ flex: 1, padding: 20, maxWidth: 480 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Editar edital</div>

        {mensagem && <div style={{ fontSize: 13, marginBottom: 12, color: mensagem.includes("sucesso") ? "#085041" : "#a33" }}>{mensagem}</div>}

        {carregando ? (
          <div>Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 20, borderRadius: 10, border: "0.5px solid var(--cor-borda)" }}>
            <Campo label="Título">
              <input name="titulo" required defaultValue={edital?.titulo} style={inputStyle} />
            </Campo>

            <Campo label="Categoria">
              <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setEspecialidadeId(""); }} required style={inputStyle}>
                <option value="">Selecione...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>

            {categoriaEscolhida && categoriaEscolhida.especialidades.length > 0 && (
              <Campo label="Especialidade (opcional)">
                <select value={especialidadeId} onChange={(e) => setEspecialidadeId(e.target.value)} style={inputStyle}>
                  <option value="">Qualquer uma dentro da categoria</option>
                  {categoriaEscolhida.especialidades.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </Campo>
            )}

            <Campo label="Cidades onde o edital vale">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cidades.map((c) => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <input type="checkbox" checked={cidadeIds.includes(c.id)} onChange={() => toggleCidade(c.id)} />
                    {c.nome}
                  </label>
                ))}
              </div>
            </Campo>

            <Campo label="Descrição">
              <textarea name="descricao" rows={3} defaultValue={edital?.descricao ?? ""} style={inputStyle} />
            </Campo>

            <Campo label="Prêmio (opcional)">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#666" }}>R$</span>
                <input name="premio" type="number" min={0} step="any" style={inputStyle} />
              </div>
            </Campo>

            <Campo label="Prazo de inscrição">
              <input name="prazo_inscricao" type="date" required defaultValue={edital?.prazo_inscricao.slice(0, 10)} style={inputStyle} />
            </Campo>

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 12 }}>
              <input type="checkbox" checked={temLimiteVagas} onChange={(e) => setTemLimiteVagas(e.target.checked)} />
              Este edital tem limite de inscrições?
            </label>

            {temLimiteVagas && (
              <Campo label="Número de vagas">
                <input name="vagas" type="number" min={1} defaultValue={edital?.vagas ?? undefined} style={inputStyle} />
              </Campo>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 8 }}>
              <input type="checkbox" checked={exigeDocumentos} onChange={(e) => setExigeDocumentos(e.target.checked)} />
              Exige documentos complementares na inscrição
            </label>

            {exigeDocumentos && (
              <Campo label="Quais documentos são necessários?">
                <textarea name="instrucoes_documentos" rows={2} defaultValue={edital?.instrucoes_documentos ?? ""} style={inputStyle} />
              </Campo>
            )}

            <button type="submit" style={btnStyle}>Salvar alterações</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13,
};
const btnStyle: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: 10, borderRadius: 8, border: "none",
  background: "var(--cor-primaria)", color: "#fff", fontWeight: 500, fontSize: 14,
};
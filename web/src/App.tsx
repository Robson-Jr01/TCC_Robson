import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicarEdital from "./pages/PublicarEdital";
import MeusEditais from "./pages/MeusEditais";
import Inscricoes from "./pages/Inscricoes";
import EditalDetalhes from "./pages/EditalDetalhes";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/painel" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/publicar-edital" element={<PublicarEdital />} />
      <Route path="/meus-editais" element={<MeusEditais />} />
      <Route path="/inscricoes" element={<Inscricoes />} />
      <Route path="/editais/:id" element={<EditalDetalhes />} />
    </Routes>
  );
}

export default App;
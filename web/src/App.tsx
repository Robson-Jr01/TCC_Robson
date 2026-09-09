import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicarEdital from "./pages/PublicarEdital";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/painel" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/publicar-edital" element={<PublicarEdital />} />
    </Routes>
  );
}

export default App;
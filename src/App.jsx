import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminPage from "./content/AdminPage";
import TeamPage from "./content/TeamPage";
import ScreenPage from "./content/ScreenPage";
import SummaryPage from "./content/SummaryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeamPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/screen" element={<ScreenPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

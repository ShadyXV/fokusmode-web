import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import FocusPage from "@/pages/FocusPage";
import CalendarPage from "@/pages/CalendarPage";
import TagsPage from "@/pages/TagsPage";
import StatsPage from "@/pages/StatsPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<FocusPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

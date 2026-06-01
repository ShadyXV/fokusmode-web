import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import AppLayout from "@/components/layout/AppLayout";
import FocusPage from "@/pages/FocusPage";
import CalendarPage from "@/pages/CalendarPage";
import TagsPage from "@/pages/TagsPage";
import DistractionsPage from "@/pages/DistractionsPage";
import StatsPage from "@/pages/StatsPage";
import LoginPage from "@/pages/LoginPage";
import UserPage from "@/pages/UserPage";
import { TimerProvider } from "@/context/TimerContext";

function App() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading...
        </div>
      </AuthLoading>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
      <Authenticated>
        <TimerProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<FocusPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/distractions" element={<DistractionsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/user" element={<UserPage />} />
              <Route path="/settings" element={<Navigate to="/user" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </TimerProvider>
      </Authenticated>
    </>
  );
}

export default App;

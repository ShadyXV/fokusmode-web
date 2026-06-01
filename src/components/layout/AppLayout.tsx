import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Sidebar from "./Sidebar";
import { DebugMonitor } from "../debug/DebugMonitor";
import { useCalendarPreload } from "@/hooks/useCalendarPreload";

export default function AppLayout() {
  const initialize = useMutation(api.seed.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Pre-warm the Convex data cache for calendar and tags
  useCalendarPreload();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <DebugMonitor />
    </div>
  );
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimerProvider } from "@/context/TimerContext";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "https://mock-url.convex.cloud");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <TooltipProvider>
        <BrowserRouter>
          <TimerProvider>
            <App />
            <Toaster position="top-center" richColors />
          </TimerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ConvexProvider>
  </React.StrictMode>
);

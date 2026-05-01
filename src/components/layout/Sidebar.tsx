import { NavLink, useLocation } from "react-router-dom";
import { Timer, Calendar, Tag, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Timer, label: "Focus", href: "/" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Tag, label: "Tags", href: "/tags" },
  { icon: BarChart3, label: "Stats", href: "/stats" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-xl flex-col h-screen sticky top-0 hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              FokusMode
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-violet-500/15 to-indigo-500/10 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-full" />
                )}
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] transition-colors",
                    isActive ? "text-violet-400" : ""
                  )}
                />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-accent/60 to-accent/20 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500/30 to-indigo-500/20 border border-white/10 flex items-center justify-center">
              <span className="text-xs font-bold">FM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">FokusMode</span>
              <span className="text-[10px] text-muted-foreground">v1.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/80 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                  isActive
                    ? "text-violet-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

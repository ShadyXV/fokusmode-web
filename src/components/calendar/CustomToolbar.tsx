import type { ToolbarProps } from "react-big-calendar";
import type { CalendarEvent } from "@/lib/calendarHelpers";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewType = "month" | "week" | "day";

export default function CustomToolbar({ label, onNavigate, onView, view }: ToolbarProps<CalendarEvent>) {
  const views: { key: ViewType; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onNavigate("PREV")}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg h-8"
          onClick={() => onNavigate("TODAY")}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onNavigate("NEXT")}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-2">{label}</h2>
      </div>

      <div className="flex items-center rounded-lg border overflow-hidden">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onView(v.key)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

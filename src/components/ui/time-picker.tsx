import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({ value, onChange, placeholder = "--:--", className = "" }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  // Generate minutes 00-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

  const handleHourSelect = (hour: string) => {
    const min = selectedMinute || "00";
    onChange(`${hour}:${min}`);
  };

  const handleMinuteSelect = (min: string) => {
    const hr = selectedHour || "12";
    onChange(`${hr}:${min}`);
  };

  const selectedHourRef = React.useRef<HTMLButtonElement>(null);
  const selectedMinuteRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (selectedHourRef.current) {
          selectedHourRef.current.scrollIntoView({ block: "center" });
        }
        if (selectedMinuteRef.current) {
          selectedMinuteRef.current.scrollIntoView({ block: "center" });
        }
      }, 50); // slight delay to ensure Radix Popover has mounted content
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-8 w-[65px] items-center justify-center rounded-md bg-transparent text-sm font-medium outline-none hover:bg-white/5 focus:ring-2 focus:ring-amber-500/50 transition-colors ${!value ? "text-muted-foreground" : "text-foreground"} ${className}`}
        >
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-0 glass-dark border-white/10 rounded-xl overflow-hidden" align="center">
        <div className="flex h-[220px] divide-x divide-white/5">
          <ScrollArea className="w-1/2">
            <div className="flex flex-col p-1.5 space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase text-center py-1 sticky top-0 bg-card/80 backdrop-blur-md z-10 rounded-sm mb-1">
                Hour
              </span>
              {hours.map((hour) => {
                const isSelected = selectedHour === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    ref={isSelected ? selectedHourRef : null}
                    onClick={() => handleHourSelect(hour)}
                    className={`flex items-center justify-center py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-white font-medium shadow-sm shadow-amber-500/20"
                        : "hover:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <ScrollArea className="w-1/2">
            <div className="flex flex-col p-1.5 space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase text-center py-1 sticky top-0 bg-card/80 backdrop-blur-md z-10 rounded-sm mb-1">
                Min
              </span>
              {minutes.map((min) => {
                const isSelected = selectedMinute === min;
                return (
                  <button
                    key={min}
                    type="button"
                    ref={isSelected ? selectedMinuteRef : null}
                    onClick={() => handleMinuteSelect(min)}
                    className={`flex items-center justify-center py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-white font-medium shadow-sm shadow-amber-500/20"
                        : "hover:bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {min}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

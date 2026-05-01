import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#64748b", "#78716c", "#94a3b8",
];

interface TagFormDialogProps {
  mode: "create" | "edit";
  initialName?: string;
  initialColor?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (name: string, color: string) => void;
  trigger?: React.ReactNode;
}

export default function TagFormDialog({
  mode,
  initialName = "",
  initialColor = "#6366f1",
  open,
  onOpenChange,
  onSubmit,
  trigger,
}: TagFormDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), color);
    if (mode === "create") {
      setName("");
      setColor("#6366f1");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md glass-dark">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Tag" : "Edit Tag"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              placeholder="e.g. Deep Work"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all duration-150 hover:scale-110 ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 text-sm">
              <span className="font-medium">{name || "Preview"}</span>
              <span className="block text-muted-foreground text-xs">{color}</span>
            </div>
            <Button type="submit" disabled={!name.trim()}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

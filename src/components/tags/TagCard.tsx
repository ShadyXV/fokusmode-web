import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Shield } from "lucide-react";

interface TagCardProps {
  name: string;
  color: string;
  isDefault?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TagCard({ name, color, isDefault, onEdit, onDelete }: TagCardProps) {
  return (
    <Card className="group relative overflow-hidden glass-dark hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-inner"
            style={{ backgroundColor: color }}
          >
            <span className="text-white text-sm font-bold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{name}</h3>
            <p className="text-xs text-muted-foreground">{color}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isDefault && (
              <Shield className="w-4 h-4 text-muted-foreground mr-1" />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!isDefault && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

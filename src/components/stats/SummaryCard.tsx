import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "hsl(var(--primary))",
}: SummaryCardProps) {
  return (
    <Card className="glass-dark hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

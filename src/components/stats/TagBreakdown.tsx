import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/calendarHelpers";

interface TagBreakdownData {
  name: string;
  color: string;
  duration: number;
}

interface TagBreakdownProps {
  data: TagBreakdownData[];
}

export default function TagBreakdown({ data }: TagBreakdownProps) {
  const total = data.reduce((acc, d) => acc + d.duration, 0);

  return (
    <Card className="glass-dark">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Time by Tag</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="duration"
                >
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatDuration(Number(value) || 0), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate">{d.name}</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatDuration(d.duration)}
                  {total > 0 && ` (${Math.round((d.duration / total) * 100)}%)`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

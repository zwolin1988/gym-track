import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart } from "lucide-react";
import type { VolumeChartProps } from "./types";

interface TooltipPayload {
  payload: {
    date: string;
    plan_name: string;
    total_volume: number;
    total_sets: number;
    duration_minutes: number;
  };
}

/**
 * Custom Tooltip dla wykresu
 */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3">
      <p className="font-semibold text-foreground mb-1">
        {new Date(data.date).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "long",
        })}
      </p>
      <p className="text-sm text-muted-foreground mb-1">{data.plan_name}</p>
      <p className="text-lg font-bold text-blue-500">{data.total_volume.toLocaleString("pl-PL")} kg</p>
      <p className="text-sm text-muted-foreground">
        {data.total_sets} serii • {data.duration_minutes} min
      </p>
    </div>
  );
}

/**
 * Interaktywny wykres liniowy pokazujący objętość treningową w czasie.
 * Używa biblioteki Recharts. Wyświetla dane z ostatnich 4 tygodni (domyślnie).
 */
export function VolumeChart({ data, period = "4w" }: VolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted rounded-lg">
        <BarChart className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Brak danych do wykresu</h3>
        <p className="text-muted-foreground max-w-md">
          Wykonaj trening, aby zobaczyć wykres postępów objętości treningowej
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Objętość treningowa - ostatnie {period === "4w" ? "4 tygodnie" : period}
      </h3>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />

            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("pl-PL", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />

            <YAxis
              label={{
                value: "Objętość (kg)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: "14px", fill: "#6b7280" },
              }}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="total_volume"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

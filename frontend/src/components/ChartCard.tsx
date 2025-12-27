import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

type DataRow = Record<string, any>;

export type ChartType = "line" | "bar" | "pie" | "area";

interface ChartCardProps {
  data: DataRow[];
  chartType?: ChartType;
  title: string;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export function ChartCard({ data, chartType = "bar", title }: ChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        No data available for chart
      </div>
    );
  }

  // Auto-detect x-axis and y-axis keys from data
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  
  // Assume first key is x-axis (labels), remaining are y-axis (values)
  const xAxisKey = keys[0];
  const yAxisKeys = keys.slice(1).filter(key => {
    // Only include numeric keys for charts
    const val = firstRow[key];
    return typeof val === 'number' || !isNaN(Number(val));
  });

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {yAxisKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {yAxisKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        // For pie chart, use first numeric key as value
        const valueKey = yAxisKeys[0] || keys[1];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry[xAxisKey]}: ${entry[valueKey]}`}
                style={{ fontSize: 11 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 12
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {yAxisKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unknown chart type</div>;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 250 }}>
      {renderChart()}
    </div>
  );
}

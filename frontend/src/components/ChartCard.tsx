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
  fontSize?: string;
  fontFamily?: string;
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#a855f7", // Violet
  "#f43f5e", // Rose
];

export function ChartCard({ data, chartType = "bar", title, fontSize, fontFamily }: ChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        No data available for chart
      </div>
    );
  }

  // Map font family settings to CSS values
  const getFontFamily = (family?: string) => {
    const familyMap: Record<string, string> = {
      default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      arial: "Arial, sans-serif",
      roboto: "'Roboto', sans-serif",
      helvetica: "Helvetica, Arial, sans-serif",
      times: "'Times New Roman', Times, serif",
      georgia: "Georgia, serif",
      courier: "'Courier New', Courier, monospace",
      monospace: "monospace",
    };
    return familyMap[family || "default"] || familyMap.default;
  };

  // Map font size settings to CSS values for chart labels
  const getLabelFontSize = (size?: string) => {
    const sizeMap: Record<string, number> = {
      small: 10,
      medium: 12,
      large: 14,
      "x-large": 16,
    };
    return sizeMap[size || "medium"] || 12;
  };

  const containerFontFamily = getFontFamily(fontFamily);
  const labelFontSize = getLabelFontSize(fontSize);

  // Normalize data - convert string numbers to actual numbers
  const normalizedData = data.map(row => {
    const normalized: DataRow = {};
    Object.keys(row).forEach(key => {
      const val = row[key];
      // Try to convert string numbers to actual numbers
      if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
        normalized[key] = Number(val);
      } else {
        normalized[key] = val;
      }
    });
    return normalized;
  });

  // Auto-detect x-axis and y-axis keys from data
  const firstRow = normalizedData[0];
  const keys = Object.keys(firstRow);
  
  console.log('ChartCard - Chart Type:', chartType);
  console.log('ChartCard - First Row:', firstRow);
  console.log('ChartCard - Keys:', keys);
  
  // Assume first key is x-axis (labels), remaining are y-axis (values)
  const xAxisKey = keys[0];
  const yAxisKeys = keys.slice(1).filter(key => {
    // Only include numeric keys for charts
    const val = firstRow[key];
    return typeof val === 'number';
  });
  
  console.log('ChartCard - xAxisKey:', xAxisKey);
  console.log('ChartCard - yAxisKeys:', yAxisKeys);
  console.log('ChartCard - Normalized Data:', normalizedData);

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <YAxis stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: labelFontSize
                }} 
              />
              <Legend wrapperStyle={{ fontSize: labelFontSize }} />
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
            <BarChart data={normalizedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <YAxis stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: labelFontSize
                }} 
              />
              <Legend wrapperStyle={{ fontSize: labelFontSize }} />
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
        console.log('Pie Chart - valueKey:', valueKey);
        console.log('Pie Chart - data sample:', normalizedData.slice(0, 2));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalizedData}
                dataKey={valueKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius="65%"
                innerRadius="0%"
                label={(entry) => `${entry[xAxisKey]}: ${entry[valueKey]}`}
                style={{ fontSize: labelFontSize }}
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
                  fontSize: labelFontSize
                }} 
              />
              <Legend wrapperStyle={{ fontSize: labelFontSize }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={normalizedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xAxisKey} stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <YAxis stroke="#6b7280" style={{ fontSize: labelFontSize }} />
              <Tooltip 
                contentStyle={{ 
                  background: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: labelFontSize
                }} 
              />
              <Legend wrapperStyle={{ fontSize: labelFontSize }} />
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
    <div style={{ width: "100%", height: "100%", minHeight: 250, fontFamily: containerFontFamily }}>
      {renderChart()}
    </div>
  );
}

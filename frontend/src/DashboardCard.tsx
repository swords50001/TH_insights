import { useEffect, useState } from "react";
import { api } from "./api";
import { DashboardCard as TotalCard } from "./components/DashboardCard";
import { EnhancedTable } from "./components/EnhancedTable";
import { ChartCard, ChartType } from "./components/ChartCard";

// Type definition for the card prop
interface Card {
  id: string;
  title: string;
  visualization_type: "metric" | "table" | "chart";
  chart_type?: ChartType;
  drilldown_enabled?: boolean;
  drilldown_query?: string;
  hide_title?: boolean;
  font_size?: string;
  font_family?: string;
}

// Type definition for data rows
type DataRow = Record<string, any>;

interface DashboardCardProps {
  card: Card;
}

export function DashboardCard({ card }: DashboardCardProps) {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  console.log('DashboardCard rendering for:', card);
  console.log('Card drill-down props:', { 
    drilldown_enabled: card.drilldown_enabled, 
    drilldown_query: card.drilldown_query 
  });

  useEffect(() => {
    console.log('DashboardCard useEffect triggered for card:', card.id);
    const fetchData = async () => {
      setLoading(true);
      setError(undefined);
      try {
        console.log('Fetching data for card:', card.id, card.visualization_type);
        // Use POST /dashboard/cards/:id/data endpoint for both metrics and tables
        const res = await api.post(`/dashboard/cards/${card.id}/data`);
        const rows = res.data || [];
        
        console.log('Received data for card', card.id, ':', rows);
        
        if (card.visualization_type === "metric") {
          // For metrics, expect a single row with a 'total' or numeric field
          const firstRow = rows[0] || {};
          const value = firstRow.total ?? Object.values(firstRow)[0] ?? 0;
          setData([{ value }]);
        } else {
          // For tables, use the raw rows
          setData(rows);
        }
      } catch (e: any) {
        console.error('Failed to fetch card data:', e);
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [card]);

  if (card.visualization_type === "metric") {
    const value = (data[0]?.value ?? null) as number | null;
    return (
      <TotalCard 
        title={card.hide_title ? "" : card.title} 
        value={value} 
        loading={loading} 
        error={error}
        fontSize={card.font_size}
        fontFamily={card.font_family}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#dc2626" }}>
        Error: {error}
      </div>
    );
  }

  if (card.visualization_type === "chart") {
    return (
      <ChartCard 
        data={data} 
        chartType={card.chart_type} 
        title={card.hide_title ? "" : card.title}
        fontSize={card.font_size}
        fontFamily={card.font_family}
      />
    );
  }

  return (
    <EnhancedTable 
      data={data} 
      title={card.hide_title ? "" : card.title}
      cardId={card.id}
      drilldownEnabled={card.drilldown_enabled}
      drilldownQuery={card.drilldown_query}
      fontSize={card.font_size}
      fontFamily={card.font_family}
    />
  );
}

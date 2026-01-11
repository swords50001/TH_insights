import { useEffect, useState } from "react";
import { api } from "./api";
import { DashboardCard as TotalCard } from "./components/DashboardCard";
import { EnhancedTable } from "./components/EnhancedTable";
import { ChartCard, ChartType } from "./components/ChartCard";
import { PivotTable } from "./components/PivotTable";

// Type definition for conditional formatting rules
export type ConditionalFormattingRule = {
  column: string;
  operator: "greater" | "less" | "equals" | "between";
  value: number | number[];
  bgColor: string;
  textColor: string;
};

// Type definition for pivot config
export type PivotConfig = {
  rowFields: string[];
  columnFields: string[];
  valueField: string;
  aggregation: "sum" | "avg" | "count" | "min" | "max";
};

// Type definition for the card prop
interface Card {
  id: string;
  title: string;
  visualization_type: "metric" | "table" | "chart" | "pivot";
  chart_type?: ChartType;
  drilldown_enabled?: boolean;
  drilldown_query?: string;
  hide_title?: boolean;
  font_size?: string;
  font_family?: string;
  conditional_formatting?: ConditionalFormattingRule[];
  pivot_enabled?: boolean;
  pivot_config?: PivotConfig;
}

// Type definition for data rows
type DataRow = Record<string, any>;

interface DashboardCardProps {
  card: Card;
  filters?: Record<string, any>;
}

export function DashboardCard({ card, filters = {} }: DashboardCardProps) {
  const [data, setData] = useState<DataRow[]>([]);
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  console.log('DashboardCard rendering for:', card.id, card.title);
  console.log('Card visualization_type:', card.visualization_type);
  console.log('Card pivot_enabled:', card.pivot_enabled);
  console.log('Card pivot_config:', card.pivot_config);
  console.log('Card conditional_formatting:', card.conditional_formatting);
  console.log('Will render as pivot?', card.pivot_enabled || card.visualization_type === "pivot");

  useEffect(() => {
    console.log('DashboardCard useEffect triggered for card:', card.id);
    const fetchData = async () => {
      setLoading(true);
      setError(undefined);
      try {
        console.log('Fetching data for card:', card.id, card.visualization_type);
        console.log('With filters:', filters);
        // Use POST /dashboard/cards/:id/data endpoint for both metrics and tables
        const res = await api.post(`/dashboard/cards/${card.id}/data`, {
          filters
        });
        
        console.log('Response for card', card.id, ':', res.data);
        console.log('Response type:', typeof res.data);
        console.log('Has data property?', 'data' in (res.data || {}));
        console.log('Has rawData property?', 'rawData' in (res.data || {}));
        
        // Check if response is pivot format with rawData
        if (res.data && typeof res.data === 'object' && 'data' in res.data && 'rawData' in res.data) {
          // Pivot table response
          console.log('Using PIVOT format - data rows:', res.data.data?.length, 'raw rows:', res.data.rawData?.length);
          setData(res.data.data || []);
          setRawData(res.data.rawData || []);
        } else {
          // Regular response
          console.log('Using REGULAR format - rows:', res.data?.length);
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
          setRawData([]);
        }
      } catch (e: any) {
        console.error('Failed to fetch card data:', e);
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [card, filters]);

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

  // If pivot is enabled OR visualization_type is "pivot", use PivotTable component
  if (card.pivot_enabled || card.visualization_type === "pivot") {
    return (
      <PivotTable
        data={data}
        rawData={rawData}
        pivotConfig={card.pivot_config}
        title={card.hide_title ? "" : card.title}
        fontSize={card.font_size}
        fontFamily={card.font_family}
        conditionalFormatting={card.conditional_formatting}
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
      conditionalFormatting={card.conditional_formatting}
    />
  );
}

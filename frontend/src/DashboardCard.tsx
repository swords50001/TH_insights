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
  trending_enabled?: boolean;
  trending_comparison_type?: "previous_period" | "target" | null;
  trending_comparison_field?: string;
  trending_target_value?: number;
  metric_drilldown_enabled?: boolean;
  metric_drilldown_query?: string;
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
  const [metricDrilldownData, setMetricDrilldownData] = useState<DataRow[] | null>(null);
  const [metricDrilldownLoading, setMetricDrilldownLoading] = useState(false);
  const [metricDrilldownError, setMetricDrilldownError] = useState<string | null>(null);

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
            setData([{ ...firstRow, value }]);
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
    const metricRow = data[0] || {};
    
    // Calculate trend direction based on trending configuration
    let trendDirection: "up" | "down" | "neutral" | undefined = undefined;
    
    if (card.trending_enabled && card.trending_comparison_type) {
      if (card.trending_comparison_type === "previous_period" && card.trending_comparison_field) {
        // Compare current value with previous period value
        const previousValue = metricRow[card.trending_comparison_field];
        if (previousValue !== undefined && previousValue !== null && value !== null) {
          if (value > previousValue) {
            trendDirection = "up";
          } else if (value < previousValue) {
            trendDirection = "down";
          } else {
            trendDirection = "neutral";
          }
        }
      } else if (card.trending_comparison_type === "target" && card.trending_target_value !== undefined) {
        // Compare current value with target value
        if (value !== null) {
          if (value > card.trending_target_value) {
            trendDirection = "up";
          } else if (value < card.trending_target_value) {
            trendDirection = "down";
          } else {
            trendDirection = "neutral";
          }
        }
      }
    }
    
    // Handle metric drill-down
    const handleMetricDrill = async () => {
      if (!card.metric_drilldown_enabled || !card.metric_drilldown_query) return;
      
      try {
        setMetricDrilldownLoading(true);
        setMetricDrilldownError(null);

        let query = card.metric_drilldown_query;
        Object.keys(metricRow).forEach(key => {
          const placeholder = `{${key}}`;
          const prefixedPlaceholder = `{p.${key}}`;
          const fieldValue = metricRow[key];

          let replacementValue: string;
          if (typeof fieldValue === "string") {
            replacementValue = `'${fieldValue.replace(/'/g, "''")}'`;
          } else if (fieldValue === null || fieldValue === undefined) {
            replacementValue = "NULL";
          } else {
            replacementValue = String(fieldValue);
          }

          const placeholderPattern = new RegExp(
            `(${placeholder.replace(/[{}]/g, "\\$&")}|${prefixedPlaceholder.replace(/[{}]/g, "\\$&")})`,
            "g"
          );
          query = query.replace(placeholderPattern, replacementValue);
        });

        const res = await api.post("/dashboard/cards/preview/data", {
          sql_query: query,
        });
        setMetricDrilldownData(res.data);
      } catch (e: any) {
        setMetricDrilldownError(e.response?.data?.error || e.message || "Failed to load drill-down data");
      } finally {
        setMetricDrilldownLoading(false);
      }
    };
    
    return (
      <>
        <TotalCard 
          title={card.hide_title ? "" : card.title} 
          value={value} 
          loading={loading} 
          error={error}
          fontSize={card.font_size}
          fontFamily={card.font_family}
          trendDirection={trendDirection}
          isDrillable={card.metric_drilldown_enabled}
          onDrill={card.metric_drilldown_enabled ? handleMetricDrill : undefined}
        />
        {metricDrilldownData && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 24,
          }} onClick={() => setMetricDrilldownData(null)}>
            <div style={{
              background: "#fff",
              borderRadius: 8,
              width: "90%",
              maxWidth: 1000,
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Metric Details</h3>
                <button
                  onClick={() => setMetricDrilldownData(null)}
                  style={{
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
              <div style={{ overflow: "auto", padding: 16 }}>
                {metricDrilldownLoading && <div>Loading details...</div>}
                {metricDrilldownError && <div style={{ color: "#dc2626" }}>{metricDrilldownError}</div>}
                {!metricDrilldownLoading && !metricDrilldownError && metricDrilldownData.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {Object.keys(metricDrilldownData[0]).map((key) => (
                          <th key={key} style={{
                            textAlign: "left",
                            padding: "8px 10px",
                            borderBottom: "1px solid #e5e7eb",
                            fontSize: 12,
                            color: "#4b5563",
                          }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metricDrilldownData.map((row, index) => (
                        <tr key={index}>
                          {Object.keys(metricDrilldownData[0]).map((key) => (
                            <td key={key} style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid #f3f4f6",
                              fontSize: 13,
                            }}>
                              {String(row[key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!metricDrilldownLoading && !metricDrilldownError && metricDrilldownData.length === 0 && (
                  <div style={{ color: "#6b7280" }}>No detail rows found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
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

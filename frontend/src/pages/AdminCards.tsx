import { useEffect, useState } from "react";
import { api } from "../api";
import { EnhancedTable } from "../components/EnhancedTable";
import { ChartCard } from "../components/ChartCard";
import { PivotTable } from "../components/PivotTable";

// Helper function to transform data into pivot table format
function transformToPivot(
  data: any[],
  config: {
    rowFields: string[];
    columnFields: string[];
    valueField: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }
): any[] {
  if (!data.length) return [];

  const { rowFields, columnFields, valueField, aggregation } = config;
  const pivotMap = new Map<string, Map<string, number[]>>();

  data.forEach(row => {
    const rowKey = rowFields.map(f => row[f] || '').join('|||');
    const colKey = columnFields.map(f => row[f] || '').join('|||');
    const value = parseFloat(row[valueField]) || 0;

    if (!pivotMap.has(rowKey)) {
      pivotMap.set(rowKey, new Map());
    }

    const colMap = pivotMap.get(rowKey)!;
    if (!colMap.has(colKey)) {
      colMap.set(colKey, []);
    }

    colMap.get(colKey)!.push(value);
  });

  const allColumns = new Set<string>();
  pivotMap.forEach(colMap => {
    colMap.forEach((_, colKey) => allColumns.add(colKey));
  });

  const aggregate = (values: number[]): number => {
    if (!values.length) return 0;
    switch (aggregation) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count': return values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return 0;
    }
  };

  const result: any[] = [];

  pivotMap.forEach((colMap, rowKey) => {
    const rowParts = rowKey.split('|||');
    const resultRow: any = {};

    rowFields.forEach((field, i) => {
      resultRow[field] = rowParts[i];
    });

    allColumns.forEach(colKey => {
      const values = colMap.get(colKey) || [];
      const colParts = colKey.split('|||');
      const colLabel = columnFields.map((f, i) => `${f}:${colParts[i]}`).join(' ');
      resultRow[colLabel] = aggregate(values);
    });

    result.push(resultRow);
  });

  return result;
}

interface Card {
  id: string;
  title: string;
  description?: string;
  sql_query: string;
  visualization_type: "metric" | "table" | "chart" | "pivot";
  chart_type?: "line" | "bar" | "pie" | "area";
  drilldown_enabled?: boolean;
  drilldown_query?: string;
  hide_title?: boolean;
  font_size?: string;
  font_family?: string;
  section_name?: string;
  section_order?: number;
  group_name?: string;
  group_order?: number;
  header_bg_color?: string;
  header_text_color?: string;
  conditional_formatting?: ConditionalFormattingRule[];
  pivot_enabled?: boolean;
  pivot_config?: {
    rowFields: string[];
    columnFields: string[];
    valueField: string;
    aggregation: "sum" | "avg" | "count" | "min" | "max";
  };
  trending_enabled?: boolean;
  trending_comparison_type?: "previous_period" | "target" | null;
  trending_comparison_field?: string;
  trending_target_value?: number;
  metric_drilldown_enabled?: boolean;
  metric_drilldown_query?: string;
  is_active: boolean;
}

type ConditionalFormattingRule = {
  column: string;
  operator: "greater" | "less" | "equals" | "between";
  value: number | number[];
  bgColor: string;
  textColor: string;
};

export default function AdminCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [form, setForm] = useState<Partial<Card>>({
    title: "",
    description: "",
    sql_query: "",
    visualization_type: "metric",
    is_active: true,
  });
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [sortColumn, setSortColumn] = useState<"title" | "description" | "visualization_type" | "sql_query" | "is_active">("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortCards = (column: "title" | "description" | "visualization_type" | "sql_query" | "is_active") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    let comparison = 0;

    if (sortColumn === "is_active") {
      comparison = Number(a.is_active) - Number(b.is_active);
    } else {
      const aValue = String(a[sortColumn] || "").toLowerCase();
      const bValue = String(b[sortColumn] || "").toLowerCase();
      comparison = aValue.localeCompare(bValue);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const load = () => {
    api.get("/admin/cards").then(r => {
      setCards(r.data);
    });
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      sql_query: "",
      visualization_type: "metric",
      is_active: true,
      trending_enabled: false,
      trending_comparison_type: null,
      trending_comparison_field: "",
      trending_target_value: undefined,
      metric_drilldown_enabled: false,
      metric_drilldown_query: "",
    });
    setEditingCard(null);
    setPreviewData(null);
    setPreviewError(null);
  };

  const handlePreview = async () => {
    if (!form.sql_query) {
      setPreviewError("Please enter a SQL query first");
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewData(null);

    try {
      // Create a temporary card object for preview
      const tempCard = {
        id: "preview",
        title: form.title || "Preview",
        sql_query: form.sql_query,
        visualization_type: form.visualization_type || "metric",
      };

      // Use the same endpoint as the dashboard cards
      const response = await api.post("/dashboard/cards/preview/data", {
        sql_query: form.sql_query,
      });

      setPreviewData(response.data);
    } catch (err: any) {
      setPreviewError(err.response?.data?.error || err.message || "Failed to execute query");
    } finally {
      setIsPreviewing(false);
    }
  };

  const save = () => {
    // Ensure pivot_enabled is set to true when visualization_type is "pivot"
    // Clean up pivot config by removing empty strings from arrays
    const cleanedPivotConfig = form.pivot_config ? {
      ...form.pivot_config,
      rowFields: (form.pivot_config.rowFields || []).filter(f => f.length > 0),
      columnFields: (form.pivot_config.columnFields || []).filter(f => f.length > 0),
    } : undefined;
    
    const dataToSave = {
      ...form,
      pivot_enabled: form.visualization_type === "pivot" ? true : form.pivot_enabled,
      pivot_config: cleanedPivotConfig,
    };
    
    if (editingCard) {
      // Update existing card
      api.put(`/admin/cards/${editingCard.id}`, dataToSave).then(() => {
        resetForm();
        load();
      });
    } else {
      // Create new card
      api.post("/admin/cards", dataToSave).then(() => {
        resetForm();
        load();
      });
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setForm({
      title: card.title,
      description: card.description,
      sql_query: card.sql_query,
      visualization_type: card.visualization_type,
      chart_type: card.chart_type,
      drilldown_enabled: card.drilldown_enabled,
      drilldown_query: card.drilldown_query,
      hide_title: card.hide_title,
      font_size: card.font_size,
      font_family: card.font_family,
      section_name: card.section_name,
      section_order: card.section_order,
      group_name: card.group_name,
      group_order: card.group_order,
      header_bg_color: card.header_bg_color,
      header_text_color: card.header_text_color,
      conditional_formatting: card.conditional_formatting,
      pivot_enabled: card.pivot_enabled,
      pivot_config: card.pivot_config,
      trending_enabled: card.trending_enabled,
      trending_comparison_type: card.trending_comparison_type,
      trending_comparison_field: card.trending_comparison_field,
      trending_target_value: card.trending_target_value,
        metric_drilldown_enabled: card.metric_drilldown_enabled,
        metric_drilldown_query: card.metric_drilldown_query,
      is_active: card.is_active,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this card?")) {
      api.delete(`/admin/cards/${id}`).then(() => {
        load();
      });
    }
  };

  const getMetricPreviewTrend = () => {
    if (
      form.visualization_type !== "metric" ||
      !previewData ||
      previewData.length === 0 ||
      !form.trending_enabled ||
      !form.trending_comparison_type
    ) {
      return null;
    }

    const firstRow = previewData[0] || {};
    const currentRawValue = firstRow.total ?? Object.values(firstRow)[0];
    const currentValue = Number(currentRawValue);

    if (!Number.isFinite(currentValue)) return null;

    let comparisonValue: number | null = null;

    if (form.trending_comparison_type === "previous_period" && form.trending_comparison_field) {
      const previousRawValue = firstRow[form.trending_comparison_field];
      const parsed = Number(previousRawValue);
      comparisonValue = Number.isFinite(parsed) ? parsed : null;
    }

    if (form.trending_comparison_type === "target" && form.trending_target_value !== undefined) {
      comparisonValue = Number(form.trending_target_value);
    }

    if (comparisonValue === null || !Number.isFinite(comparisonValue)) {
      return { symbol: "—", color: "#6b7280", label: "Comparison value not found" };
    }

    if (currentValue > comparisonValue) {
      return { symbol: "↑", color: "#10b981", label: `Trending up vs ${comparisonValue.toLocaleString()}` };
    }

    if (currentValue < comparisonValue) {
      return { symbol: "↓", color: "#ef4444", label: `Trending down vs ${comparisonValue.toLocaleString()}` };
    }

    return { symbol: "—", color: "#6b7280", label: "No change" };
  };

  const metricPreviewTrend = getMetricPreviewTrend();

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Manage Dashboard Cards</h1>

      {/* Form Section */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>
          {editingCard ? "Edit Card" : "Create New Card"}
        </h2>
        
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Title *
            </label>
            <input
              value={form.title}
              placeholder="e.g., Total Revenue"
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={form.description}
              placeholder="Optional description of what this card shows"
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              SQL Query *
            </label>
            <textarea
              value={form.sql_query}
              placeholder="SELECT COUNT(*) as total FROM users"
              onChange={e => setForm({ ...form, sql_query: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "monospace",
                minHeight: 120,
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Visualization Type *
              </label>
              <select
                value={form.visualization_type}
                onChange={e => setForm({ ...form, visualization_type: e.target.value as "metric" | "table" | "chart" | "pivot" })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                <option value="metric">Metric (single number)</option>
                <option value="table">Table (rows of data)</option>
                <option value="chart">Chart (graph/visualization)</option>
                <option value="pivot">Pivot Table (grouped data)</option>
              </select>
            </div>

            {form.visualization_type === "chart" && (
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Chart Type *
                </label>
                <select
                  value={form.chart_type || "bar"}
                  onChange={e => setForm({ ...form, chart_type: e.target.value as "line" | "bar" | "pie" | "area" })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Status
              </label>
              <select
                value={form.is_active ? "true" : "false"}
                onChange={e => setForm({ ...form, is_active: e.target.value === "true" })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Hide Title Checkbox */}
          <div style={{ display: "flex", alignItems: "center", padding: 12, background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <input
              type="checkbox"
              id="hide_title"
              checked={form.hide_title || false}
              onChange={e => setForm({ ...form, hide_title: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            <label htmlFor="hide_title" style={{ fontSize: 14, fontWeight: 500 }}>
              Hide Card Title (useful for clean dashboards with only visual content)
            </label>
          </div>

          {/* Font Customization */}
          <div style={{ padding: 16, background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              Font Customization
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Font Size
                </label>
                <select
                  value={form.font_size || "medium"}
                  onChange={e => setForm({ ...form, font_size: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (Default)</option>
                  <option value="large">Large</option>
                  <option value="x-large">Extra Large</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Font Family
                </label>
                <select
                  value={form.font_family || "default"}
                  onChange={e => setForm({ ...form, font_family: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                    background: "#fff",
                  }}
                >
                  <option value="default">Default (System)</option>
                  <option value="arial">Arial</option>
                  <option value="roboto">Roboto</option>
                  <option value="helvetica">Helvetica</option>
                  <option value="times">Times New Roman</option>
                  <option value="georgia">Georgia</option>
                  <option value="courier">Courier New</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card Structure */}
          <div style={{ padding: 16, background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
              Card Structure
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Section Name
                </label>
                <input
                  type="text"
                  value={form.section_name || ""}
                  placeholder="e.g., Operations, Finance, Clinical Quality"
                  onChange={e => setForm({ ...form, section_name: e.target.value || undefined })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Cards in the same section appear together on the dashboard tab
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Section Order
                </label>
                <input
                  type="number"
                  value={form.section_order ?? 0}
                  onChange={e => setForm({ ...form, section_order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  min="0"
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Lower numbers appear first
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={form.group_name || ""}
                  placeholder="e.g., Revenue Metrics, Customer Data"
                  onChange={e => setForm({ ...form, group_name: e.target.value || undefined })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Cards with the same section + group will be displayed together
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Group Order
                </label>
                <input
                  type="number"
                  value={form.group_order ?? 0}
                  onChange={e => setForm({ ...form, group_order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  min="0"
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Lower numbers appear first
                </div>
              </div>
            </div>

            {/* Group Header Customization */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                Group Header Colors
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                    Header Background
                  </label>
                  <input
                    type="text"
                    value={form.header_bg_color || ""}
                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    onChange={e => setForm({ ...form, header_bg_color: e.target.value || undefined })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                    CSS color or gradient (e.g., #3b82f6 or linear-gradient(...))
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                    Header Text Color
                  </label>
                  <input
                    type="text"
                    value={form.header_text_color || ""}
                    placeholder="#ffffff"
                    onChange={e => setForm({ ...form, header_text_color: e.target.value || undefined })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                    CSS color (e.g., #ffffff or white)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drill-down configuration for table cards */}
          {form.visualization_type === "table" && (
            <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="drilldown_enabled"
                  checked={form.drilldown_enabled || false}
                  onChange={e => setForm({ ...form, drilldown_enabled: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="drilldown_enabled" style={{ fontSize: 14, fontWeight: 500 }}>
                  Enable Drill-Down (Click rows for details)
                </label>
              </div>

              {form.drilldown_enabled && (
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                    Drill-Down Query
                  </label>
                  <textarea
                    value={form.drilldown_query || ""}
                    placeholder="SELECT * FROM details WHERE id = {id}"
                    onChange={e => setForm({ ...form, drilldown_query: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: "monospace",
                      minHeight: 80,
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                    Use curly braces to reference row values: {"{column_name}"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metric card configuration */}
          {form.visualization_type === "metric" && (
            <div style={{ marginTop: 16, padding: 16, background: "#fef3c7", borderRadius: 6, border: "1px solid #fcd34d" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#92400e" }}>
                Metric Card Configuration
              </div>
              
              {/* Trending Display */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #fcd34d" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    id="trending_enabled"
                    checked={form.trending_enabled || false}
                    onChange={e => setForm({ ...form, trending_enabled: e.target.checked })}
                    style={{ marginRight: 8 }}
                  />
                  <label htmlFor="trending_enabled" style={{ fontSize: 14, fontWeight: 500 }}>
                    Show Trend Indicator (↑ ↓ —)
                  </label>
                </div>

                {form.trending_enabled && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                        Comparison Type
                      </label>
                      <select
                        value={form.trending_comparison_type || ""}
                        onChange={e => setForm({ ...form, trending_comparison_type: (e.target.value as "previous_period" | "target" | "") || null })}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 13,
                        }}
                      >
                        <option value="">Select comparison type...</option>
                        <option value="previous_period">Compare to Previous Period</option>
                        <option value="target">Compare to Target Value</option>
                      </select>
                      <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>
                        How to determine if metric is trending up or down
                      </div>
                    </div>

                    {form.trending_comparison_type === "previous_period" && (
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                          Comparison Field
                        </label>
                        <input
                          type="text"
                          value={form.trending_comparison_field || ""}
                          onChange={e => setForm({ ...form, trending_comparison_field: e.target.value })}
                          placeholder="e.g., 'previous_month' column/alias"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        />
                        <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>
                          Column name or alias for previous period value
                        </div>
                      </div>
                    )}

                    {form.trending_comparison_type === "target" && (
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                          Target Value
                        </label>
                        <input
                          type="number"
                          value={form.trending_target_value ?? ""}
                          onChange={e => setForm({ ...form, trending_target_value: e.target.value ? parseFloat(e.target.value) : undefined })}
                          placeholder="e.g., 1000"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        />
                        <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280" }}>
                          Target value to compare metric against
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Metric Drill-down */}
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    id="metric_drilldown_enabled"
                    checked={form.visualization_type === "metric" && (form as any).metric_drilldown_enabled || false}
                    onChange={e => setForm({ ...form, metric_drilldown_enabled: e.target.checked })}
                    style={{ marginRight: 8 }}
                  />
                  <label htmlFor="metric_drilldown_enabled" style={{ fontSize: 14, fontWeight: 500 }}>
                    Enable Drill-Down (Click metric for details)
                  </label>
                </div>

                {(form as any).metric_drilldown_enabled && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                      Drill-Down Query
                    </label>
                    <textarea
                      value={(form as any).metric_drilldown_query || ""}
                      placeholder="SELECT * FROM details WHERE ..."
                      onChange={e => setForm({ ...form, metric_drilldown_query: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        fontSize: 13,
                        fontFamily: "monospace",
                        minHeight: 80,
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
                      Query to execute when user clicks on the metric value
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pivot Table Configuration */}
          {form.visualization_type === "pivot" && (
            <div style={{ marginTop: 16, padding: 16, background: "#f0f9ff", borderRadius: 6, border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#1e40af" }}>
                Pivot Table Configuration
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Row Fields (comma-separated)</label>
                <input
                  type="text"
                  value={(form.pivot_config?.rowFields || []).join(", ")}
                  onChange={e => {
                    const value = e.target.value;
                    // Only split and filter when there's actual content, preserve raw input during typing
                    const fields = value.length > 0 ? value.split(",").map(s => s.trim()) : [];
                    setForm({ 
                      ...form, 
                      pivot_enabled: true,
                      pivot_config: { 
                        ...(form.pivot_config || { columnFields: [], valueField: "", aggregation: "sum" }),
                        rowFields: fields
                      }
                    });
                  }}
                  placeholder="e.g., Region, Category"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                />
                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                  Columns from your SQL query to group by as rows
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Column Fields (comma-separated)</label>
                <input
                  type="text"
                  value={(form.pivot_config?.columnFields || []).join(", ")}
                  onChange={e => {
                    const value = e.target.value;
                    // Only split and filter when there's actual content, preserve raw input during typing
                    const fields = value.length > 0 ? value.split(",").map(s => s.trim()) : [];
                    setForm({ 
                      ...form, 
                      pivot_enabled: true,
                      pivot_config: { 
                        ...(form.pivot_config || { rowFields: [], valueField: "", aggregation: "sum" }),
                        columnFields: fields
                      }
                    });
                  }}
                  placeholder="e.g., Year, Quarter"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                />
                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                  Columns from your SQL query to group by as columns
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Value Field</label>
                  <input
                    type="text"
                    value={form.pivot_config?.valueField || ""}
                    onChange={e => setForm({ 
                      ...form, 
                      pivot_enabled: true,
                      pivot_config: { 
                        ...(form.pivot_config || { rowFields: [], columnFields: [], aggregation: "sum" }),
                        valueField: e.target.value
                      }
                    })}
                    placeholder="e.g., Sales"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  />
                  <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                    Column to aggregate
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Aggregation</label>
                  <select
                    value={form.pivot_config?.aggregation || "sum"}
                    onChange={e => setForm({ 
                      ...form, 
                      pivot_enabled: true,
                      pivot_config: { 
                        ...(form.pivot_config || { rowFields: [], columnFields: [], valueField: "" }),
                        aggregation: e.target.value as "sum" | "avg" | "count" | "min" | "max"
                      }
                    })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Formatting for table and pivot cards */}
          {(form.visualization_type === "table" || form.visualization_type === "pivot") && (
            <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                Conditional Formatting
                <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
                  (Highlight cells based on their values)
                </span>
              </div>
              
              {(form.conditional_formatting || []).map((rule, index) => (
                <div key={index} style={{ 
                  padding: 12, 
                  background: "#fff", 
                  borderRadius: 6, 
                  border: "1px solid #e5e7eb",
                  marginBottom: 12 
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr", gap: 8, alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        Column
                      </label>
                      <input
                        type="text"
                        value={rule.column}
                        onChange={e => {
                          const newRules = [...(form.conditional_formatting || [])];
                          newRules[index] = { ...rule, column: e.target.value };
                          setForm({ ...form, conditional_formatting: newRules });
                        }}
                        placeholder="column_name"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        Operator
                      </label>
                      <select
                        value={rule.operator}
                        onChange={e => {
                          const newRules = [...(form.conditional_formatting || [])];
                          newRules[index] = { ...rule, operator: e.target.value as any };
                          setForm({ ...form, conditional_formatting: newRules });
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      >
                        <option value="greater">Greater than</option>
                        <option value="less">Less than</option>
                        <option value="equals">Equals</option>
                        <option value="between">Between</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        Value{rule.operator === "between" ? "s (min,max)" : ""}
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(rule.value) ? rule.value.join(",") : rule.value}
                        onChange={e => {
                          const newRules = [...(form.conditional_formatting || [])];
                          const val = rule.operator === "between" 
                            ? e.target.value.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                            : parseFloat(e.target.value);
                          newRules[index] = { ...rule, value: val };
                          setForm({ ...form, conditional_formatting: newRules });
                        }}
                        placeholder={rule.operator === "between" ? "10,20" : "10"}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        BG Color
                      </label>
                      <input
                        type="color"
                        value={rule.bgColor}
                        onChange={e => {
                          const newRules = [...(form.conditional_formatting || [])];
                          newRules[index] = { ...rule, bgColor: e.target.value };
                          setForm({ ...form, conditional_formatting: newRules });
                        }}
                        style={{
                          width: "100%",
                          height: "32px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={rule.textColor}
                        onChange={e => {
                          const newRules = [...(form.conditional_formatting || [])];
                          newRules[index] = { ...rule, textColor: e.target.value };
                          setForm({ ...form, conditional_formatting: newRules });
                        }}
                        style={{
                          width: "100%",
                          height: "32px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const newRules = (form.conditional_formatting || []).filter((_, i) => i !== index);
                      setForm({ ...form, conditional_formatting: newRules.length > 0 ? newRules : undefined });
                    }}
                    style={{
                      marginTop: 8,
                      padding: "4px 12px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remove Rule
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={() => {
                    const newRule: ConditionalFormattingRule = {
                      column: "",
                      operator: "greater",
                      value: 0,
                      bgColor: "#fef3c7",
                      textColor: "#92400e",
                    };
                    setForm({ 
                      ...form, 
                      conditional_formatting: [...(form.conditional_formatting || []), newRule] 
                    });
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  + Add Formatting Rule
                </button>

                {editingCard && (
                  <button
                    onClick={() => {
                      api.put(`/admin/cards/${editingCard.id}`, {
                        ...editingCard,
                        conditional_formatting: form.conditional_formatting
                      }).then(() => {
                        alert('Conditional formatting saved successfully!');
                        load();
                      }).catch(err => {
                        alert('Failed to save conditional formatting: ' + (err.response?.data?.error || err.message));
                      });
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💾 Save Formatting Rules
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={handlePreview}
              disabled={!form.sql_query || isPreviewing}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: form.sql_query && !isPreviewing ? "pointer" : "not-allowed",
                opacity: form.sql_query && !isPreviewing ? 1 : 0.5,
              }}
            >
              {isPreviewing ? "Previewing..." : "Preview Query"}
            </button>
            
            <button
              onClick={save}
              disabled={!form.title || !form.sql_query}
              style={{
                padding: "10px 20px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: form.title && form.sql_query ? "pointer" : "not-allowed",
                opacity: form.title && form.sql_query ? 1 : 0.5,
              }}
            >
              {editingCard ? "Update Card" : "Create Card"}
            </button>
            
            {editingCard && (
              <button
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  background: "#fff",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {(previewData || previewError) && (
        <div
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Query Preview
          </h3>

          {previewError ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                padding: 16,
                color: "#991b1b",
              }}
            >
              <strong>Error:</strong> {previewError}
            </div>
          ) : previewData && previewData.length > 0 ? (
            <>
              {form.visualization_type === "metric" ? (
                // Metric Preview (single number)
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 48, fontWeight: 700, color: "#1f2937" }}>
                    {Object.values(previewData[0])[0]?.toLocaleString() || "N/A"}
                  </div>
                  {metricPreviewTrend && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: metricPreviewTrend.color,
                        fontWeight: 600,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 999,
                        padding: "6px 12px",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{metricPreviewTrend.symbol}</span>
                      <span>{metricPreviewTrend.label}</span>
                    </div>
                  )}
                </div>
              ) : form.visualization_type === "chart" ? (
                // Chart Preview
                <div style={{ height: 400 }}>
                  <ChartCard 
                    data={previewData} 
                    chartType={form.chart_type || "bar"}
                    title="Preview Results" 
                  />
                </div>
              ) : form.visualization_type === "pivot" && form.pivot_config ? (
                // Pivot Table Preview
                <div style={{ height: 400 }}>
                  <PivotTable
                    data={transformToPivot(previewData, form.pivot_config)}
                    rawData={previewData}
                    pivotConfig={form.pivot_config}
                    title="Preview Results (Pivoted)"
                    fontSize={form.font_size}
                    fontFamily={form.font_family}
                    conditionalFormatting={form.conditional_formatting}
                  />
                </div>
              ) : (
                // Table Preview with Enhanced Features
                <div style={{ height: 400 }}>
                  <EnhancedTable 
                    data={previewData} 
                    title="Preview Results"
                    conditionalFormatting={form.conditional_formatting}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              No results returned
            </div>
          )}
        </div>
      )}

      {/* Cards List */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              <th onClick={() => sortCards("title")} style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Title {sortColumn === "title" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th onClick={() => sortCards("description")} style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Description {sortColumn === "description" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th onClick={() => sortCards("visualization_type")} style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Type {sortColumn === "visualization_type" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th onClick={() => sortCards("sql_query")} style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Query {sortColumn === "sql_query" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th onClick={() => sortCards("is_active")} style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Status {sortColumn === "is_active" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCards.map(card => (
              <tr key={card.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12, fontSize: 14 }}>{card.title}</td>
                <td style={{ padding: 12, fontSize: 14, color: "#6b7280", maxWidth: 280 }}>
                  {card.description ? (card.description.length > 80 ? `${card.description.substring(0, 80)}...` : card.description) : "—"}
                </td>
                <td style={{ padding: 12, fontSize: 14 }}>
                  <span style={{
                    padding: "2px 8px",
                    background: card.visualization_type === "metric" ? "#dbeafe" : "#e0e7ff",
                    color: card.visualization_type === "metric" ? "#1e40af" : "#3730a3",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {card.visualization_type}
                  </span>
                </td>
                <td style={{ padding: 12, fontSize: 12, fontFamily: "monospace", color: "#6b7280", maxWidth: 300 }}>
                  {card.sql_query.length > 60 ? `${card.sql_query.substring(0, 60)}...` : card.sql_query}
                </td>
                <td style={{ padding: 12, fontSize: 14 }}>
                  <span style={{
                    padding: "2px 8px",
                    background: card.is_active ? "#d1fae5" : "#fee2e2",
                    color: card.is_active ? "#065f46" : "#991b1b",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {card.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button
                    onClick={() => handleEdit(card)}
                    style={{
                      padding: "6px 12px",
                      background: "#fff",
                      color: "#3b82f6",
                      border: "1px solid #3b82f6",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#fff",
                      color: "#dc2626",
                      border: "1px solid #dc2626",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {cards.length === 0 && (
          <div style={{
            padding: 48,
            textAlign: "center",
            color: "#9ca3af",
          }}>
            <p style={{ fontSize: 16, marginBottom: 4 }}>No cards created yet</p>
            <p style={{ fontSize: 14 }}>Create your first card using the form above</p>
          </div>
        )}
      </div>
    </div>
  );
}
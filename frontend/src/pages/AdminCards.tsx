import { useEffect, useState } from "react";
import { api } from "../api";
import { EnhancedTable } from "../components/EnhancedTable";
import { ChartCard } from "../components/ChartCard";

interface Card {
  id: string;
  title: string;
  description?: string;
  sql_query: string;
  visualization_type: "metric" | "table" | "chart";
  chart_type?: "line" | "bar" | "pie" | "area";
  drilldown_enabled?: boolean;
  drilldown_query?: string;
  hide_title?: boolean;
  is_active: boolean;
}

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
    if (editingCard) {
      // Update existing card
      api.put(`/admin/cards/${editingCard.id}`, form).then(() => {
        resetForm();
        load();
      });
    } else {
      // Create new card
      api.post("/admin/cards", form).then(() => {
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
                onChange={e => setForm({ ...form, visualization_type: e.target.value as "metric" | "table" | "chart" })}
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
                    fontSize: 48,
                    fontWeight: 700,
                    color: "#1f2937",
                    textAlign: "center",
                    padding: 40,
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  {Object.values(previewData[0])[0]?.toLocaleString() || "N/A"}
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
              ) : (
                // Table Preview with Enhanced Features
                <div style={{ height: 400 }}>
                  <EnhancedTable data={previewData} title="Preview Results" />
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
              <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Title</th>
              <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Type</th>
              <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Query</th>
              <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600 }}>Status</th>
              <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12, fontSize: 14 }}>{card.title}</td>
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
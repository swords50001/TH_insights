import { useEffect, useState } from "react";
import { api } from "../api";

interface Filter {
  id?: number;
  name: string;
  filter_type: "date_range" | "select" | "multi_select" | "text";
  label: string;
  sql_parameter: string;
  options?: Array<{ label: string; value: string }>;
  default_value?: string;
  is_active: boolean;
  display_order: number;
}

export default function AdminFilters() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [form, setForm] = useState<Partial<Filter>>({
    name: "",
    filter_type: "select",
    label: "",
    sql_parameter: "",
    options: [],
    default_value: "",
    is_active: true,
    display_order: 0,
  });
  const [optionInput, setOptionInput] = useState({ label: "", value: "" });

  const load = () => {
    api.get("/admin/filters").then(r => {
      setFilters(r.data);
    });
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm({
      name: "",
      filter_type: "select",
      label: "",
      sql_parameter: "",
      options: [],
      default_value: "",
      is_active: true,
      display_order: 0,
    });
    setEditingFilter(null);
    setOptionInput({ label: "", value: "" });
  };

  const save = () => {
    if (editingFilter) {
      api.put(`/admin/filters/${editingFilter.id}`, form).then(() => {
        resetForm();
        load();
      });
    } else {
      api.post("/admin/filters", form).then(() => {
        resetForm();
        load();
      });
    }
  };

  const handleEdit = (filter: Filter) => {
    setEditingFilter(filter);
    setForm({
      name: filter.name,
      filter_type: filter.filter_type,
      label: filter.label,
      sql_parameter: filter.sql_parameter,
      options: filter.options || [],
      default_value: filter.default_value,
      is_active: filter.is_active,
      display_order: filter.display_order,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this filter?")) {
      api.delete(`/admin/filters/${id}`).then(() => {
        load();
      });
    }
  };

  const addOption = () => {
    if (optionInput.label && optionInput.value) {
      setForm({
        ...form,
        options: [...(form.options || []), { ...optionInput }],
      });
      setOptionInput({ label: "", value: "" });
    }
  };

  const removeOption = (index: number) => {
    setForm({
      ...form,
      options: form.options?.filter((_, i) => i !== index),
    });
  };

  const needsOptions = form.filter_type === "select" || form.filter_type === "multi_select";

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Manage Dashboard Filters</h1>

      {/* Form Section */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>
          {editingFilter ? "Edit Filter" : "Create New Filter"}
        </h2>
        
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Filter Name *
              </label>
              <input
                value={form.name}
                placeholder="e.g., Department Filter"
                onChange={e => setForm({ ...form, name: e.target.value })}
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
                Filter Type *
              </label>
              <select
                value={form.filter_type}
                onChange={e => setForm({ ...form, filter_type: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  background: "#fff",
                }}
              >
                <option value="select">Select (Dropdown)</option>
                <option value="multi_select">Multi-Select</option>
                <option value="date_range">Date Range</option>
                <option value="text">Text Input</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Display Label *
              </label>
              <input
                value={form.label}
                placeholder="e.g., Select Department"
                onChange={e => setForm({ ...form, label: e.target.value })}
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
                SQL Parameter Name *
              </label>
              <input
                value={form.sql_parameter}
                placeholder="e.g., department_id"
                onChange={e => setForm({ ...form, sql_parameter: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: "monospace",
                }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                Use in SQL as: WHERE department_id = :department_id
              </div>
            </div>
          </div>

          {needsOptions && (
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Options *
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={optionInput.label}
                  placeholder="Label (e.g., Sales)"
                  onChange={e => setOptionInput({ ...optionInput, label: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <input
                  value={optionInput.value}
                  placeholder="Value (e.g., 1)"
                  onChange={e => setOptionInput({ ...optionInput, value: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={addOption}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #3b82f6",
                    background: "#3b82f6",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Add
                </button>
              </div>
              {form.options && form.options.length > 0 && (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                  {form.options.map((opt, idx) => (
                    <div key={idx} style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      padding: "6px 8px",
                      background: "#f9fafb",
                      marginBottom: 4,
                      borderRadius: 4,
                    }}>
                      <span style={{ fontSize: 14 }}>{opt.label} → {opt.value}</span>
                      <button
                        onClick={() => removeOption(idx)}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid #ef4444",
                          background: "#fff",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Default Value
              </label>
              <input
                value={form.default_value || ""}
                placeholder="Optional default value"
                onChange={e => setForm({ ...form, default_value: e.target.value })}
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
                Display Order
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
            />
            <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 500 }}>
              Active (visible on dashboard)
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={save}
              disabled={!form.name || !form.label || !form.sql_parameter || (needsOptions && (!form.options || form.options.length === 0))}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                cursor: form.name && form.label && form.sql_parameter && (!needsOptions || (form.options && form.options.length > 0)) ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 500,
                opacity: form.name && form.label && form.sql_parameter && (!needsOptions || (form.options && form.options.length > 0)) ? 1 : 0.5,
              }}
            >
              {editingFilter ? "Update Filter" : "Create Filter"}
            </button>
            {editingFilter && (
              <button
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters List */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          fontWeight: 600,
          fontSize: 16,
        }}>
          Existing Filters
        </div>
        {filters.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 14,
          }}>
            No filters created yet
          </div>
        ) : (
          <div>
            {filters.map(filter => (
              <div
                key={filter.id}
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{filter.name}</span>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: filter.is_active ? "#d1fae5" : "#f3f4f6",
                      color: filter.is_active ? "#065f46" : "#6b7280",
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {filter.is_active ? "Active" : "Inactive"}
                    </span>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#e0e7ff",
                      color: "#3730a3",
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {filter.filter_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    <strong>Label:</strong> {filter.label} | <strong>Parameter:</strong> :{filter.sql_parameter}
                  </div>
                  {filter.options && filter.options.length > 0 && (
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                      Options: {filter.options.map(o => o.label).join(", ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleEdit(filter)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #3b82f6",
                      background: "#fff",
                      color: "#3b82f6",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(filter.id!)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #ef4444",
                      background: "#fff",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

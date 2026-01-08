import React, { useEffect, useState } from "react";
import { api } from "../api";

interface Filter {
  id: number;
  name: string;
  filter_type: "date_range" | "select" | "multi_select" | "text";
  label: string;
  sql_parameter: string;
  options?: Array<{ label: string; value: string }>;
  default_value?: string;
  is_active: boolean;
  display_order: number;
}

interface FilterBarProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const response = await api.get("/admin/filters");
      const activeFilters = response.data
        .filter((f: Filter) => f.is_active)
        .sort((a: Filter, b: Filter) => a.display_order - b.display_order);
      
      setFilters(activeFilters);
      
      // Initialize with default values
      const defaults: Record<string, any> = {};
      activeFilters.forEach((filter: Filter) => {
        if (filter.default_value) {
          defaults[filter.sql_parameter] = filter.default_value;
        }
      });
      setFilterValues(defaults);
      onFilterChange(defaults);
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to load filters:", err);
      setLoading(false);
    }
  };

  const handleFilterChange = (sqlParam: string, value: any) => {
    const newValues = { ...filterValues, [sqlParam]: value };
    setFilterValues(newValues);
    onFilterChange(newValues);
  };

  const handleClearFilters = () => {
    const defaults: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.default_value) {
        defaults[filter.sql_parameter] = filter.default_value;
      }
    });
    setFilterValues(defaults);
    onFilterChange(defaults);
  };

  if (loading || filters.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      marginBottom: "24px",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        cursor: "pointer",
        userSelect: "none",
        borderBottom: isCollapsed ? "none" : "1px solid #e5e7eb",
      }}
      onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ 
            fontSize: "18px",
            transition: "transform 0.3s ease",
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            display: "inline-block"
          }}>
            ▼
          </span>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Filters</h3>
          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400 }}>
            ({filters.length} filter{filters.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClearFilters();
          }}
          style={{
            background: "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Clear All
        </button>
      </div>

      {!isCollapsed && (
        <div style={{
          padding: "20px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            alignItems: "start",
          }}>
            {filters.map((filter) => (
          <div key={filter.id}>
            <label style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
            }}>
              {filter.label}
            </label>

            {filter.filter_type === "select" && (
              <select
                value={filterValues[filter.sql_parameter] || ""}
                onChange={(e) => handleFilterChange(filter.sql_parameter, e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "white",
                }}
              >
                <option value="">All</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {filter.filter_type === "multi_select" && (
              <select
                multiple
                value={filterValues[filter.sql_parameter] || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
                  handleFilterChange(filter.sql_parameter, values);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "white",
                  minHeight: "80px",
                }}
              >
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {filter.filter_type === "text" && (
              <input
                type="text"
                value={filterValues[filter.sql_parameter] || ""}
                onChange={(e) => handleFilterChange(filter.sql_parameter, e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
                placeholder={`Enter ${filter.label.toLowerCase()}`}
              />
            )}

            {filter.filter_type === "date_range" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="date"
                  value={filterValues[`${filter.sql_parameter}_start`] || ""}
                  onChange={(e) => handleFilterChange(`${filter.sql_parameter}_start`, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <input
                  type="date"
                  value={filterValues[`${filter.sql_parameter}_end`] || ""}
                  onChange={(e) => handleFilterChange(`${filter.sql_parameter}_end`, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
        </div>
      )}
    </div>
  );
}

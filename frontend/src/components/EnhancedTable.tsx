import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { api } from "../api";

type DataRow = Record<string, any>;

interface EnhancedTableProps {
  data: DataRow[];
  title: string;
  cardId?: string;
  drilldownEnabled?: boolean;
  drilldownQuery?: string;
}

// Conditional formatting rules
type ConditionalFormat = {
  type: "number" | "text";
  condition: "greater" | "less" | "equals" | "contains";
  value: number | string;
  style: React.CSSProperties;
};

export function EnhancedTable({ data, title, cardId, drilldownEnabled, drilldownQuery }: EnhancedTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [conditionalFormatting, setConditionalFormatting] = useState<
    Record<string, ConditionalFormat>
  >({});
  const [drilldownData, setDrilldownData] = useState<DataRow[] | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);

  console.log('EnhancedTable props:', { cardId, drilldownEnabled, drilldownQuery, dataLength: data?.length });

  const handleRowClick = async (row: DataRow) => {
    console.log('Row clicked:', row);
    console.log('Drilldown enabled?', drilldownEnabled);
    console.log('Drilldown query:', drilldownQuery);
    
    if (!drilldownEnabled || !drilldownQuery) {
      console.log('Drilldown not enabled or no query configured');
      return;
    }
    
    setSelectedRow(row);
    setDrilldownLoading(true);
    setDrilldownError(null);
    
    try {
      // Replace placeholders in drilldown query with row values
      let query = drilldownQuery;
      Object.keys(row).forEach(key => {
        const placeholder = `{${key}}`;
        const value = row[key];
        
        // Properly escape string values with single quotes
        let replacementValue: string;
        if (typeof value === 'string') {
          // Escape single quotes in the string value
          replacementValue = `'${value.replace(/'/g, "''")}'`;
        } else if (value === null || value === undefined) {
          replacementValue = 'NULL';
        } else {
          replacementValue = String(value);
        }
        
        query = query.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacementValue);
      });
      
      console.log('Executing drill-down query:', query);
      
      const response = await api.post("/dashboard/cards/preview/data", {
        sql_query: query,
      });
      
      setDrilldownData(response.data);
    } catch (err: any) {
      setDrilldownError(err.response?.data?.error || err.message || "Failed to load drill-down data");
    } finally {
      setDrilldownLoading(false);
    }
  };

  const closeDrilldown = () => {
    setDrilldownData(null);
    setSelectedRow(null);
    setDrilldownError(null);
  };

  const exportToCSV = (data: DataRow[], filename: string = 'drilldown-export.csv') => {
    if (!data || data.length === 0) return;

    // Get column headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas, quotes, or newlines
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate columns from data
  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      accessorKey: key,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={column.getToggleSortingHandler()}
          >
            <span style={{ fontWeight: 600 }}>{key}</span>
            {isSorted && (
              <span style={{ fontSize: 12 }}>
                {isSorted === "asc" ? "▲" : "▼"}
              </span>
            )}
          </div>
        );
      },
      cell: (info) => {
        const value = info.getValue();
        const cellStyle: React.CSSProperties = {};

        // Apply conditional formatting
        const format = conditionalFormatting[key];
        if (format) {
          const shouldApply = applyConditionalFormat(value, format);
          if (shouldApply) {
            Object.assign(cellStyle, format.style);
          }
        }

        return <div style={cellStyle}>{String(value)}</div>;
      },
    }));
  }, [data, conditionalFormatting]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Filter inputs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 0",
          flexWrap: "wrap",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 8,
        }}
      >
        {table.getAllColumns().map((column) => (
          <input
            key={column.id}
            placeholder={`Filter ${column.id}...`}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(e) => column.setFilterValue(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              minWidth: 100,
            }}
          />
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#f9fafb",
              zIndex: 10,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderBottom: "2px solid #e5e7eb",
                      color: "#374151",
                      background: "#f9fafb",
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row.original)}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#f9fafb",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: drilldownEnabled ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (drilldownEnabled) {
                    e.currentTarget.style.background = "#e0f2fe";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb";
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      padding: 12,
                      color: "#6b7280",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div
        style={{
          padding: "8px 0",
          fontSize: 12,
          color: "#6b7280",
          borderTop: "1px solid #e5e7eb",
          marginTop: 8,
        }}
      >
        Showing {table.getRowModel().rows.length} of {data.length} rows
        {drilldownEnabled && (
          <span style={{ marginLeft: 12, color: "#3b82f6" }}>
            • Click any row to drill down
          </span>
        )}
      </div>

      {/* Drill-down Modal */}
      {(drilldownData || drilldownLoading || drilldownError) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeDrilldown}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
                Drill-Down Details
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {drilldownData && drilldownData.length > 0 && (
                  <button
                    onClick={() => exportToCSV(drilldownData, `drilldown-${selectedRow ? Object.values(selectedRow)[0] : 'data'}.csv`)}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>↓</span> Export CSV
                  </button>
                )}
                <button
                  onClick={closeDrilldown}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: "0 8px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {drilldownLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                Loading drill-down data...
              </div>
            ) : drilldownError ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: 16,
                  color: "#991b1b",
                }}
              >
                <strong>Error:</strong> {drilldownError}
              </div>
            ) : drilldownData && drilldownData.length > 0 ? (
              <div style={{ minWidth: 600 }}>
                <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 6 }}>
                  <strong>Selected Row:</strong>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                    {selectedRow && Object.entries(selectedRow).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
                <EnhancedTable data={drilldownData} title="Drill-Down Results" />
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                No drill-down data found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to apply conditional formatting
function applyConditionalFormat(
  value: any,
  format: ConditionalFormat
): boolean {
  if (format.type === "number") {
    const numValue = Number(value);
    const numThreshold = Number(format.value);
    if (isNaN(numValue) || isNaN(numThreshold)) return false;

    switch (format.condition) {
      case "greater":
        return numValue > numThreshold;
      case "less":
        return numValue < numThreshold;
      case "equals":
        return numValue === numThreshold;
      default:
        return false;
    }
  } else {
    const strValue = String(value).toLowerCase();
    const strThreshold = String(format.value).toLowerCase();

    switch (format.condition) {
      case "contains":
        return strValue.includes(strThreshold);
      case "equals":
        return strValue === strThreshold;
      default:
        return false;
    }
  }
}

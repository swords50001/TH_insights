import React, { useState } from "react";

type ConditionalFormattingRule = {
  column: string;
  operator: "greater" | "less" | "equals" | "between";
  value: number | number[];
  bgColor: string;
  textColor: string;
};

interface PivotTableProps {
  data: any[];
  rawData?: any[]; // Original data before pivot transformation
  pivotConfig?: {
    rowFields: string[];
    columnFields: string[];
    valueField: string;
    aggregation: string;
  };
  title?: string;
  fontSize?: string;
  fontFamily?: string;
  conditionalFormatting?: ConditionalFormattingRule[];
}

export function PivotTable({ data, rawData, pivotConfig, title, fontSize = "medium", fontFamily = "default", conditionalFormatting }: PivotTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        No data available
      </div>
    );
  }

  // Helper function to check if a formatting rule should be applied
  const shouldApplyRule = (value: any, rule: ConditionalFormattingRule): boolean => {
    const numValue = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(numValue)) return false;

    switch (rule.operator) {
      case "greater":
        return numValue > (rule.value as number);
      case "less":
        return numValue < (rule.value as number);
      case "equals":
        return numValue === (rule.value as number);
      case "between":
        if (Array.isArray(rule.value) && rule.value.length === 2) {
          return numValue >= rule.value[0] && numValue <= rule.value[1];
        }
        return false;
      default:
        return false;
    }
  };

  // Get conditional formatting style for a cell
  const getCellStyle = (columnName: string, value: any, baseStyle: React.CSSProperties): React.CSSProperties => {
    if (!conditionalFormatting || conditionalFormatting.length === 0) {
      return baseStyle;
    }

    const rule = conditionalFormatting.find(r => r.column === columnName);
    if (rule && shouldApplyRule(value, rule)) {
      return {
        ...baseStyle,
        backgroundColor: rule.bgColor,
        color: rule.textColor,
        fontWeight: 500,
      };
    }

    return baseStyle;
  };

  const toggleRow = (rowIdx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIdx)) {
      newExpanded.delete(rowIdx);
    } else {
      newExpanded.add(rowIdx);
    }
    setExpandedRows(newExpanded);
  };

  // Get detail rows for a pivot row
  const getDetailRows = (pivotRow: any): any[] => {
    if (!rawData || !pivotConfig) return [];
    
    const { rowFields } = pivotConfig;
    
    // Filter raw data to match this pivot row's criteria
    return rawData.filter(rawRow => {
      return rowFields.every(field => rawRow[field] === pivotRow[field]);
    });
  };

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

  // Map font size settings to CSS values
  const getFontSize = (size?: string) => {
    const sizeMap: Record<string, string> = {
      small: "11px",
      medium: "13px",
      large: "15px",
      "x-large": "17px",
    };
    return sizeMap[size || "medium"] || "13px";
  };

  const containerFontFamily = getFontFamily(fontFamily);
  const containerFontSize = getFontSize(fontSize);

  // Get all column names from the first row
  const columns = Object.keys(data[0]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: containerFontFamily }}>
      {title && (
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "2px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#374151" }}>
            {title}
          </h3>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: containerFontSize,
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6", position: "sticky", top: 0, zIndex: 10 }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    borderBottom: "2px solid #e5e7eb",
                    borderRight: idx === 0 ? "2px solid #e5e7eb" : "1px solid #e5e7eb",
                    background: idx === 0 ? "#f9fafb" : "#f3f4f6",
                    position: idx === 0 ? "sticky" : "relative",
                    left: idx === 0 ? 0 : "auto",
                    zIndex: idx === 0 ? 11 : 10,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => {
              const isExpanded = expandedRows.has(rowIdx);
              const detailRows = isExpanded ? getDetailRows(row) : [];
              const canExpand = rawData && rawData.length > 0;

              return (
                <React.Fragment key={rowIdx}>
                  <tr
                    style={{
                      background: rowIdx % 2 === 0 ? "#fff" : "#f9fafb",
                      cursor: canExpand ? "pointer" : "default",
                    }}
                    onClick={() => canExpand && toggleRow(rowIdx)}
                  >
                    {columns.map((col, colIdx) => {
                      const value = row[col];
                      const isNumeric = typeof value === "number";
                      const isRowHeader = colIdx === 0;

                      return (
                        <td
                          key={colIdx}
                          style={{
                            padding: "10px 16px",
                            borderBottom: "1px solid #e5e7eb",
                            borderRight: isRowHeader ? "2px solid #e5e7eb" : "1px solid #e5e7eb",
                            color: "#374151",
                            textAlign: isNumeric && !isRowHeader ? "right" : "left",
                            fontWeight: isRowHeader ? 600 : 400,
                            background: isRowHeader ? "#f9fafb" : "transparent",
                            position: isRowHeader ? "sticky" : "relative",
                            left: isRowHeader ? 0 : "auto",
                            zIndex: isRowHeader ? 1 : 0,
                          }}
                        >
                          {isRowHeader && canExpand && (
                            <span style={{ marginRight: 8, fontSize: 12, color: "#6b7280" }}>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          )}
                          {isNumeric && !isRowHeader
                            ? typeof value === "number"
                              ? value.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })
                              : value
                            : value}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Detail rows */}
                  {isExpanded && detailRows.length > 0 && (
                    <tr key={`${rowIdx}-details`}>
                      <td
                        colSpan={columns.length}
                        style={{
                          padding: 0,
                          background: "#f9fafb",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <div style={{ padding: "8px 16px 16px 32px" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>
                            Detail Records ({detailRows.length})
                          </div>
                          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: "#e5e7eb" }}>
                                {Object.keys(detailRows[0]).map((key, idx) => (
                                  <th
                                    key={idx}
                                    style={{
                                      padding: "6px 8px",
                                      textAlign: "left",
                                      fontWeight: 600,
                                      color: "#4b5563",
                                      borderBottom: "1px solid #d1d5db",
                                    }}
                                  >
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {detailRows.map((detailRow, detailIdx) => (
                                <tr
                                  key={detailIdx}
                                  style={{
                                    background: detailIdx % 2 === 0 ? "#fff" : "#f3f4f6",
                                  }}
                                >
                                  {Object.keys(detailRow).map((key, keyIdx) => {
                                    const baseStyle = {
                                      padding: "6px 8px",
                                      borderBottom: "1px solid #e5e7eb",
                                      color: "#374151",
                                    };
                                    const cellStyle = getCellStyle(key, detailRow[key], baseStyle);
                                    
                                    return (
                                      <td key={keyIdx} style={cellStyle}>
                                        {detailRow[key]}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

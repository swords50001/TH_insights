import React, { useState } from "react";
import { DashboardTab } from "./DashboardTabs";
import { api } from "../api";

interface TabManagerProps {
  tabs: DashboardTab[];
  activeTabId: number;
  onClose: () => void;
  onUpdate: () => void;
}

const ICON_OPTIONS = [
  { emoji: "📊", label: "Chart" },
  { emoji: "📈", label: "Trending Up" },
  { emoji: "📉", label: "Trending Down" },
  { emoji: "💼", label: "Briefcase" },
  { emoji: "🎯", label: "Target" },
  { emoji: "⚡", label: "Lightning" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Idea" },
  { emoji: "🌟", label: "Star" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "📱", label: "Phone" },
  { emoji: "💻", label: "Computer" },
  { emoji: "🏠", label: "Home" },
  { emoji: "🏢", label: "Building" },
  { emoji: "👤", label: "User" },
];

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#84cc16", label: "Lime" },
];

export function TabManager({ tabs, activeTabId, onClose, onUpdate }: TabManagerProps) {
  const [editingTab, setEditingTab] = useState<DashboardTab | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#3b82f6",
  });
  const [duplicateSource, setDuplicateSource] = useState<number | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<number | null>(null);

  const handleEdit = (tab: DashboardTab) => {
    setEditingTab(tab);
    setFormData({
      name: tab.name,
      description: tab.description || "",
      icon: tab.icon || "",
      color: tab.color || "#3b82f6",
    });
  };

  const handleCreate = () => {
    setEditingTab({ id: -1, name: "", tab_order: tabs.length } as DashboardTab);
    setFormData({
      name: "",
      description: "",
      icon: "",
      color: "#3b82f6",
    });
  };

  const handleSave = async () => {
    try {
      if (editingTab?.id === -1) {
        // Create new
        await api.post("/admin/dashboards", {
          ...formData,
          tab_order: tabs.length,
        });
      } else {
        // Update existing
        await api.put(`/admin/dashboards/${editingTab?.id}`, {
          ...formData,
          tab_order: editingTab?.tab_order,
          is_active: true,
        });
      }
      setEditingTab(null);
      onUpdate();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this dashboard tab?")) return;
    
    try {
      await api.delete(`/admin/dashboards/${id}`);
      onUpdate();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateSource || !duplicateTarget) {
      alert("Please select both source and target dashboards");
      return;
    }

    if (duplicateSource === duplicateTarget) {
      alert("Source and target must be different");
      return;
    }

    try {
      await api.post(`/admin/dashboards/${duplicateSource}/duplicate`, {
        target_dashboard_id: duplicateTarget,
      });
      alert("Layout duplicated successfully!");
      setDuplicateSource(null);
      setDuplicateTarget(null);
    } catch (err: any) {
      alert("Failed to duplicate: " + err.message);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 32,
          maxWidth: 800,
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, marginBottom: 24, fontSize: 24, color: "#111827" }}>
          Manage Dashboard Tabs
        </h2>

        {/* Tab List */}
        {!editingTab && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "#374151" }}>Dashboard Tabs</h3>
                <button
                  onClick={handleCreate}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  + New Tab
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      backgroundColor: tab.id === activeTabId ? "#f0f9ff" : "#fff",
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{tab.icon || "📄"}</div>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: tab.color || "#3b82f6",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{tab.name}</div>
                      {tab.description && (
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{tab.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(tab)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        color: "#374151",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Edit
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={() => handleDelete(tab.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Duplicate Layout Section */}
            <div
              style={{
                marginTop: 32,
                padding: 20,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, color: "#374151" }}>
                Duplicate Layout Between Tabs
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                    Copy From
                  </label>
                  <select
                    value={duplicateSource || ""}
                    onChange={(e) => setDuplicateSource(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select source...</option>
                    {tabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.icon} {tab.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                    To
                  </label>
                  <select
                    value={duplicateTarget || ""}
                    onChange={(e) => setDuplicateTarget(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select target...</option>
                    {tabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.icon} {tab.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleDuplicate}
                  disabled={!duplicateSource || !duplicateTarget}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: duplicateSource && duplicateTarget ? "#10b981" : "#d1d5db",
                    color: "#fff",
                    cursor: duplicateSource && duplicateTarget ? "pointer" : "not-allowed",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Duplicate
                </button>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
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
                Close
              </button>
            </div>
          </>
        )}

        {/* Edit/Create Form */}
        {editingTab && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                Tab Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Dashboard"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                Icon
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.emoji}
                    onClick={() => setFormData({ ...formData, icon: option.emoji })}
                    style={{
                      padding: 8,
                      fontSize: 24,
                      border: formData.icon === option.emoji ? "2px solid #3b82f6" : "1px solid #d1d5db",
                      borderRadius: 6,
                      background: formData.icon === option.emoji ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                    }}
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#374151" }}>
                Color
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    style={{
                      width: 40,
                      height: 40,
                      border: formData.color === option.value ? "3px solid #111827" : "1px solid #d1d5db",
                      borderRadius: 6,
                      background: option.value,
                      cursor: "pointer",
                    }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingTab(null)}
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
              <button
                onClick={handleSave}
                disabled={!formData.name}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "none",
                  background: formData.name ? "#3b82f6" : "#d1d5db",
                  color: "#fff",
                  cursor: formData.name ? "pointer" : "not-allowed",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

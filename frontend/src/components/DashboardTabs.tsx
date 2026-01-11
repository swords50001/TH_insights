import React from "react";

export interface DashboardTab {
  id: number;
  name: string;
  description?: string;
  tab_order: number;
  icon?: string;
  color?: string;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTabId: number;
  onTabChange: (tabId: number) => void;
  onReorder?: (tabs: DashboardTab[]) => void;
  isAdmin?: boolean;
}

export function DashboardTabs({ tabs, activeTabId, onTabChange, onReorder, isAdmin = false }: DashboardTabsProps) {
  const [draggedTab, setDraggedTab] = React.useState<DashboardTab | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, tab: DashboardTab) => {
    if (!isAdmin || !onReorder) return;
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdmin || !onReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isAdmin || !onReorder || !draggedTab) return;
    e.preventDefault();
    
    const sourceIndex = tabs.findIndex(t => t.id === draggedTab.id);
    if (sourceIndex === targetIndex) {
      setDraggedTab(null);
      setDragOverIndex(null);
      return;
    }

    const newTabs = [...tabs];
    newTabs.splice(sourceIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);
    
    // Update tab_order for all tabs
    const reorderedTabs = newTabs.map((tab, index) => ({
      ...tab,
      tab_order: index,
    }));
    
    onReorder(reorderedTabs);
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        padding: "0 24px",
        gap: 4,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = draggedTab?.id === tab.id;
        const isDropTarget = dragOverIndex === index;
        
        return (
          <button
            key={tab.id}
            draggable={isAdmin && onReorder}
            onDragStart={(e) => handleDragStart(e, tab)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? (tab.color || "#2563eb") : "#6b7280",
              backgroundColor: isActive ? "#ffffff" : "transparent",
              border: "none",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottom: isActive ? `2px solid ${tab.color || "#2563eb"}` : "none",
              marginBottom: isActive ? "-2px" : "0",
              cursor: isAdmin && onReorder ? "grab" : "pointer",
              transition: "all 0.2s",
              opacity: isDragging ? 0.5 : 1,
              borderLeft: isDropTarget ? "3px solid #3b82f6" : "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            {tab.icon && <span style={{ fontSize: 16 }}>{tab.icon}</span>}
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}

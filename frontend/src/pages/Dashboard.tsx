import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard, GroupPosition } from "../components/DashboardGrid";
import { DashboardTabs, DashboardTab } from "../components/DashboardTabs";
import { getPublishedLayout } from "../publishedLayout";
import { api } from "../api";
import { FilterBar } from "../components/FilterBar";

export function Dashboard() {
  const [tabs, setTabs] = useState<DashboardTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [groupPositions, setGroupPositions] = useState<GroupPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // Load available dashboard tabs
  useEffect(() => {
    const loadTabs = async () => {
      try {
        const response = await api.get("/dashboards");
        const dashboardTabs = response.data as DashboardTab[];
        setTabs(dashboardTabs);
        
        // Set the first tab as active if not already set
        if (dashboardTabs.length > 0 && !activeTabId) {
          setActiveTabId(dashboardTabs[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load dashboard tabs:", err);
        // Continue anyway - single dashboard mode
      }
    };
    
    loadTabs();
  }, []);

  // Load dashboard layout when active tab changes
  useEffect(() => {
    if (!activeTabId) return;
    
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Load the published layout configured by admins for this dashboard
        const published = await getPublishedLayout(activeTabId);
        
        if (!published) {
          setError("Dashboard has not been configured yet. Please contact an administrator.");
          setLoading(false);
          return;
        }
        
        console.log('Loaded published layout:', published);
        
        // Fetch fresh card data from API to get latest drill-down config
        const response = await api.get("/dashboard/cards");
        const freshCards = response.data;
        
        console.log('Fresh cards from API:', freshCards);
        
        // Merge published positions with fresh card data
        // Important: freshCard data should override publishedCard to get latest DB values
        const mergedCards = published.cards.map(publishedCard => {
          const freshCard = freshCards.find((fc: any) => fc.id === publishedCard.id);
          console.log('Merging card:', publishedCard.id);
          console.log('  - publishedCard:', publishedCard);
          console.log('  - freshCard:', freshCard);
          console.log('  - freshCard pivot_enabled:', freshCard?.pivot_enabled);
          console.log('  - freshCard pivot_config:', freshCard?.pivot_config);
          console.log('  - freshCard visualization_type:', freshCard?.visualization_type);
          return {
            ...publishedCard,
            ...freshCard, // This will include drill-down fields and conditional_formatting
            // Ensure position data from published layout is preserved
            x: publishedCard.x,
            y: publishedCard.y,
            w: publishedCard.w,
            h: publishedCard.h,
            group: publishedCard.group,
          };
        });
        
        console.log('Merged cards with conditional_formatting:', mergedCards.map(c => ({ 
          id: c.id, 
          title: c.title, 
          conditional_formatting: c.conditional_formatting 
        })));
        setCards(mergedCards);
        
        // Load group positions
        if (published.groupPositions) {
          setGroupPositions(published.groupPositions);
        }
      } catch (err: any) {
        console.error("Failed to load dashboard:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [activeTabId]);

  const handleFilterChange = (filters: Record<string, any>) => {
    setFilterValues(filters);
    // TODO: Apply filters to card data
    console.log("Filter values changed:", filters);
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        color: "#6b7280",
      }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        color: "#dc2626",
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Dashboard Tabs */}
      {tabs.length > 1 && activeTabId && (
        <DashboardTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      )}
      
      {/* Main Dashboard Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", paddingTop: "16px" }}>
        <FilterBar onFilterChange={handleFilterChange} />
        <DashboardGrid 
          cards={cards}
          groupPositions={groupPositions}
          readOnly={true}
          filters={filterValues}
        />
      </div>
    </div>
  );
}
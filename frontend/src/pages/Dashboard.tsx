import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard, GroupPosition } from "../components/DashboardGrid";
import { getPublishedLayout } from "../publishedLayout";
import { api } from "../api";
import { FilterBar } from "../components/FilterBar";

export function Dashboard() {
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [groupPositions, setGroupPositions] = useState<GroupPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Load the published layout configured by admins
        const published = await getPublishedLayout();
        
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
        const mergedCards = published.cards.map(publishedCard => {
          const freshCard = freshCards.find((fc: any) => fc.id === publishedCard.id);
          console.log('Merging card:', publishedCard.id, 'freshCard:', freshCard);
          return {
            ...publishedCard,
            ...freshCard, // This will include drill-down fields and conditional_formatting
          };
        });
        
        console.log('Merged cards with conditional_formatting:', mergedCards);
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
  }, []);

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
    <div style={{ padding: "24px", paddingTop: "16px" }}>
      <FilterBar onFilterChange={handleFilterChange} />
      <DashboardGrid 
        cards={cards}
        groupPositions={groupPositions}
        readOnly={true}
        filters={filterValues}
      />
    </div>
  );
}
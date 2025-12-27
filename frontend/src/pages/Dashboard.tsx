import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard } from "../components/DashboardGrid";
import { getPublishedLayout } from "../publishedLayout";
import { api } from "../api";

export function Dashboard() {
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Load the published layout configured by admins
        const published = getPublishedLayout();
        
        if (!published) {
          setError("Dashboard has not been configured yet. Please contact an administrator.");
          setLoading(false);
          return;
        }
        
        console.log('Loaded published layout:', published);
        
        // Fetch fresh card data from API to get latest drill-down config
        const response = await api.get("/dashboard/cards");
        const freshCards = response.data;
        
        // Merge published positions with fresh card data
        const mergedCards = published.cards.map(publishedCard => {
          const freshCard = freshCards.find((fc: any) => fc.id === publishedCard.id);
          return {
            ...publishedCard,
            ...freshCard, // This will include drill-down fields
          };
        });
        
        setCards(mergedCards);
      } catch (err: any) {
        console.error("Failed to load dashboard:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

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
    <div style={{ padding: "24px" }}>
      <DashboardGrid 
        cards={cards} 
        readOnly={true}
      />
    </div>
  );
}
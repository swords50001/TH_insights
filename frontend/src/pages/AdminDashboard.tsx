import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard, Card } from "../components/DashboardGrid";
import { api } from "../api";
import { publishLayout } from "../publishedLayout";

export function AdminDashboard() {
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/cards");
      const fetchedCards: Card[] = response.data;

      // Convert to positioned cards with default positions
      const positionedCards: PositionedCard[] = fetchedCards.map((card, index) => ({
        ...card,
        x: (index % 3) * 4, // 3 cards per row, 4 grid units wide
        y: Math.floor(index / 3) * 2, // 2 grid units tall
        width: 4,
        height: 2,
      }));

      setCards(positionedCards);
    } catch (err: any) {
      console.error("Failed to fetch dashboard cards:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCardMoved = (cardId: string, x: number, y: number) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, x, y } : card))
    );
  };

  const handleCardResized = (cardId: string, width: number, height: number) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, width, height } : card))
    );
  };

  const handlePublish = () => {
    try {
      publishLayout(cards, "admin");
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to publish layout:", err);
      alert("Failed to publish layout");
    }
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
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}>
        <div style={{ fontSize: 18, color: "#dc2626" }}>
          Error: {error}
        </div>
        <button 
          onClick={loadDashboard}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #3b82f6",
            background: "#3b82f6",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: "16px",
        background: "#f3f4f6",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: "#111827" }}>Admin Dashboard Editor</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#6b7280" }}>
            Drag cards to reposition, resize from bottom-right corner. Click "Publish Layout" to save changes for all users.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {publishSuccess && (
            <span style={{ color: "#10b981", fontSize: 14, fontWeight: 500 }}>
              ✓ Layout Published
            </span>
          )}
          <button 
            onClick={handlePublish}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #10b981",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Publish Layout
          </button>
          <button 
            onClick={loadDashboard}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      <DashboardGrid 
        cards={cards} 
        readOnly={false}
        onCardMoved={handleCardMoved}
        onCardResized={handleCardResized}
      />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard, Card, GroupPosition } from "../components/DashboardGrid";
import { api } from "../api";
import { publishLayout, getPublishedLayout } from "../publishedLayout";

export function AdminDashboard() {
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [groupPositions, setGroupPositions] = useState<GroupPosition[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showAvailableCards, setShowAvailableCards] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all cards from API
      const response = await api.get("/dashboard/cards");
      const fetchedCards: Card[] = response.data;
      setAllCards(fetchedCards);

      // Try to load the published layout first
      const published = await getPublishedLayout();
      
      let positionedCards: PositionedCard[];
      
      if (published && published.cards.length > 0) {
        // Use published layout and merge with fresh card data
        positionedCards = published.cards.map(publishedCard => {
          const freshCard = fetchedCards.find(fc => fc.id === publishedCard.id);
          return {
            ...publishedCard,
            ...freshCard, // Merge in latest card data
          };
        });
        
        // Load group positions
        if (published.groupPositions) {
          setGroupPositions(published.groupPositions);
        }
        
        // Add any new cards that aren't in the published layout
        const publishedIds = new Set(published.cards.map(c => c.id));
        const newCards = fetchedCards.filter(fc => !publishedIds.has(fc.id));
        
        newCards.forEach((card, index) => {
          positionedCards.push({
            ...card,
            x: (index % 3) * 4,
            y: Math.floor(index / 3) * 2,
            width: 4,
            height: 2,
          });
        });
      } else {
        // No published layout exists, use default positioning
        positionedCards = fetchedCards.map((card, index) => ({
          ...card,
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 2,
          width: 4,
          height: 2,
        }));
      }

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

  const handleRemoveCard = (cardId: string) => {
    if (confirm("Remove this card from the dashboard? (The card will not be deleted and can be added back)")) {
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    }
  };

  const handleGroupMoved = (groupName: string, x: number, y: number) => {
    setGroupPositions((prev) => {
      const existing = prev.find(p => p.groupName === groupName);
      if (existing) {
        return prev.map(p => 
          p.groupName === groupName ? { ...p, x, y } : p
        );
      } else {
        return [...prev, { groupName, x, y }];
      }
    });
  };

  const handleGroupResized = (groupName: string, width: number, height: number) => {
    setGroupPositions((prev) => {
      const existing = prev.find(p => p.groupName === groupName);
      if (existing) {
        return prev.map(p => 
          p.groupName === groupName ? { ...p, width, height } : p
        );
      } else {
        return [...prev, { groupName, x: 0, y: 0, width, height }];
      }
    });
  };

  const handleAddCard = (card: Card) => {
    // Find a good position for the new card
    const maxY = cards.length > 0 ? Math.max(...cards.map(c => c.y + c.height)) : 0;
    const newCard: PositionedCard = {
      ...card,
      x: 0,
      y: maxY,
      width: 4,
      height: 2,
    };
    setCards((prev) => [...prev, newCard]);
    setShowAvailableCards(false);
  };

  const handlePublish = async () => {
    try {
      // Capture actual container dimensions from DOM before publishing
      const groupNames = new Set<string>();
      cards.forEach(card => {
        if (card.group_name && card.group_name !== '__ungrouped__') {
          groupNames.add(card.group_name);
        }
      });
      
      const updatedGroupPositions: GroupPosition[] = [];
      
      groupNames.forEach(groupName => {
        const container = document.querySelector(`[data-group-name="${groupName}"]`) as HTMLElement;
        if (container) {
          // Find existing position or create new one
          const existing = groupPositions.find(gp => gp.groupName === groupName);
          const rect = container.getBoundingClientRect();
          const parent = container.offsetParent as HTMLElement;
          
          updatedGroupPositions.push({
            groupName,
            x: existing?.x || container.offsetLeft,
            y: existing?.y || container.offsetTop,
            width: container.offsetWidth,
            height: container.offsetHeight,
          });
        }
      });
      
      await publishLayout(cards, updatedGroupPositions, "admin");
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
            onClick={() => setShowAvailableCards(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Add Cards
          </button>
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
        groupPositions={groupPositions}
        readOnly={false}
        onCardMoved={handleCardMoved}
        onCardResized={handleCardResized}
        onCardRemoved={handleRemoveCard}
        onGroupMoved={handleGroupMoved}
        onGroupResized={handleGroupResized}
      />
      
      {/* Available Cards Modal */}
      {showAvailableCards && (
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
          onClick={() => setShowAvailableCards(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: 600,
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Available Cards</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {allCards
                .filter((card) => !cards.some((c) => c.id === card.id))
                .map((card) => (
                  <div
                    key={card.id}
                    style={{
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{card.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        {card.visualization_type}
                        {card.chart_type && ` - ${card.chart_type}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCard(card)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
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
                ))}
              {allCards.filter((card) => !cards.some((c) => c.id === card.id)).length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                  All available cards are already on the dashboard
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAvailableCards(false)}
              style={{
                marginTop: 16,
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

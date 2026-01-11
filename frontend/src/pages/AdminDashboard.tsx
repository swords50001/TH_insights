import React, { useEffect, useState } from "react";
import { DashboardGrid, PositionedCard, Card, GroupPosition } from "../components/DashboardGrid";
import { DashboardTabs, DashboardTab } from "../components/DashboardTabs";
import { TabManager } from "../components/TabManager";
import { api } from "../api";
import { publishLayout, getPublishedLayout } from "../publishedLayout";

export function AdminDashboard() {
  const [tabs, setTabs] = useState<DashboardTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [cards, setCards] = useState<PositionedCard[]>([]);
  const [groupPositions, setGroupPositions] = useState<GroupPosition[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showAvailableCards, setShowAvailableCards] = useState(false);
  const [showTabManager, setShowTabManager] = useState(false);

  // Load dashboard tabs
  const loadTabs = async () => {
    try {
      const response = await api.get("/admin/dashboards");
      const dashboardTabs = response.data as DashboardTab[];
      setTabs(dashboardTabs);
      
      // Get the most recently published dashboard from backend
      if (dashboardTabs.length > 0 && !activeTabId) {
        try {
          const recentResponse = await api.get("/admin/dashboards/most-recent-published");
          const recentDashboardId = recentResponse.data?.dashboard_id;
          
          if (recentDashboardId && dashboardTabs.find(t => t.id === recentDashboardId)) {
            setActiveTabId(recentDashboardId);
          } else {
            // Fallback to first tab if no published dashboard found
            setActiveTabId(dashboardTabs[0].id);
          }
        } catch (err) {
          // Fallback to first tab if API fails
          setActiveTabId(dashboardTabs[0].id);
        }
      } else if (dashboardTabs.length > 0 && !dashboardTabs.find(t => t.id === activeTabId)) {
        // If current active tab doesn't exist, fall back to first
        setActiveTabId(dashboardTabs[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard tabs:", err);
    }
  };

  useEffect(() => {
    loadTabs();
  }, []);

  const handleReorderTabs = async (reorderedTabs: DashboardTab[]) => {
    try {
      // Update all tab orders in backend
      await Promise.all(
        reorderedTabs.map((tab) =>
          api.put(`/admin/dashboards/${tab.id}`, {
            name: tab.name,
            description: tab.description,
            tab_order: tab.tab_order,
            icon: tab.icon,
            color: tab.color,
            is_active: true,
          })
        )
      );
      setTabs(reorderedTabs);
    } catch (err: any) {
      console.error("Failed to reorder tabs:", err);
      alert("Failed to reorder tabs");
    }
  };

  const loadDashboard = async () => {
    if (!activeTabId) return;
    
    try {
      setLoading(true);
      
      // Fetch all cards from API
      const response = await api.get("/dashboard/cards");
      const fetchedCards: Card[] = response.data;
      setAllCards(fetchedCards);

      // Try to load the published layout first for this dashboard
      const published = await getPublishedLayout(activeTabId);
      
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
      } else {
        // No published layout exists - start with empty dashboard
        // User must explicitly add cards via "Add Card" button
        positionedCards = [];
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
    if (activeTabId) {
      loadDashboard();
    }
  }, [activeTabId]);

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
      
      await publishLayout(cards, updatedGroupPositions, "admin", activeTabId);
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Dashboard Tabs */}
      {tabs.length > 0 && activeTabId && (
        <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
          <DashboardTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            onReorder={handleReorderTabs}
            isAdmin={true}
          />
          <button
            onClick={() => setShowTabManager(!showTabManager)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              border: "none",
              background: "transparent",
              color: "#6b7280",
              cursor: "pointer",
              marginLeft: "auto",
              marginRight: 24,
            }}
          >
            ⚙️ Manage Tabs
          </button>
        </div>
      )}
      
      {/* Admin Header */}
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

      {/* Tab Manager Modal */}
      {showTabManager && (
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId || 0}
          onClose={() => setShowTabManager(false)}
          onUpdate={() => {
            loadTabs();
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}

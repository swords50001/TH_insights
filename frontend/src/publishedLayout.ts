import { PositionedCard } from "./components/DashboardGrid";
import { api } from "./api";

const STORAGE_KEY = "dashboard:publishedLayout";

export interface PublishedLayout {
  cards: PositionedCard[];
  publishedAt: string;
  publishedBy?: string;
}

// Fetch published layout from server (tenant-aware)
export async function getPublishedLayout(): Promise<PublishedLayout | null> {
  try {
    const response = await api.get("/dashboard/layout/layout");
    if (!response.data) return null;
    
    // Server returns layout_data which contains the cards
    const layoutData = response.data.layout_data;
    if (typeof layoutData === 'string') {
      return JSON.parse(layoutData);
    }
    return layoutData;
  } catch (err) {
    console.error("Failed to fetch published layout:", err);
    // Fallback to localStorage for backwards compatibility during migration
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}

// Publish layout to server (tenant-aware)
export async function publishLayout(cards: PositionedCard[], publishedBy?: string): Promise<void> {
  try {
    await api.post("/dashboard/layout/layout", { cards });
    
    // Also save to localStorage as backup
    const layout: PublishedLayout = {
      cards,
      publishedAt: new Date().toISOString(),
      publishedBy,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (err) {
    console.error("Failed to publish layout:", err);
    throw new Error("Failed to publish layout. Please try again.");
  }
}

// Clear published layout
export async function clearPublishedLayout(): Promise<void> {
  try {
    await api.delete("/dashboard/layout/layout");
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear layout:", err);
    throw new Error("Failed to clear layout. Please try again.");
  }
}

import { PositionedCard } from "./components/DashboardGrid";

const STORAGE_KEY = "dashboard:publishedLayout";

export interface PublishedLayout {
  cards: PositionedCard[];
  publishedAt: string;
  publishedBy?: string;
}

export function getPublishedLayout(): PublishedLayout | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function publishLayout(cards: PositionedCard[], publishedBy?: string): void {
  const layout: PublishedLayout = {
    cards,
    publishedAt: new Date().toISOString(),
    publishedBy,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function clearPublishedLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

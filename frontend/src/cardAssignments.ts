// Utility for managing card-to-quadrant assignments in localStorage
// This allows admin users to assign cards to specific quadrants

const STORAGE_KEY = "dashboard:cardAssignments";

export type CardAssignment = {
  cardId: string;
  quadrantId: string;
};

export function getCardAssignments(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load card assignments:", error);
  }
  return {};
}

export function saveCardAssignment(cardId: string, quadrantId: string): void {
  try {
    const assignments = getCardAssignments();
    assignments[cardId] = quadrantId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error("Failed to save card assignment:", error);
  }
}

export function saveAllCardAssignments(assignments: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error("Failed to save card assignments:", error);
  }
}

export function removeCardAssignment(cardId: string): void {
  try {
    const assignments = getCardAssignments();
    delete assignments[cardId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error("Failed to remove card assignment:", error);
  }
}

export function getQuadrantForCard(cardId: string): string | undefined {
  const assignments = getCardAssignments();
  return assignments[cardId];
}

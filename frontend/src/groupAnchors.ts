function normalizeAnchorValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toGroupAnchorId(groupName: string): string {
  const normalized = normalizeAnchorValue(groupName);
  return `dashboard-group-${normalized || "group"}`;
}

export function toSectionAnchorId(sectionName: string): string {
  const normalized = normalizeAnchorValue(sectionName);
  return `dashboard-section-${normalized || "section"}`;
}

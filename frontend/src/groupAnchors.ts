export function toGroupAnchorId(groupName: string): string {
  const normalized = groupName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `dashboard-group-${normalized || "group"}`;
}

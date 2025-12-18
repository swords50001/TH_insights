export interface Tenant {
  id: string;
  name: string;
  themeColor?: string;
  logoUrl?: string;
  dbOverride?: any;
}

export async function fetchTenant(): Promise<Tenant | null> {
  try {
    const resp = await fetch('/tenant/config');
    if (!resp.ok) return null;
    const json = await resp.json();
    return json as Tenant;
  } catch (err) {
    console.error('Error fetching tenant config', err);
    return null;
  }
}

// Simple client-side helper hook could be added in the future — keep this file as the scaffold.

"use server";

import { Buffer } from 'buffer';

const FRESHSERVICE_DOMAIN = process.env.FRESHSERVICE_DOMAIN || "itaurusitdienstleistungsgm.freshservice.com";
const FRESHSERVICE_API_KEY = process.env.FRESHSERVICE_API_KEY;

if (!FRESHSERVICE_API_KEY) {
  console.warn("FRESHSERVICE_API_KEY ist nicht gesetzt. Bitte in .env.local konfigurieren.");
}

const BASE_URL_V2 = `https://${FRESHSERVICE_DOMAIN}/api/v2/`;

const authHeaders = () => {
  const token = Buffer.from(`${FRESHSERVICE_API_KEY}:X`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as const;
};

async function getPaged<T = any>(urlBuilder: (page: number) => string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const url = urlBuilder(page);
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (res.status === 429) {
      const retry = parseInt(res.headers.get('Retry-After') || '1', 10);
      await new Promise(r => setTimeout(r, (retry + 1) * 1000));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET ${url} failed: ${res.status} - ${text}`);
    }
    const json = await res.json();
    const list: T[] = (json.assets || json.agents || json.departments || json.companies || json.requesters || json.asset_types || json.applications || json.installations || json) as T[];
    if (!list || list.length === 0) break;
    out.push(...list);
    page += 1;
  }
  return out;
}

// Companies (v2)
export async function fsGetCompanies(): Promise<any[]> {
  return getPaged<any>((page) => `${BASE_URL_V2}companies?page=${page}&per_page=100`);
}

// Departments (v2)
export async function fsGetDepartments(): Promise<any[]> {
  return getPaged<any>((page) => `${BASE_URL_V2}departments?page=${page}&per_page=100`);
}

// Agents (v2)
export async function fsGetAgents(): Promise<any[]> {
  return getPaged<any>((page) => `${BASE_URL_V2}agents?page=${page}&per_page=100`);
}

// Assets (v2)
export async function fsGetAssets(): Promise<any[]> {
  return getPaged<any>((page) => `${BASE_URL_V2}assets?page=${page}&per_page=100&include=type_fields`);
}

// Requesters (v2) – end users / contacts
export async function fsGetRequesters(): Promise<any[]> {
  return getPaged<any>((page) => `${BASE_URL_V2}requesters?page=${page}&per_page=100`);
}

// Department Fields (v2)
export async function fsGetDepartmentFields(): Promise<any[]> {
  const url = `${BASE_URL_V2}department_fields`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} - ${await res.text()}`);
  const body = await res.json();
  return body.department_fields || [];
}

// Agent Fields (v2)
export async function fsGetAgentFields(): Promise<any[]> {
  const url = `${BASE_URL_V2}agent_fields`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} - ${await res.text()}`);
  const body = await res.json();
  return body.agent_fields || [];
}

// Relationship Types (v2)
export async function fsGetRelationshipTypes(): Promise<any[]> {
  const url = `${BASE_URL_V2}relationship_types`;
  const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} - ${await res.text()}`);
  const body = await res.json();
  return body.relationship_types || [];
}

// Asset Types (v2)
export async function fsGetAssetTypes(): Promise<any[]> {
  return await getPaged(page => `${BASE_URL_V2}asset_types?page=${page}`);
}

export async function fsGetApplications(): Promise<any[]> {
  return await getPaged(page => `${BASE_URL_V2}applications?page=${page}`);
}

export async function fsGetApplicationInstallations(applicationId: string): Promise<any[]> {
  return await getPaged(page => `${BASE_URL_V2}applications/${applicationId}/installations?page=${page}`);
}

// Health check: testet v2 agent_fields (günstig, ohne große Last)
export async function fsHealthCheck(): Promise<{ ok: boolean; status: number; body?: any; error?: string }> {
  const url = `${BASE_URL_V2}agent_fields`;
  try {
    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { ok: res.ok, status: res.status, body: parsed };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.message || String(err) };
  }
} 
"use server";

import { eq, inArray } from "drizzle-orm";
import db from "@/db/drizzle";
import { customer, contactPerson, settings } from "@/db/schema";
import { fsGetAssets, fsGetAgents, fsGetDepartments, fsGetRequesters } from "./freshservice-api";
import { v4 as uuidv4 } from 'uuid';
import { getCursor, setCursor } from "./fs-settings";
import { sql } from "drizzle-orm";
import { system } from "@/db/schema";
import { fsGetAssetTypes } from "./freshservice-api"; // New import
import { operatingSystemEnum, serverApplicationTypeEnum } from "@/db/schema"; // New import
import { fsGetApplications, fsGetApplicationInstallations } from "./freshservice-api"; // Reverted to fsGetApplicationInstallations

const CURSOR_MIRROR_CUSTOMERS = "fs_cursor_mirror_customers";
const CURSOR_FS_SYSTEMS = "fs_cursor_systems"; // New cursor for systems
const CURSOR_FS_AGENTS = "fs_cursor_agents"; // cursor for agents (unused for now)
const CURSOR_FS_REQUESTERS = "fs_cursor_requesters"; // cursor for requesters

function toIso(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  return (d instanceof Date) ? d.toISOString() : d;
}

function chunk<T>(arr: T[], size = 250): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function makeAbbreviation(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return "CUST";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().padEnd(4, parts[0].slice(1, 4).toUpperCase());
  return trimmed.slice(0, 4).toUpperCase();
}

function makeUniqueAbbreviation(base: string, fsId: string, used: Set<string>): string {
  // Deterministic and globally unique per Freshservice entity
  const abbr = (`DEPT-${fsId}`).toUpperCase();
  used.add(abbr);
  return abbr;
}

// Helper functions for enum mapping
function mapOperatingSystem(osName: string | null): typeof operatingSystemEnum.enumValues[number] {
  switch (osName?.toUpperCase()) {
    case "WIN_SVR_2025": return "WIN_SVR_2025";
    case "WIN_SVR_2022": return "WIN_SVR_2022";
    case "WINDOWS SERVER 2025": return "WIN_SVR_2025";
    case "WINDOWS SERVER 2022": return "WIN_SVR_2022";
    case "WINDOWS SERVER 2019": return "WIN_SVR_2019";
    case "WINDOWS SERVER 2016": return "WIN_SVR_2016";
    case "WINDOWS SERVER 2012 R2": return "WIN_SVR_2012_R2";
    case "WINDOWS 10": return "WIN_10";
    case "WINDOWS 11": return "WIN_11";
    case "DEBIAN 10": return "DEBIAN_10";
    case "DEBIAN 11": return "DEBIAN_11";
    case "DEBIAN 12": return "DEBIAN_12";
    case "CENTOS 7": return "CENTOS_7";
    case "CENTOS 8": return "CENTOS_8";
    case "CENTOS 9": return "CENTOS_9";
    case "UBUNTU 18": return "UBUNTU_18";
    case "UBUNTU 20": return "UBUNTU_20";
    case "UBUNTU 22": return "UBUNTU_22";
    case "AMAZON LINUX 2": return "AMAZON_LINUX_2";
    case "AMAZON LINUX 2023": return "AMAZON_LINUX_2023";
    case "LINUX": return "LINUX";
    case "UBUNTU": return "LINUX";
    case "DEBIAN": return "LINUX";
    case "MACOS": return "MACOS";
    case "MAC OS": return "MACOS";
    case "ESXI": return "ESXI";
    case "VMWARE ESXI": return "ESXI";
    default:
      // Fallback für unbekannte Windows Server Versionen
      if (osName?.toUpperCase().includes("WINDOWS SERVER")) {
        return "OTHER_OS";
      }
      return "OTHER_OS";
  }
}

function mapServerApplicationType(role: string | null): typeof serverApplicationTypeEnum.enumValues[number] {
  switch (role?.toUpperCase()) {
    case "SQL": return "SQL";
    case "SQL SERVER": return "SQL"; // New mapping
    case "EXCHANGE": return "EXCHANGE"; // New mapping
    case "EXCHANGE SERVER": return "EXCHANGE"; // New mapping
    case "FILE": return "FILE";
    case "FILE SERVER": return "FILE"; // New mapping
    case "BACKUP": return "BACKUP";
    case "BACKUP SERVER": return "BACKUP"; // New mapping
    case "RDS": return "RDS";
    case "REMOTE DESKTOP SERVER": return "RDS"; // New mapping
    case "APPLICATION": return "APPLICATION";
    case "APPLIKATIONSSERVER": return "APPLICATION"; // New mapping
    case "OTHER": return "OTHER";
    case "SONSTIGES": return "OTHER"; // New mapping
    case "NONE": return "NONE";
    case "KEINE": return "NONE"; // New mapping
    // Add more server role mappings as needed
    default: return "NONE";
  }
}

export async function mirrorDepartmentsIntoCustomers() {
  // Use departments as source-of-truth, upsert into customer to avoid frontend changes
  const last = await getCursor(CURSOR_MIRROR_CUSTOMERS);
  const rows = await fsGetDepartments(); // Directly fetch from Freshservice

  // Preload customers by freshserviceId and used abbreviations
  const existing = await db.select({ id: customer.id, fs: customer.freshserviceId, abbr: customer.abbreviation }).from(customer);
  const custByFs = new Map<string, string>();
  const usedAbbr = new Set<string>();
  for (const r of existing) {
    if (r.fs) custByFs.set(r.fs, r.id);
    if (r.abbr) usedAbbr.add(r.abbr);
  }

  const toInsert: typeof customer.$inferInsert[] = [];
  const toUpdate: { id: string; patch: Partial<typeof customer.$inferInsert> }[] = [];
  const toDelete: string[] = []; // New: List of customer IDs to delete

  let maxUpdated = last ?? "1970-01-01T00:00:00Z";

  const freshserviceIds = new Set<string>(); // New: Keep track of Freshservice IDs present in the current sync

  for (const d of rows) {
    const fsId = String(d.id);
    freshserviceIds.add(fsId); // Add current Freshservice ID to the set
    const updatedAt = toIso(d.updated_at) || new Date().toISOString(); // Use Freshservice updated_at
    if (updatedAt > maxUpdated) maxUpdated = updatedAt;

    const baseAbbr = makeAbbreviation(d.name);
    const abbr = makeUniqueAbbreviation(baseAbbr, fsId, usedAbbr);

    const data = {
      name: d.name,
      address: d.custom_fields?.strasse ? String(d.custom_fields.strasse).trim() : null,
      city: d.custom_fields?.ort ? String(d.custom_fields.ort).trim() : null,
      postalCode: d.custom_fields?.plz ? String(d.custom_fields.plz).trim() : null,
      country: d.custom_fields?.land ? String(d.custom_fields.land).trim() : null,
      businessEmail: d.custom_fields?.e_mail ? String(d.custom_fields.e_mail).trim() : null,
      businessPhone: d.custom_fields?.telefon ? String(d.custom_fields.telefon).trim() : null,
      website: d.custom_fields?.website ? String(d.custom_fields.website).trim() : null,
      abbreviation: (d.custom_fields?.kurzel ? String(d.custom_fields.kurzel).trim() : makeAbbreviation(d.name)) as string,
      category: d.custom_fields?.kategorie ? String(d.custom_fields.kategorie).trim() : null,
      billingCode: d.custom_fields?.verrechnungscode ? String(d.custom_fields.verrechnungscode).trim() : null,
      serviceManager: d.custom_fields?.servicemanager ? String(d.custom_fields.servicemanager).trim() : null,
      sla: d.custom_fields?.sla === true,
      updatedAt,
    } as const;

    const localId = custByFs.get(fsId);
    if (!localId) {
      toInsert.push({ id: uuidv4(), freshserviceId: fsId, createdAt: new Date().toISOString(), ...data });
    } else {
      toUpdate.push({ id: localId, patch: data });
    }
  }

  // Identify customers to delete (those existing locally but not present in Freshservice data)
  for (const r of existing) {
    if (r.fs && !freshserviceIds.has(r.fs)) {
      toDelete.push(r.id);
    }
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(toInsert)) await tx.insert(customer).values(batch);
    for (const u of toUpdate) await tx.update(customer).set(u.patch).where(eq(customer.id, u.id));
    if (toDelete.length > 0) await tx.delete(customer).where(inArray(customer.id, toDelete)); // Perform deletions
  });

  await setCursor(CURSOR_MIRROR_CUSTOMERS, maxUpdated);
}

export async function syncFsSystems() {
  const last = await getCursor(CURSOR_FS_SYSTEMS);
  const allAssets = await fsGetAssets(); // Get all assets from Freshservice
  const allAssetTypes = await fsGetAssetTypes(); // Get all asset types from Freshservice

  const allApplications = await fsGetApplications(); // Get all software applications

  // Filter applications by status "managed"
  const managedApplications = allApplications.filter(app => app.status === "managed");

  const assetTypeIdToName = new Map<string, string>();
  for (const at of allAssetTypes) {
    assetTypeIdToName.set(String(at.id), at.name);
  }

  // NEW: Map Freshservice display_id to actual asset.id
  const fsAssetIdByDisplayId = new Map<string, string>();
  for (const asset of allAssets) {
    if (asset.display_id && asset.id) {
      fsAssetIdByDisplayId.set(String(asset.display_id), String(asset.id));
    }
  }

  const installedSoftwareByAssetId = new Map<string, string[]>();

  for (const app of managedApplications) { // Iterate over managed applications only
    const installations = await fsGetApplicationInstallations(String(app.id)); // Get installations
    for (const inst of installations) {
      const installationMachineId = String(inst.installation_machine_id); // This is likely the display_id
      const freshserviceAssetId = fsAssetIdByDisplayId.get(installationMachineId);

      if (!freshserviceAssetId) {
        console.warn(`Warning: Could not find Freshservice Asset ID for installation_machine_id: ${installationMachineId}. Skipping software '${app.name}'.`);
        continue; // Skip if we can't map to a real asset ID
      }

      if (!installedSoftwareByAssetId.has(freshserviceAssetId)) {
        installedSoftwareByAssetId.set(freshserviceAssetId, []);
      }
      installedSoftwareByAssetId.get(freshserviceAssetId)?.push(app.name);
    }
  }

  // Filter assets by type "VMware Server"
  const rows = allAssets.filter(a => {
    const assetTypeName = assetTypeIdToName.get(String(a.asset_type_id));
    return assetTypeName === "VMware Server";
  });

  const existingCustomers = await db.select({ id: customer.id, fs: customer.freshserviceId }).from(customer).where(sql`freshservice_id IS NOT NULL`);
  const customerIdByFsId = new Map<string, string>();
  for (const c of existingCustomers) {
    if (c.fs) customerIdByFsId.set(c.fs, c.id);
  }

  const existingSystems = await db.select().from(system);
  const systemByFsId = new Map<string, string>();
  const systemFsIdToCustomerId = new Map<string, string>();
  for (const s of existingSystems) {
    if (s.freshserviceId) {
      systemByFsId.set(s.freshserviceId, s.id);
      systemFsIdToCustomerId.set(s.freshserviceId, s.customerId);
    }
  }

  const toInsert: typeof system.$inferInsert[] = [];
  const toUpdate: { id: string; patch: Partial<typeof system.$inferInsert> }[] = [];
  const toDelete: string[] = [];

  let maxUpdated = last ?? "1970-01-01T00:00:00Z";

  const freshserviceSystemIds = new Set<string>();

  for (const a of rows) {
    const fsId = String(a.id);
    freshserviceSystemIds.add(fsId);
    const updatedAt = toIso(a.updated_at) || new Date().toISOString();
    if (updatedAt > maxUpdated) maxUpdated = updatedAt;

    const customerFsId = String(a.department_id);
    const localCustomerId = customerIdByFsId.get(customerFsId);

    if (!localCustomerId) {
      console.warn(`System ${a.name} (FS ID: ${fsId}) belongs to an unknown customer (Freshservice Department ID: ${customerFsId}). Skipping.`);
      continue;
    }

    // Dynamically extract type_fields
    const typeFields = a.type_fields || {};
    let ipAddress: string | null = null;
    let os: string | null = null;
    let serverRole: string | null = null;
    let maintenanceInterval: string | null = null;
    let computeType: string | null = null;

    for (const key in typeFields) {
      if (key.startsWith("computer_ip_address_")) ipAddress = String(typeFields[key]).trim();
      if (key.startsWith("betriebssystem_")) os = String(typeFields[key]).trim();
      if (key.startsWith("serverrolle_")) {
        serverRole = String(typeFields[key]).trim();
      }
      if (key.startsWith("wartungsintervall_")) maintenanceInterval = String(typeFields[key]).trim();
      if (key.startsWith("compute_type_")) computeType = String(typeFields[key]).trim();
    }

    const mappedServerApplicationType = mapServerApplicationType(serverRole);

    const data = {
      freshserviceId: fsId,
      customerId: localCustomerId,
      hostname: a.name || 'Unknown Host',
      ipAddress: ipAddress || null,
      description: a.description || null,
      hardwareType: computeType === "Virtual" ? "VIRTUAL" : "PHYSICAL", // Map based on compute_type
      operatingSystem: mapOperatingSystem(os), // Use mapping function
      serverApplicationType: mappedServerApplicationType, // Use mapping function
      installedSoftware: installedSoftwareByAssetId.get(fsId) || [], // New: Get installed software
      maintenanceInterval: maintenanceInterval,
      updatedAt: new Date(updatedAt),
    } satisfies Partial<typeof system.$inferInsert>;

    const localId = systemByFsId.get(fsId);
    if (!localId) {
      toInsert.push({ id: uuidv4(), createdAt: new Date(), ...data });
    } else {
      // Only update if there are changes to prevent unnecessary database writes
      const existingSystem = existingSystems.find(s => s.freshserviceId === fsId);
      if (existingSystem) {
        const patch: Partial<typeof system.$inferInsert> = {};
        let changed = false;

        if (data.hostname !== existingSystem.hostname) { patch.hostname = data.hostname; changed = true; }
        if (data.ipAddress !== existingSystem.ipAddress) { patch.ipAddress = data.ipAddress; changed = true; }
        if (data.description !== existingSystem.description) { patch.description = data.description; changed = true; }
        if (data.hardwareType !== existingSystem.hardwareType) { patch.hardwareType = data.hardwareType; changed = true; }
        if (data.operatingSystem !== existingSystem.operatingSystem) { patch.operatingSystem = data.operatingSystem; changed = true; }
        if (data.serverApplicationType !== existingSystem.serverApplicationType) { patch.serverApplicationType = data.serverApplicationType; changed = true; }
        if (JSON.stringify(data.installedSoftware) !== JSON.stringify(existingSystem.installedSoftware)) { patch.installedSoftware = data.installedSoftware; changed = true; }
        if (data.maintenanceInterval !== existingSystem.maintenanceInterval) { patch.maintenanceInterval = data.maintenanceInterval; changed = true; }
        if (data.updatedAt.toISOString() !== existingSystem.updatedAt?.toISOString()) { patch.updatedAt = data.updatedAt; changed = true; }

        // Check if customerId needs to be updated
        const currentCustomerId = systemFsIdToCustomerId.get(fsId);
        if (currentCustomerId !== localCustomerId) { patch.customerId = localCustomerId; changed = true; }

        if (changed) {
          toUpdate.push({ id: localId, patch });
        }
      }
    }
  }

  for (const s of existingSystems) {
    if (s.freshserviceId && !freshserviceSystemIds.has(s.freshserviceId)) {
      toDelete.push(s.id);
    }
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(toInsert)) await tx.insert(system).values(batch);
    for (const u of toUpdate) await tx.update(system).set(u.patch).where(eq(system.id, u.id));
    if (toDelete.length > 0) await tx.delete(system).where(inArray(system.id, toDelete));
  });

  await setCursor(CURSOR_FS_SYSTEMS, maxUpdated);
}

// Sync Freshservice Agents into local contact_person table
export async function syncFsAgents() {
  const last = await getCursor(CURSOR_FS_AGENTS);
  const agents = await fsGetAgents();
  console.log(`[FS] Agents fetched: count=${agents?.length ?? 0}`);

  // Build map Freshservice Department -> local customer.id
  const existingCustomers = await db.select({ id: customer.id, fs: customer.freshserviceId }).from(customer);
  const customerIdByFsId = new Map<string, string>();
  for (const c of existingCustomers) if (c.fs) customerIdByFsId.set(c.fs, c.id);

  // Preload existing contacts by Freshservice ID for upsert
  const existingContacts = await db.select().from(contactPerson);
  const contactIdByFsId = new Map<string, string>();
  for (const cp of existingContacts) if (cp.freshserviceId) contactIdByFsId.set(cp.freshserviceId, cp.id);

  const toInsert: typeof contactPerson.$inferInsert[] = [];
  const toUpdate: { id: string; patch: Partial<typeof contactPerson.$inferInsert> }[] = [];
  const toDelete: string[] = [];

  let maxUpdated = last ?? "1970-01-01T00:00:00Z";
  const seenFsIds = new Set<string>();

  for (const a of agents) {
    const fsId = String(a.id);
    seenFsIds.add(fsId);
    const updatedAt = toIso(a.updated_at) || new Date().toISOString();
    if (updatedAt > maxUpdated) maxUpdated = updatedAt;

    // Determine owning department/client
    const deptIds: number[] = Array.isArray(a.department_ids) ? a.department_ids : [];
    const primaryDeptId = deptIds.length > 0 ? String(deptIds[0]) : undefined;
    const localCustomerId = primaryDeptId ? customerIdByFsId.get(primaryDeptId) : undefined;

    if (!localCustomerId) {
      console.log(`[FS] SKIP: Agent ID=${fsId} (${a.first_name} ${a.last_name}) - No local customer mapping for Dept IDs: ${JSON.stringify(deptIds)}`);
      continue;
    } else {
      console.log(`[FS] SYNC: Agent ID=${fsId} (${a.first_name} ${a.last_name}) mapped to Customer: ${localCustomerId}`);
    }

    const data = {
      freshserviceId: fsId,
      customerId: localCustomerId,
      name: [a.first_name, a.last_name].filter(Boolean).join(" ") || a.first_name || a.email,
      email: a.email,
      phone: String(a.work_phone_number || a.mobile_phone_number || "") || "",
      updatedAt: new Date(updatedAt).toISOString(),
      createdAt: new Date(updatedAt).toISOString(),
    } as Partial<typeof contactPerson.$inferInsert>;

    const localId = contactIdByFsId.get(fsId);
    if (!localId) {
      toInsert.push({ id: uuidv4(), createdAt: new Date().toISOString(), ...data } as typeof contactPerson.$inferInsert);
    } else {
      const existing = existingContacts.find(c => c.id === localId);
      const patch: Partial<typeof contactPerson.$inferInsert> = {};
      let changed = false;
      if (existing) {
        if (existing.customerId !== data.customerId) { patch.customerId = data.customerId!; changed = true; }
        if (existing.name !== data.name) { patch.name = data.name!; changed = true; }
        if (existing.email !== data.email) { patch.email = data.email!; changed = true; }
        if (existing.phone !== data.phone) { patch.phone = data.phone!; changed = true; }
        // Ensure existing.updatedAt is a Date object before calling toISOString
        const existingUpdatedAt = existing.updatedAt;
        if (data.updatedAt && (!existingUpdatedAt || data.updatedAt !== existingUpdatedAt)) { patch.updatedAt = data.updatedAt; changed = true; }
      }
      if (changed) toUpdate.push({ id: localId, patch });
    }
  }

  // Delete contacts that originated from FS but are no longer present
  for (const c of existingContacts) {
    if (c.freshserviceId && !seenFsIds.has(c.freshserviceId)) toDelete.push(c.id);
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(toInsert)) await tx.insert(contactPerson).values(batch);
    for (const u of toUpdate) await tx.update(contactPerson).set(u.patch).where(eq(contactPerson.id, u.id));
    if (toDelete.length > 0) await tx.delete(contactPerson).where(inArray(contactPerson.id, toDelete));
  });

  await setCursor(CURSOR_FS_AGENTS, maxUpdated);

  // --- AUTOMATION: Sync all active agent names into the 'technicians' setting ---
  try {
    const allAgentNames = agents
      .filter(a => a.active !== false && (a.first_name || a.last_name))
      .map(a => [a.first_name, a.last_name].filter(Boolean).join(" "));

    if (allAgentNames.length > 0) {
      const existingSetting = await db.select().from(settings).where(eq(settings.key, 'technicians'));
      // Merge unique names with existing manually added ones
      const currentTechs = (existingSetting[0]?.value as string[]) || [];
      const mergedTechs = Array.from(new Set([...currentTechs, ...allAgentNames]));

      if (existingSetting.length > 0) {
        await db.update(settings).set({ value: mergedTechs, updatedAt: new Date() }).where(eq(settings.key, 'technicians'));
      } else {
        await db.insert(settings).values({ key: 'technicians', value: mergedTechs, createdAt: new Date(), updatedAt: new Date() });
      }
      console.log(`[FS] Updated 'technicians' setting with ${allAgentNames.length} names.`);
    }
  } catch (err) {
    console.error(`[FS] Error updating technicians setting:`, err);
  }
}

// Sync Freshservice Requesters (Contacts) into local contact_person table
export async function syncFsRequesters() {
  const last = await getCursor(CURSOR_FS_REQUESTERS);
  const requesters = await fsGetRequesters();
  console.log(`[FS] Requesters fetched: count=${requesters?.length ?? 0}`);

  const isEligible = (r: any): boolean => {
    // Verified: field name is 'ansprechpartner' and values are true/false/null
    const eligible = r.custom_fields?.ansprechpartner === true;
    return eligible;
  };

  const filtered = Array.isArray(requesters) ? requesters.filter(isEligible) : [];
  console.log(`[FS] Requesters passing 'Ansprechpartner' check (should be ~20): ${filtered.length}`);

  const existingCustomers = await db.select({ id: customer.id, fs: customer.freshserviceId, name: customer.name }).from(customer);
  const customerIdByFsId = new Map<string, string>();
  const customerIdByName = new Map<string, string>();
  for (const c of existingCustomers) {
    if (c.fs) customerIdByFsId.set(String(c.fs), c.id);
    if (c.name) customerIdByName.set(c.name.toLowerCase(), c.id);
  }

  // Fallback via department_names (ohne Companies-Endpoint, der hier 404 liefert)

  const existingContacts = await db.select().from(contactPerson);
  const contactIdByFsId = new Map<string, string>();
  for (const cp of existingContacts) if (cp.freshserviceId) contactIdByFsId.set(cp.freshserviceId, cp.id);

  const toInsert: typeof contactPerson.$inferInsert[] = [];
  const toUpdate: { id: string; patch: Partial<typeof contactPerson.$inferInsert> }[] = [];
  const toDelete: string[] = [];

  let maxUpdated = last ?? "1970-01-01T00:00:00Z";
  const seenFsIds = new Set<string>();

  for (const r of filtered) {
    const fsId = String(r.id);
    seenFsIds.add(fsId);
    const updatedAt = toIso(r.updated_at) || new Date().toISOString();
    if (updatedAt > maxUpdated) maxUpdated = updatedAt;

    const deptIds: number[] = Array.isArray(r.department_ids) ? r.department_ids : [];
    const primaryDeptId = deptIds.length > 0 ? String(deptIds[0]) : undefined;
    let localCustomerId = primaryDeptId ? customerIdByFsId.get(primaryDeptId) : undefined;

    // Fallback: try department_names to match customer by name
    if (!localCustomerId && Array.isArray(r.department_names) && r.department_names.length > 0) {
      for (const dn of r.department_names) {
        const byName = dn ? customerIdByName.get(String(dn).toLowerCase()) : undefined;
        if (byName) { localCustomerId = byName; break; }
      }
    }

    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.name || r.primary_email;
    if (!localCustomerId) {
      console.warn(`[FS] SKIP: Requester ID=${r.id} (${name}) found as ansprechpartner but could NOT be mapped to a customer. Dept IDs: ${JSON.stringify(deptIds)}, Dept Names: ${JSON.stringify(r.department_names)}`);
      continue;
    } else {
      console.log(`[FS] SYNC: Requester ID=${r.id} (${name}) mapped to Customer: ${localCustomerId}`);
    }

    const phone = String(r.work_phone_number || r.mobile_phone_number || "") || "";
    const email = r.primary_email || r.email;

    const data = {
      freshserviceId: fsId,
      customerId: localCustomerId,
      name,
      email,
      phone,
      updatedAt: new Date(updatedAt).toISOString(),
      createdAt: new Date(updatedAt).toISOString(),
    } as Partial<typeof contactPerson.$inferInsert>;

    const localId = contactIdByFsId.get(fsId);
    if (!localId) {
      toInsert.push({ id: uuidv4(), createdAt: new Date().toISOString(), ...data } as typeof contactPerson.$inferInsert);
    } else {
      const existing = existingContacts.find(c => c.id === localId);
      const patch: Partial<typeof contactPerson.$inferInsert> = {};
      let changed = false;
      if (existing) {
        if (existing.customerId !== data.customerId) { patch.customerId = data.customerId!; changed = true; }
        if (existing.name !== data.name) { patch.name = data.name!; changed = true; }
        if (existing.email !== data.email) { patch.email = data.email!; changed = true; }
        if (existing.phone !== data.phone) { patch.phone = data.phone!; changed = true; }
        const existingUpdatedAt = existing.updatedAt;
        if (data.updatedAt && (!existingUpdatedAt || data.updatedAt !== existingUpdatedAt)) { patch.updatedAt = data.updatedAt; changed = true; }
      }
      if (changed) toUpdate.push({ id: localId, patch });
    }
  }
  console.log(`[FS] Contacts to insert:`, JSON.stringify(toInsert, null, 2));

  for (const c of existingContacts) {
    if (c.freshserviceId && !seenFsIds.has(c.freshserviceId)) toDelete.push(c.id);
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(toInsert)) await tx.insert(contactPerson).values(batch);
    for (const u of toUpdate) await tx.update(contactPerson).set(u.patch).where(eq(contactPerson.id, u.id));
    if (toDelete.length > 0) await tx.delete(contactPerson).where(inArray(contactPerson.id, toDelete));
  });

  console.log(`[FS] Requesters upsert summary: inserted=${toInsert.length}, updated=${toUpdate.length}, deleted=${toDelete.length}`);
  if (toInsert.length > 0) {
    const preview = toInsert.map(i => ({ id: i.id, name: i.name, email: i.email, customerId: i.customerId, fsId: i.freshserviceId })).slice(0, 50);
    console.log(`[FS] Inserted contacts (up to 50):`, preview);
  }

  await setCursor(CURSOR_FS_REQUESTERS, maxUpdated);
  return {
    fetched: Array.isArray(requesters) ? requesters.length : 0,
    eligible: filtered.length,
    inserted: toInsert.length,
    updated: toUpdate.length,
    deleted: toDelete.length,
  } as const;
}

// Example: fetch a single requester by email and upsert into contact_person
export async function syncFsRequesterExampleByEmail(email: string) {
  // Get all requesters and pick the one matching the email (API wrapper could also support filter)
  const requesters = await fsGetRequesters();
  const r = requesters.find((x: any) => String(x.email).toLowerCase() === email.toLowerCase() || (Array.isArray(x.secondary_emails) && x.secondary_emails.some((se: string) => String(se).toLowerCase() === email.toLowerCase())));
  if (!r) {
    return { ok: false, message: `Requester with email ${email} not found in Freshservice.` } as const;
  }

  // Map requester to local customer via company/department
  const deptId = r.department_id ? String(r.department_id) : undefined;
  const customers = await db.select({ id: customer.id, fs: customer.freshserviceId }).from(customer);
  const custMap = new Map(customers.filter(c => c.fs).map(c => [c.fs as string, c.id] as const));
  const localCustomerId = deptId ? custMap.get(deptId) : undefined;
  if (!localCustomerId) {
    return { ok: false, message: `No mapped customer for requester's department_id=${deptId || 'N/A'}` } as const;
  }

  // Upsert into contact_person
  const existing = await db.select().from(contactPerson).where(eq(contactPerson.freshserviceId, String(r.id)));
  const base = {
    freshserviceId: String(r.id),
    customerId: localCustomerId,
    name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.name || r.email,
    email: r.email,
    phone: String(r.work_phone_number || r.mobile_phone_number || r.phone || "") || "",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  } as Omit<typeof contactPerson.$inferInsert, 'id'>;

  if (existing.length === 0) {
    await db.insert(contactPerson).values({ id: uuidv4(), ...base } as typeof contactPerson.$inferInsert);
  } else {
    await db.update(contactPerson).set(base).where(eq(contactPerson.id, existing[0].id));
  }

  return { ok: true, contact: base } as const;
}

export async function syncAllFreshservice() {
  const results: { entity: 'customers' | 'systems' | 'requesters' | 'agents'; ok: boolean; error?: string }[] = [];

  try {
    await mirrorDepartmentsIntoCustomers();
    results.push({ entity: 'customers', ok: true });
  } catch (e: any) {
    results.push({ entity: 'customers', ok: false, error: e?.message || String(e) });
  }

  try {
    await syncFsSystems();
    results.push({ entity: 'systems', ok: true });
  } catch (e: any) {
    results.push({ entity: 'systems', ok: false, error: e?.message || String(e) });
  }

  try {
    await syncFsRequesters();
    results.push({ entity: 'requesters', ok: true });
  } catch (e: any) {
    results.push({ entity: 'requesters', ok: false, error: e?.message || String(e) });
  }

  try {
    await syncFsAgents();
    results.push({ entity: 'agents', ok: true });
  } catch (e: any) {
    results.push({ entity: 'agents', ok: false, error: e?.message || String(e) });
  }

  const ok = results.every(r => r.ok);
  return { ok, results } as const;
} 
import db from "@/db/drizzle";
import { system } from "@/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function getAllSystems() {
  return await db.query.system.findMany({
    with: {
      customer: true,
    },
  });
}

export async function getSystemById(id: string) {
  return await db.query.system.findFirst({
    where: eq(system.id, id),
    with: {
      customer: true,
    },
  });
}

export async function getSystemsByCustomerId(customerId: string) {
  try {
    const systems = await db.query.system.findMany({
      where: eq(system.customerId, customerId),
      with: {
        customer: true,
      },
    });
    return systems;
  } catch (error) {
    console.error(`Error getting systems by customer id ${customerId}:`, error);
    throw new Error(`Failed to retrieve systems for customer id ${customerId}.`);
  }
}

export async function createSystem(newSystemData: typeof system.$inferInsert) {
  const id = uuidv4();
  const systemToInsert = { ...newSystemData, id };
  const [newSystem] = await db.insert(system).values(systemToInsert).returning();
  return newSystem;
}

export async function updateSystem(id: string, updatedSystemData: Partial<typeof system.$inferInsert>) {
  const [updatedSystem] = await db.update(system).set(updatedSystemData).where(eq(system.id, id)).returning();
  return updatedSystem;
}

export async function deleteSystem(id: string) {
  await db.delete(system).where(eq(system.id, id));
}

export async function getFilteredSystems({
  customerId,
  searchTerm,
  operatingSystem,
  hardwareType,
  maintenanceInterval,
  serverApplicationType,
}: {
  customerId?: string;
  searchTerm?: string;
  operatingSystem?: string;
  hardwareType?: string;
  maintenanceInterval?: string;
  serverApplicationType?: string;
}) {
  const conditions = [];

  if (customerId && customerId !== "__ALL__") {
    conditions.push(eq(system.customerId, customerId));
  }

  if (searchTerm) {
    const searchLower = `%${searchTerm.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(system.hostname, searchLower),
        ilike(system.ipAddress, searchLower),
        ilike(system.description, searchLower)
      )
    );
  }

  if (operatingSystem && operatingSystem !== "all_os") {
    conditions.push(eq(system.operatingSystem, operatingSystem as typeof system.operatingSystem._.data));
  }

  if (hardwareType && hardwareType !== "all_hardware") {
    conditions.push(eq(system.hardwareType, hardwareType as typeof system.hardwareType._.data));
  }

  // deviceType filter removed - column does not exist in schema

  if (maintenanceInterval && maintenanceInterval !== "all_maintenance") {
    conditions.push(eq(system.maintenanceInterval, maintenanceInterval as typeof system.maintenanceInterval._.data));
  }

  if (serverApplicationType && serverApplicationType !== "all_server_app") {
    conditions.push(eq(system.serverApplicationType, serverApplicationType as typeof system.serverApplicationType._.data));
  }

  return await db.query.system.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      customer: true,
    },
  });
} 
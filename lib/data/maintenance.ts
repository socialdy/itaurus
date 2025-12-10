import db from "@/db/drizzle";
import { maintenance } from "@/db/schema";
import { eq, and, gte, lte, asc, desc } from "drizzle-orm";
import { getSystemsByCustomerId } from "@/lib/data/system";
import { v4 as uuidv4 } from "uuid";

const sortableColumns = {
  date: maintenance.date,
  status: maintenance.status,
  title: maintenance.title,
};

export async function getAllMaintenanceEntries(startDate?: Date, endDate?: Date, sortColumn?: string | null, sortDirection?: string | null) {
  try {
    const whereConditions = [];

    if (startDate) {
      // For single day filtering, set endDate to the end of the selected day
      const adjustedEndDate = endDate || new Date(startDate);
      if (!endDate) {
        adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of the day
      }
      whereConditions.push(gte(maintenance.date, startDate.toISOString()));
      whereConditions.push(lte(maintenance.date, adjustedEndDate.toISOString()));
    }

    const columnExpression = sortColumn ? sortableColumns[sortColumn as keyof typeof sortableColumns] : undefined;
    const orderBy = columnExpression
      ? sortDirection === "desc"
        ? [desc(columnExpression)]
        : [asc(columnExpression)]
      : undefined;

    const allMaintenanceEntries = await db.query.maintenance.findMany({
      where: and(...whereConditions),
      with: {
        customer: true,
      },
      orderBy,
    });
    return allMaintenanceEntries;
  } catch (error) {
    console.error("Error getting all maintenance entries:", error);
    throw new Error("Failed to retrieve maintenance entries.");
  }
}

export async function getMaintenanceEntryById(id: string) {
  try {
    const maintenanceEntry = await db.query.maintenance.findFirst({
      where: (maintenance, { eq }) => eq(maintenance.id, id),
      with: {
        customer: {
          with: {
            contactPeople: true,
          }
        },
      },
      columns: {
        id: true,
        customerId: true,
        title: true,
        systemIds: true,
        technicianIds: true,
        date: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        systemNotes: true,
        systemTechnicianAssignments: true,
        instructions: true,
        systemTrackableItems: true, // Add systemTrackableItems here
      },
    });
    return maintenanceEntry;
  } catch (error) {
    console.error(`Error getting maintenance entry by id ${id}:`, error);
    throw new Error(`Failed to retrieve maintenance entry with id ${id}.`);
  }
}

export async function getMaintenanceEntriesByCustomerId(customerId: string, startDate?: Date, endDate?: Date, sortColumn?: string | null, sortDirection?: string | null) {
  try {
    const whereConditions = [eq(maintenance.customerId, customerId)];

    if (startDate) {
      // For single day filtering, set endDate to the end of the selected day
      const adjustedEndDate = endDate || new Date(startDate);
      if (!endDate) {
        adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of the day
      }
      whereConditions.push(gte(maintenance.date, startDate.toISOString()));
      whereConditions.push(lte(maintenance.date, adjustedEndDate.toISOString()));
    }

    const columnExpression = sortColumn ? sortableColumns[sortColumn as keyof typeof sortableColumns] : undefined;
    const orderBy = columnExpression
      ? sortDirection === "desc"
        ? [desc(columnExpression)]
        : [asc(columnExpression)]
      : undefined;

    const maintenanceEntries = await db.query.maintenance.findMany({
      where: and(...whereConditions),
      with: {
        customer: true,
      },
      orderBy,
    });
    return maintenanceEntries;
  } catch (error) {
    console.error(`Error getting maintenance entries by customer id ${customerId}:`, error);
    throw new Error(`Failed to retrieve maintenance entries for customer id ${customerId}.`);
  }
}

export async function createMaintenanceEntry(newMaintenanceEntry: typeof maintenance.$inferInsert & { instructions?: string | null }) {
  try {
    // Fetch customer abbreviation
    const customerData = await db.query.customer.findFirst({
      where: (customer, { eq }) => eq(customer.id, newMaintenanceEntry.customerId),
      columns: { abbreviation: true },
    });

    if (!customerData) {
      throw new Error(`Customer with ID ${newMaintenanceEntry.customerId} not found.`);
    }

    // Fetch all systems for the given customer
    const customerSystems = await getSystemsByCustomerId(newMaintenanceEntry.customerId);
    const systemIdsToAssign = customerSystems.map(sys => sys.id); // Get IDs of all systems

    const abbreviation = customerData.abbreviation;
    const maintenanceDate = new Date(newMaintenanceEntry.date);
    const year = maintenanceDate.getFullYear();
    const month = (maintenanceDate.getMonth() + 1).toString().padStart(2, '0');
    const generatedTitle = `${abbreviation} - Wartung ${year}-${month}`;

    const entryWithTitle = {
      ...newMaintenanceEntry,
      id: uuidv4(), // Generate a unique ID for the new entry
      title: generatedTitle,
      status: newMaintenanceEntry.status || 'Planned', // Set default status if not provided
      systemIds: systemIdsToAssign, // Assign all customer system IDs
      instructions: newMaintenanceEntry.instructions || null, // Include instructions, default to null
    };

    const result = await db.insert(maintenance).values(entryWithTitle).returning();
    return result[0];
  } catch (error) {
    console.error("Error creating maintenance entry:", error);
    throw new Error("Failed to create maintenance entry.");
  }
}

export async function updateMaintenanceEntry(id: string, updatedFields: Partial<typeof maintenance.$inferInsert>) {
  try {
    const fieldsToUpdate = { ...updatedFields };
    // Wenn customerId oder date geändert werden (egal ob einzeln oder gemeinsam), muss title neu generiert werden
    if (updatedFields.customerId || updatedFields.date) {
      // Hole neue customerId, Datum (entweder aus update-Fields, oder aus DB wenn nicht in Patch als Fallback)
      const existing = await db.query.maintenance.findFirst({ where: eq(maintenance.id, id), columns: { customerId: true, date: true } });
      const nextCustomerId = updatedFields.customerId || existing?.customerId;
      const nextDate = updatedFields.date || existing?.date;
      if (nextCustomerId && nextDate) {
        const customerData = await db.query.customer.findFirst({ where: (customer, { eq }) => eq(customer.id, nextCustomerId), columns: { abbreviation: true } });
        if (customerData) {
          const abbreviation = customerData.abbreviation;
          const dateObj = new Date(nextDate);
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          fieldsToUpdate.title = `${abbreviation} - Wartung ${year}-${month}`;
        }
      }
    }

    await db.update(maintenance)
      .set(fieldsToUpdate)
      .where(eq(maintenance.id, id));

    const updatedEntry = await db.query.maintenance.findFirst({
      where: eq(maintenance.id, id),
      with: {
        customer: true,
      },
      columns: {
        id: true,
        customerId: true,
        title: true,
        systemIds: true,
        technicianIds: true,
        date: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        systemNotes: true,
        systemTechnicianAssignments: true,
        instructions: true,
        systemTrackableItems: true,
      },
    });

    if (!updatedEntry) {
      throw new Error("Updated entry not found after update.");
    }

    return updatedEntry;
  } catch (error) {
    console.error(`Error updating maintenance entry with id ${id}:`, error);
    throw new Error(`Failed to update maintenance entry with id ${id}.`);
  }
}

export async function deleteMaintenanceEntry(id: string) {
  try {
    const result = await db.delete(maintenance).where(eq(maintenance.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error(`Error deleting maintenance entry with id ${id}:`, error);
    throw new Error(`Failed to delete maintenance entry with id ${id}.`);
  }
} 
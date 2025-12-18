import { NextRequest, NextResponse } from "next/server";
import { getMaintenanceEntryById, updateMaintenanceEntry } from "@/lib/data/maintenance";
import { getSystemsByCustomerId } from "@/lib/data/system";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        // 1. Fetch the maintenance entry to get the customerId
        const entry = await getMaintenanceEntryById(id);
        if (!entry) {
            return NextResponse.json({ message: "Maintenance entry not found" }, { status: 404 });
        }

        if (!entry.customerId) {
            return NextResponse.json({ message: "Maintenance entry has no customer assigned" }, { status: 400 });
        }

        // 2. Fetch all current systems for this customer
        const currentSystems = await getSystemsByCustomerId(entry.customerId);
        const allSystemIds = currentSystems.map(s => s.id);

        // 3. Update the maintenance entry with the new list of system IDs
        // We do NOT want to overwrite other fields, just ensure all systems are linked.
        // Drizzle/updateMaintenanceEntry handles the update.
        const updatedEntry = await updateMaintenanceEntry(id, {
            systemIds: allSystemIds
        });

        return NextResponse.json(updatedEntry, { status: 200 });

    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Failed to sync systems";
        console.error("Error syncing systems:", message, error);
        return NextResponse.json({ message }, { status: 500 });
    }
}

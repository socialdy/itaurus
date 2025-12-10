import { NextRequest, NextResponse } from "next/server";
import {
  deleteMaintenanceEntry,
  getMaintenanceEntryById,
  updateMaintenanceEntry,
} from "@/lib/data/maintenance";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const maintenanceEntry = await getMaintenanceEntryById(id);
    if (!maintenanceEntry) {
      return NextResponse.json({ message: "Maintenance entry not found" }, { status: 404 });
    }

    // Fetch full customer details including maintenanceNotes
    // This assumes getMaintenanceEntryById joins customer, but we need to ensure it gets all fields
    // If getMaintenanceEntryById uses a partial selection, we might need to fetch customer separately or update the query
    // For now, let's assume the data layer needs an update or we fetch it here if missing.
    // Actually, let's check getMaintenanceEntryById in data/maintenance.ts first. 
    // If it returns customer object, we should ensure it includes maintenanceNotes.

    return NextResponse.json(maintenanceEntry, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch maintenance entry";
    console.error("Error fetching maintenance entry:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updatedFields = await req.json();
    const updatedMaintenanceEntry = await updateMaintenanceEntry(id, updatedFields);

    if (!updatedMaintenanceEntry) {
      return NextResponse.json({ message: "Maintenance entry not found or not updated" }, { status: 404 });
    }

    return NextResponse.json(updatedMaintenanceEntry, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update maintenance entry";
    console.error("Error updating maintenance entry:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const deletedEntry = await deleteMaintenanceEntry(id);

    if (!deletedEntry) {
      return NextResponse.json({ message: "Maintenance entry not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance entry deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete maintenance entry";
    console.error("Error deleting maintenance entry:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

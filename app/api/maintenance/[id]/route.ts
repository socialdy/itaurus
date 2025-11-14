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

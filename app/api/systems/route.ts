import { NextRequest, NextResponse } from "next/server";
import { getSystemById, createSystem, updateSystem, deleteSystem, getFilteredSystems } from "@/lib/data/system";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const customerId = req.nextUrl.searchParams.get("customerId") || undefined;
    const searchTerm = req.nextUrl.searchParams.get("searchTerm") || undefined;
    const operatingSystem = req.nextUrl.searchParams.get("operatingSystem") || undefined;
    const hardwareType = req.nextUrl.searchParams.get("hardwareType") || undefined;
    const maintenanceInterval = req.nextUrl.searchParams.get("maintenanceInterval") || undefined;
    const serverApplicationType = req.nextUrl.searchParams.get("serverApplicationType") || undefined;

    if (id) {
      const system = await getSystemById(id);
      if (system) {
        return NextResponse.json(system, { status: 200 });
      } else {
        return NextResponse.json({ message: "System not found" }, { status: 404 });
      }
    } else {
      const systems = await getFilteredSystems({
        customerId,
        searchTerm,
        operatingSystem,
        hardwareType,
        maintenanceInterval,
        serverApplicationType,
      });
      return NextResponse.json(systems, { status: 200 });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch systems";
    console.error("Error fetching systems:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newSystemData = await req.json();
    const system = await createSystem(newSystemData);
    return NextResponse.json(system, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create system";
    console.error("Error creating system:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "System ID is required" }, { status: 400 });
    }
    const updatedSystemData = await req.json();
    const updatedSystem = await updateSystem(id, updatedSystemData);
    if (updatedSystem) {
      return NextResponse.json(updatedSystem, { status: 200 });
    } else {
      return NextResponse.json({ message: "System not found" }, { status: 404 });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update system";
    console.error("Error updating system:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "System ID is required" }, { status: 400 });
    }
    await deleteSystem(id);
    return NextResponse.json({ message: "System deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete system";
    console.error("Error deleting system:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getAllMaintenanceEntries, getMaintenanceEntriesByCustomerId, createMaintenanceEntry } from "@/lib/data/maintenance";

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId");
    const startDateParam = req.nextUrl.searchParams.get("startDate");
    const endDateParam = req.nextUrl.searchParams.get("endDate");
    const sortColumn = req.nextUrl.searchParams.get("sortColumn") ?? undefined;
    const sortDirection = req.nextUrl.searchParams.get("sortDirection") ?? undefined;

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const maintenanceEntries = customerId
      ? await getMaintenanceEntriesByCustomerId(customerId, startDate, endDate, sortColumn, sortDirection)
      : await getAllMaintenanceEntries(startDate, endDate, sortColumn, sortDirection);

    return NextResponse.json(maintenanceEntries, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch maintenance entries";
    console.error("Error fetching maintenance entries:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const data = await req.json();

    if (type === "entry") {
      const entryData = {
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
      };
      const newMaintenanceEntry = await createMaintenanceEntry(entryData);
      return NextResponse.json(newMaintenanceEntry, { status: 201 });
    }

    return NextResponse.json({ message: "Invalid type specified for POST request." }, { status: 400 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create maintenance item";
    console.error("Error creating maintenance item:", message, error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
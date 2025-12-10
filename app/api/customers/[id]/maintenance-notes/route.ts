import { NextResponse } from "next/server";
import db from "@/db/drizzle";
import { customer } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { maintenanceNotes } = body;

        if (typeof maintenanceNotes !== 'string') {
            return NextResponse.json({ message: "Invalid maintenance notes format" }, { status: 400 });
        }

        await db.update(customer)
            .set({ maintenanceNotes })
            .where(eq(customer.id, id));

        return NextResponse.json({ message: "Maintenance notes updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating maintenance notes:", error);
        return NextResponse.json({ message: "Failed to update maintenance notes" }, { status: 500 });
    }
}

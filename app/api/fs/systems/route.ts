import { NextResponse } from 'next/server';
import db from "@/db/drizzle";
import { system } from "@/db/schema";

export async function GET() {
  try {
    const systems = await db.select().from(system);
    return NextResponse.json(systems);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

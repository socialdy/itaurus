import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { contactPerson } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fsGetRequesters } from "@/server/freshservice-api";

interface FreshserviceRequester {
  id: number | string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "ID parameter is missing." }, { status: 400 });
  }

  try {
    // Fetch all requesters and find by ID
    const allRequesters = (await fsGetRequesters()) as FreshserviceRequester[];
    const requester = allRequesters.find((r) => String(r.id) === id);

    if (!requester) {
      return NextResponse.json({ ok: false, message: `Requester with ID ${id} not found in Freshservice.` }, { status: 404 });
    }

    // Additionally, try to find the contact person in the local database
    const localContact = await db.query.contactPerson.findFirst({
      where: eq(contactPerson.freshserviceId, id),
    });

    return NextResponse.json({ ok: true, freshserviceData: requester, localData: localContact });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Error fetching requester by ID:", message, error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { contactPerson } from '@/db/schema';

function redactedDbInfo() {
  const url = process.env.DATABASE_URL || '';
  try {
    const u = new URL(url);
    return { host: u.hostname, port: u.port, db: u.pathname.replace('/', '') };
  } catch {
    return { raw: url ? `${url.slice(0, 20)}...` : '' };
  }
}

export async function GET() {
  try {
    const rows = await db.select().from(contactPerson);
    const count = rows.length;
    return NextResponse.json({ ok: true, db: redactedDbInfo(), count, sample: rows.slice(0, 5) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}




























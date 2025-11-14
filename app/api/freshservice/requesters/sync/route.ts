import { NextResponse } from 'next/server';
import { syncFsRequesters } from '@/server/sync-freshservice';

export async function POST() {
  try {
    const result = await syncFsRequesters();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



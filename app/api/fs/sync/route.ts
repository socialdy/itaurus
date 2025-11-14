import { NextResponse } from 'next/server';
import { syncAllFreshservice } from '@/server/sync-freshservice';

export async function POST() {
  try {
    const res = await syncAllFreshservice();
    return NextResponse.json(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
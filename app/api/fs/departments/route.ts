import { NextResponse } from 'next/server';
import { fsGetDepartments } from '@/server/freshservice-api';

export async function GET() {
  try {
    const departments = await fsGetDepartments();
    return NextResponse.json(departments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

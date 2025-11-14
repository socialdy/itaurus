import { NextResponse } from 'next/server';
import { fsGetDepartmentFields } from '@/server/freshservice-api';

export async function GET() {
  try {
    const fields = await fsGetDepartmentFields();
    return NextResponse.json({ ok: true, department_fields: fields });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
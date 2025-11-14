import { NextResponse } from 'next/server';
import { fsHealthCheck } from '@/server/freshservice-api';

export async function GET() {
  const res = await fsHealthCheck();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
} 
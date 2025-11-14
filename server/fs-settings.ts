"use server";

import db from "@/db/drizzle";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCursor(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (!row) return null;
  const v = row.value as any;
  return (v && typeof v.lastSyncedAt === 'string') ? v.lastSyncedAt : null;
}

export async function setCursor(key: string, lastSyncedAt: string): Promise<void> {
  const exists = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  const payload = { value: { lastSyncedAt }, updatedAt: new Date() } as const;
  if (exists) {
    await db.update(settings).set(payload).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value: { lastSyncedAt }, createdAt: new Date(), updatedAt: new Date() });
  }
} 
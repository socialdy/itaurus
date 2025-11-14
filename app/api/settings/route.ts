import { NextResponse } from 'next/server';
import db from '@/db/drizzle';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/settings - Retrieve all settings
export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    return NextResponse.json(allSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings - Add or update a setting
export async function POST(req: Request) {
  // In a real application, you would add authentication/authorization here
  try {
    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ message: 'Key and value are required' }, { status: 400 });
    }

    const existingSetting = await db.select().from(settings).where(eq(settings.key, key));

    if (existingSetting.length > 0) {
      // Update existing setting
      console.log(`Updating setting for key: ${key}, new value:`, value);
      await db.update(settings).set({ value: value, updatedAt: new Date() }).where(eq(settings.key, key));
      console.log(`Setting '${key}' updated successfully in DB.`);
      return NextResponse.json({ message: 'Setting updated successfully' });
    } else {
      // Insert new setting
      console.log(`Adding new setting for key: ${key}, value:`, value);
      await db.insert(settings).values({ key, value, createdAt: new Date(), updatedAt: new Date() });
      console.log(`Setting '${key}' added successfully to DB.`);
      return NextResponse.json({ message: 'Setting added successfully' });
    }
  } catch (error) {
    console.error('Error adding/updating setting:', error);
    return NextResponse.json({ message: 'Failed to add/update setting' }, { status: 500 });
  }
}

// DELETE /api/settings - Delete a setting
export async function DELETE(req: Request) {
  // In a real application, you would add authentication/authorization here
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ message: 'Key is required' }, { status: 400 });
    }

    await db.delete(settings).where(eq(settings.key, key));
    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ message: 'Failed to delete setting' }, { status: 500 });
  }
} 
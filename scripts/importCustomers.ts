import * as fs from 'fs';
import csv from 'csv-parser'; // Geändert von 'csv-parse'
import { config } from 'dotenv';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { customer } from '../db/schema'; // Pfad zu Ihrem Drizzle-Schema
import { v4 as uuidv4 } from 'uuid'; // Für eindeutige IDs, falls Ihre CSV keine hat

// Laden der Umgebungsvariablen
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in the .env file.');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(client, { schema: { customer } }); // Nur das Customer-Schema importieren

interface CsvCustomer {
  id: string;
  abbreviation: string;
  name: string;
  business_email?: string;
  business_phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  category?: string;
  billing_code?: string;
  service_manager?: string;
  created_at?: string;
  updated_at?: string;
  website?: string;
  customer_instructions?: string; // Dies wird ein String sein, muss aber zu JSONB konvertiert werden
  sla?: string; // Dies wird ein String sein, muss aber zu Boolean konvertiert werden
}

async function importCustomers() {
  await client.connect();
  console.log('Datenbankverbindung hergestellt.');

  const csvFilePath = './scripts/customer.csv'; // Pfad zur CSV-Datei
  const customersToInsert: Array<typeof customer.$inferInsert> = [];

  // Hilfsfunktion zur robusten Datumsverarbeitung
  const getValidDateString = (dateString: string | undefined): string => {
    if (!dateString) {
      return new Date().toISOString();
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Wenn die Konvertierung ein ungültiges Datum ergibt, verwende das aktuelle Datum
      return new Date().toISOString();
    }
    return date.toISOString();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv()) // Zurückgesetzt auf Standard-Trennzeichen (Komma)
        .on('data', (row: CsvCustomer) => {
          console.log("Parsed row:", row); // Debugging-Ausgabe
          // Datenbereinigung und Mapping
          const createdAt = getValidDateString(row.created_at);
          const updatedAt = getValidDateString(row.updated_at);
          const sla = row.sla?.toLowerCase() === 'true'; // Konvertiere "true" zu true, alles andere zu false

          // customer_instructions könnte ein JSON-String sein oder leer.
          // Wir parsen ihn, oder setzen ihn auf ein leeres Array, wenn er leer ist.
          let customerInstructions: Array<{ type: 'text' | 'image', content: string }> = [];
          if (row.customer_instructions) {
            try {
              customerInstructions = JSON.parse(row.customer_instructions);
            } catch (e) {
              console.warn(`Could not parse customer_instructions for customer ${row.id}: ${row.customer_instructions}. Setting to empty array.`);
            }
          }

          customersToInsert.push({
            id: row.id || uuidv4(), // Verwende CSV-ID oder generiere neue UUID
            abbreviation: row.abbreviation || '', // Sicherstellen, dass es ein String ist
            name: row.name || '', // Sicherstellen, dass es ein String ist
            businessEmail: row.business_email || null,
            businessPhone: row.business_phone || null,
            address: row.address || null,
            city: row.city || null,
            postalCode: row.postal_code || null,
            country: row.country || null,
            category: row.category || null,
            billingCode: row.billing_code || null,
            serviceManager: row.service_manager || null,
            createdAt: createdAt,
            updatedAt: updatedAt,
            website: row.website || null,
            customerInstructions: customerInstructions,
            sla: sla,
          });
        })
        .on('end', () => {
          console.log(`CSV file "${csvFilePath}" erfolgreich geparst. ${customersToInsert.length} Datensätze gefunden.`);
          resolve();
        })
        .on('error', (err: any) => { // Typ für err hinzugefügt
          console.error(`Fehler beim Parsen der CSV-Datei: ${err.message}`);
          reject(err);
        });
    });

    if (customersToInsert.length > 0) {
      console.log('Beginne mit dem Einfügen der Datensätze in die Datenbank...');
      // Batch-Einfügung
      await db.insert(customer).values(customersToInsert);
      console.log(`${customersToInsert.length} Kunden erfolgreich in die Datenbank importiert.`);
    } else {
      console.log('Keine Kunden zum Importieren gefunden.');
    }
  } catch (error: any) {
    console.error(`Fehler beim Importvorgang: ${error.message}`);
  } finally {
    await client.end();
    console.log('Datenbankverbindung geschlossen.');
  }
}

importCustomers(); 
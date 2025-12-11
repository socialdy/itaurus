import db from '../db/drizzle';
import { customer, system, maintenance, contactPerson, user } from '../db/schema';
import * as fs from 'fs';

interface ExportData {
    customers: any[];
    systems: any[];
    maintenances: any[];
    contactPersons: any[];
    users: any[];
}

async function importData() {
    try {
        console.log('Reading data from data-export.json...');

        const fileContent = fs.readFileSync('data-export.json', 'utf-8');
        const data: ExportData = JSON.parse(fileContent);

        console.log('Importing data to database...');

        // Import in correct order (respecting foreign keys)
        if (data.users && data.users.length > 0) {
            console.log(`Importing ${data.users.length} users...`);
            await db.insert(user).values(data.users).onConflictDoNothing();
        }

        if (data.customers && data.customers.length > 0) {
            console.log(`Importing ${data.customers.length} customers...`);
            await db.insert(customer).values(data.customers).onConflictDoNothing();
        }

        if (data.systems && data.systems.length > 0) {
            console.log(`Importing ${data.systems.length} systems...`);
            await db.insert(system).values(data.systems).onConflictDoNothing();
        }

        if (data.contactPersons && data.contactPersons.length > 0) {
            console.log(`Importing ${data.contactPersons.length} contact persons...`);
            await db.insert(contactPerson).values(data.contactPersons).onConflictDoNothing();
        }

        if (data.maintenances && data.maintenances.length > 0) {
            console.log(`Importing ${data.maintenances.length} maintenances...`);
            await db.insert(maintenance).values(data.maintenances).onConflictDoNothing();
        }

        console.log('✅ Data imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
}

importData();

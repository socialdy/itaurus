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

// Helper function to convert string dates back to Date objects
function convertDates(obj: any, dateFields: string[]): any {
    const converted = { ...obj };
    for (const field of dateFields) {
        if (converted[field] && typeof converted[field] === 'string') {
            converted[field] = new Date(converted[field]);
        }
    }
    return converted;
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
            const usersWithDates = data.users.map(u => convertDates(u, ['createdAt', 'updatedAt']));
            await db.insert(user).values(usersWithDates).onConflictDoNothing();
        }

        if (data.customers && data.customers.length > 0) {
            console.log(`Importing ${data.customers.length} customers...`);
            const customersWithDates = data.customers.map(c => convertDates(c, ['createdAt', 'updatedAt']));
            await db.insert(customer).values(customersWithDates).onConflictDoNothing();
        }

        if (data.systems && data.systems.length > 0) {
            console.log(`Importing ${data.systems.length} systems...`);
            const systemsWithDates = data.systems.map(s => convertDates(s, ['createdAt', 'updatedAt']));
            await db.insert(system).values(systemsWithDates).onConflictDoNothing();
        }

        if (data.contactPersons && data.contactPersons.length > 0) {
            console.log(`Importing ${data.contactPersons.length} contact persons...`);
            const contactPersonsWithDates = data.contactPersons.map(cp => convertDates(cp, ['createdAt', 'updatedAt']));
            await db.insert(contactPerson).values(contactPersonsWithDates).onConflictDoNothing();
        }

        if (data.maintenances && data.maintenances.length > 0) {
            console.log(`Importing ${data.maintenances.length} maintenances...`);
            const maintenancesWithDates = data.maintenances.map(m => convertDates(m, ['date', 'createdAt', 'updatedAt']));
            await db.insert(maintenance).values(maintenancesWithDates).onConflictDoNothing();
        }

        console.log('✅ Data imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
}

importData();

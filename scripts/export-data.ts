import db from '../db/drizzle';
import { customer, system, maintenance, contactPerson, user } from '../db/schema';
import * as fs from 'fs';

async function exportData() {
    try {
        console.log('Exporting data from local database...');

        // Export all tables
        const customers = await db.select().from(customer);
        const systems = await db.select().from(system);
        const maintenances = await db.select().from(maintenance);
        const contactPersons = await db.select().from(contactPerson);
        const users = await db.select().from(user);

        const data = {
            customers,
            systems,
            maintenances,
            contactPersons,
            users,
        };

        // Write to JSON file
        fs.writeFileSync(
            'data-export.json',
            JSON.stringify(data, null, 2)
        );

        console.log('✅ Data exported successfully to data-export.json');
        console.log(`   - Customers: ${customers.length}`);
        console.log(`   - Systems: ${systems.length}`);
        console.log(`   - Maintenances: ${maintenances.length}`);
        console.log(`   - Contact Persons: ${contactPersons.length}`);
        console.log(`   - Users: ${users.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        process.exit(1);
    }
}

exportData();

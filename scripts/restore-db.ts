#!/usr/bin/env node
/**
 * Database Restore Script
 * 
 * Restores a PostgreSQL database from a backup file.
 * 
 * Usage:
 *   npx tsx scripts/restore-db.ts <backup-file>
 * 
 * Example:
 *   npx tsx scripts/restore-db.ts backups/backup_2026-01-28_10-30-00.sql
 * 
 * Requirements:
 *   - psql must be installed and available in PATH
 *   - DATABASE_URL environment variable must be set
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function parseConnectionString(url: string): { host: string; port: string; database: string; user: string; password: string } {
    const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5].split('?')[0],
    };
}

async function main() {
    console.log('🔄 Database Restore Script\n');

    const backupFile = process.argv[2];

    if (!backupFile) {
        console.error('❌ Usage: npx tsx scripts/restore-db.ts <backup-file>');
        console.error('   Example: npx tsx scripts/restore-db.ts backups/backup_2026-01-28_10-30-00.sql');
        process.exit(1);
    }

    if (!existsSync(backupFile)) {
        console.error(`❌ Backup file not found: ${backupFile}`);
        process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    try {
        const conn = parseConnectionString(databaseUrl);

        console.log(`📊 Database: ${conn.database}`);
        console.log(`🏠 Host: ${conn.host}:${conn.port}`);
        console.log(`📁 Backup file: ${backupFile}\n`);

        console.log('⚠️  WARNING: This will DROP and recreate the database!');
        console.log('   Press Ctrl+C within 5 seconds to cancel...\n');

        // Give user time to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));

        const env = { ...process.env, PGPASSWORD: conn.password };

        // Determine if we need to decompress
        let fileToRestore = backupFile;
        if (backupFile.endsWith('.gz')) {
            console.log('📦 Decompressing backup...');
            execSync(`gunzip -k "${backupFile}"`, { stdio: 'pipe' });
            fileToRestore = backupFile.replace('.gz', '');
        }

        console.log('⏳ Restoring database...');

        // Drop and recreate database connections, then restore
        execSync(
            `psql -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database} -f "${fileToRestore}"`,
            { env, stdio: 'inherit' }
        );

        console.log('\n✅ Database restored successfully!');

    } catch (error) {
        console.error('\n❌ Restore failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();

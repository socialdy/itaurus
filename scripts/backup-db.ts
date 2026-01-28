#!/usr/bin/env node
/**
 * Database Backup Script
 * 
 * Creates a backup of the PostgreSQL database.
 * 
 * Usage:
 *   npx tsx scripts/backup-db.ts
 * 
 * Requirements:
 *   - pg_dump must be installed and available in PATH
 *   - DATABASE_URL environment variable must be set (or in .env file)
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = join(process.cwd(), 'backups');

function getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

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
        database: match[5].split('?')[0], // Remove query params
    };
}

async function main() {
    console.log('🗄️  Database Backup Script\n');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    // Create backup directory if it doesn't exist
    if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
    }

    const timestamp = getTimestamp();
    const backupFileName = `backup_${timestamp}.sql`;
    const backupPath = join(BACKUP_DIR, backupFileName);

    try {
        const conn = parseConnectionString(databaseUrl);

        console.log(`📊 Database: ${conn.database}`);
        console.log(`🏠 Host: ${conn.host}:${conn.port}`);
        console.log(`📝 Backup file: ${backupPath}\n`);

        // Set PGPASSWORD environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: conn.password };

        // Run pg_dump
        console.log('⏳ Creating backup...');
        execSync(
            `pg_dump -h ${conn.host} -p ${conn.port} -U ${conn.user} -d ${conn.database} -F p -f "${backupPath}"`,
            { env, stdio: 'inherit' }
        );

        console.log(`\n✅ Backup created successfully: ${backupPath}`);

        // Also create a compressed version
        const compressedPath = `${backupPath}.gz`;
        try {
            execSync(`gzip -k "${backupPath}"`, { stdio: 'pipe' });
            console.log(`📦 Compressed backup: ${compressedPath}`);
        } catch {
            console.log('ℹ️  gzip not available, skipping compression');
        }

    } catch (error) {
        console.error('\n❌ Backup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Read SQL file
const migrationPath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Important for running multiple SQL statements
  });

  try {
    await connection.query(sql);
    console.log('Migration completed successfully ✅');
  } catch (err) {
    console.error('Migration failed ❌', err);
  } finally {
    await connection.end();
  }
}

runMigration();

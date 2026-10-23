import { openDatabase, migrate } from '../src/backend/repositories/database.js';
const db = openDatabase(); migrate(db); db.close(); console.log('Migration 001: OK (6 tables)');

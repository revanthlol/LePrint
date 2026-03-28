const db = require('./backend/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        await db.query(`
            ALTER TABLE kiosks 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
        `);
        
        console.log('✅ Migration successful: Added latitude and longitude to kiosks table.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();

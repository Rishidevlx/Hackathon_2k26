const pool = require('./db');

async function migrate() {
    try {
        const connection = await pool.getConnection();
        console.log('Migrating Users table...');
        try {
            await connection.query("ALTER TABLE users ADD COLUMN category ENUM('UG', 'PG') DEFAULT 'UG'");
            console.log("Success: Added category column to users table.");
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log("Column already exists.");
            } else {
                console.error("Migration Error:", e);
            }
        }
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Connection Error:", err);
        process.exit(1);
    }
}

migrate();

const pool = require('./db');

async function updateChallenges() {
    try {
        const connection = await pool.getConnection();
        console.log('Migrating Database for Hackathon 2K26...');

        // 1. Add Category and Description to Patterns table
        try {
            await connection.query("ALTER TABLE patterns ADD COLUMN category ENUM('UG', 'PG') DEFAULT 'UG'");
            await connection.query("ALTER TABLE patterns ADD COLUMN description TEXT");
            console.log("Migration: Added category and description to patterns table.");
        } catch (e) {
            console.log("Migration: Columns already exist or error, skipping.");
        }

        // 2. Clear existing patterns for fresh start
        await connection.query("DELETE FROM patterns");
        console.log("Database cleared.");

        const challenges = [
            // UG CHALLENGES
            {
                name: "PRIME_NUMBER_CHECK",
                category: "UG",
                level_order: 1,
                description: "Write a program to determine if the integer 17 is a prime number. Output should be exactly '17_IS_PRIME'.",
                target_output: "17_IS_PRIME"
            },
            {
                name: "RIGHT_TRIANGLE_PATTERN",
                category: "UG",
                level_order: 2,
                description: "Generate a 5-level right-angled triangle pattern using '*' characters.",
                target_output: "*\n**\n***\n****\n*****"
            },
            // PG CHALLENGES
            {
                name: "DISARIUM_NUMBER_VALIDATION",
                category: "PG",
                level_order: 1,
                description: "Check if 135 is a Disarium number. (1^1 + 3^2 + 5^3 = 1+9+125 = 135). Output '135_IS_DISARIUM' if valid.",
                target_output: "135_IS_DISARIUM"
            },
            {
                name: "MIRRORED_TRIANGLE_PATTERN",
                category: "PG",
                level_order: 2,
                description: "Generate a 5-level mirrored (left-facing) right triangle pattern.",
                target_output: "    *\n   **\n  ***\n ****\n*****"
            }
        ];

        for (const c of challenges) {
            await connection.query(
                "INSERT INTO patterns (name, category, level_order, description, target_output) VALUES (?, ?, ?, ?, ?)",
                [c.name, c.category, c.level_order, c.description, c.target_output]
            );
        }

        // 3. Update System Settings for 2 Hours
        await connection.query(`
            INSERT INTO system_config (setting_key, setting_value) 
            VALUES ('SESSION_DURATION_MINUTES', '120') 
            ON DUPLICATE KEY UPDATE setting_value = '120'
        `);

        console.log("Hackathon 2K26 Challenges Initialized Successfully! 🚀");
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Error updating challenges:", err);
        process.exit(1);
    }
}

updateChallenges();

import {pool} from "../src/database/index.ts";
async function checkDatabaseConnection() {
    try {
        const result = await pool.query(
            `
            SELECT 
                 current_database() AS database,
                 current_user AS user,
                 NOW() AS server_time
            
            `
        )

        console.log("Database connection successful:", result.rows[0]);
        console.log(result.rows[0]);
    } catch (error) {
        console.error("Database connection failed:", error);
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }

        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

await checkDatabaseConnection();
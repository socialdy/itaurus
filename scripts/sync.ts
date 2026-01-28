import { syncAllFreshservice } from "../server/sync-freshservice";

async function runSync() {
    console.log("Starting Freshservice Sync...");
    try {
        const result = await syncAllFreshservice();
        if (result.ok) {
            console.log("Sync completed successfully.");
            console.log(JSON.stringify(result.results, null, 2));
        } else {
            console.error("Sync failed with errors:");
            console.error(JSON.stringify(result.results, null, 2));
        }
    } catch (error) {
        console.error("Critical error during sync execution:", error);
    }
}

runSync();

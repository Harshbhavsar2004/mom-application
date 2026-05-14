const syncService = require("../services/syncService");

/**
 * Parses request body for Catalyst functions
 */
async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
  });
}

/**
 * Controller for Managing Sync Settings and Cron Triggers
 */

// 1. Get Sync Settings
exports.getSettings = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "user_id required" }));
    }

    const datastore = app.datastore();
    const table = datastore.table("SyncSettings");
    const rows = await table.getAllRows();

    const userSettings = rows.find(r => String(r.userId) === String(userId)) || {
      userId,
      frequency: "off",
      lastSync: 0
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(userSettings));
  } catch (err) {
    console.error("Get Settings Error:", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

// 2. Update Sync Settings
exports.updateSettings = async (req, res, app) => {
  try {
    const rawBody = await readBody(req);
    const { userId, frequency } = JSON.parse(rawBody);

    if (!userId || !frequency) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "userId and frequency required" }));
    }

    const datastore = app.datastore();
    const table = datastore.table("SyncSettings");
    const rows = await table.getAllRows();

    const existingRow = rows.find(r => String(r.userId) === String(userId));

    if (existingRow) {
      await table.updateRow({
        ROWID: existingRow.ROWID,
        frequency: frequency
      });
    } else {
      await table.insertRow({
        userId: String(userId),
        frequency: frequency,
        lastSync: 0
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, frequency }));
  } catch (err) {
    console.error("Update Settings Error:", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

// 3. Cron Handler (Background Task)
exports.handleCronTrigger = async (req, res, app) => {
  console.log("--- [Cron] Automated Sync Triggered ---");
  const report = { startedAt: new Date().toISOString(), processed: 0, errors: [] };

  try {
    const datastore = app.datastore();
    const table = datastore.table("SyncSettings");
    const settings = await table.getAllRows();

    const now = Date.now();

    for (const userSetting of settings) {
      const { userId, frequency, lastSync, ROWID } = userSetting;
      if (frequency === "off") continue;

      let shouldSync = false;
      const hoursSinceLast = (now - parseInt(lastSync || 0)) / (1000 * 60 * 60);

      if (frequency === "hourly" && hoursSinceLast >= 0.9) shouldSync = true;
      if (frequency === "daily" && hoursSinceLast >= 23.5) shouldSync = true;

      if (shouldSync) {
        try {
          console.log(`[Cron] Syncing for user: ${userId}`);
          await syncService.executeMasterSync(app, userId);
          
          await table.updateRow({
            ROWID: ROWID,
            lastSync: now
          });
          report.processed++;
        } catch (err) {
          console.error(`[Cron] Sync failed for ${userId}:`, err.message);
          report.errors.push({ userId, error: err.message });
        }
      }
    }

    console.log(`--- [Cron] Automated Sync Finished. Processed: ${report.processed} ---`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(report));
  } catch (err) {
    console.error("[Cron] Fatal Error:", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

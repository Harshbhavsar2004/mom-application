require("dotenv").config();
const axios = require("axios");
const { getZohoDC } = require("./zohoDC");

exports.downloadAllTranscripts = async (req, res, app) => {
  console.log("==== [DOWNLOAD TRANSCRIPTS START] ====");

  try {
    /* Step 1: Get user_id */
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    console.log("User:", userId);

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "user_id missing" }));
      return;
    }

    /* Step 2: Get Zoho token + DC */
    const { tokenRow, MEETING_DOMAIN } = await getZohoDC(app, userId);

    const accessToken = tokenRow.access_token;
    const zsoid = tokenRow.zsoid;

    if (!accessToken || !zsoid) {
      throw new Error("Access token or zsoid missing");
    }

    console.log("Meeting Domain:", MEETING_DOMAIN);

    /* Step 3: Fetch recordings from DataStore (stored metadata) */
    const datastore = app.datastore();
    const table = datastore.table("Recordings");
    const rows = await table.getAllRows();

    const userRecordings = rows.filter(
      (r) => String(r.userId) === String(userId),
    );
    console.log("Total stored recordings for user:", userRecordings.length);

    const stratus = app.stratus();
    const bucket = stratus.bucket("transcripts");

    let downloaded = 0;

    /* Step 4: Download transcripts and upload to Stratus */
    for (const rec of userRecordings) {
      // Skip if already has one or no URL
      if (rec.stratusFileName) continue;
      if (!rec.transcriptionDownloadUrl) continue;

      try {
        console.log(`[Sync] Downloading: ${rec.topic} (${rec.erecordingId})`);

        const response = await axios.get(rec.transcriptionDownloadUrl, {
          responseType: "arraybuffer", // Important for Stratus upload
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        });

        const stratusFilePath = `${userId}/${rec.erecordingId}.txt`;

        console.log(`[Stratus] Uploading to: ${stratusFilePath}`);

        await bucket.putObject(
          stratusFilePath,
          response.data, // Buffer from axios
          {
            overwrite: true,
            contentType: "text/plain",
          },
        );

        /* Step 5: Update DataStore record */
        try {
          await table.updateRow({
            ROWID: rec.ROWID,
            stratusFileName: stratusFilePath,
          });
          console.log("Saved to Stratus and Updated DB:", rec.erecordingId);
        } catch (dbErr) {
          console.error(
            `[DB Error] Could not update stratusFileName for ${rec.erecordingId}. Ensure the column exists in Recordings table.`,
          );
          console.error(dbErr.message);
        }

        downloaded++;
      } catch (err) {
        console.error(
          "Download failed for:",
          rec.erecordingId,
          err.response?.data?.toString() || err.message,
        );
      }
    }

    console.log("Newly Synced files:", downloaded);
    console.log("==== [DOWNLOAD/SYNC COMPLETE] ====");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "success",
        syncedCount: downloaded,
      }),
    );
  } catch (err) {
    console.error("Sync Error:", err.message);

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "error",
        message: err.message,
      }),
    );
  }
};

const axios = require("axios");
const { getZohoDC } = require("../controllers/zohoDC");

/**
 * Centralized Sync Service to handle both manual and automated synchronization
 */
exports.executeMasterSync = async (app, userId) => {
  console.log(`--- [SyncService] Master Sync Started for User: ${userId} ---`);
  
  try {
    const datastore = app.datastore();
    const stratus = app.stratus();
    const bucket = stratus.bucket("transcripts");
    
    // 1. Get Zoho DC and Credentials
    const { tokenRow, MEETING_DOMAIN } = await getZohoDC(app, userId);
    const accessToken = tokenRow.access_token;
    let zsoid = tokenRow.zsoid;

    if (!zsoid) {
      console.log("[SyncService] zsoid missing, fetching from Zoho...");
      const userUrl = `${MEETING_DOMAIN}/api/v2/user.json`;
      const userResponse = await axios.get(userUrl, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
      });
      zsoid = userResponse.data.userDetails?.zsoid;
      if (!zsoid) throw new Error("Could not retrieve zsoid");
      
      await datastore.table("ZohoTokens").updateRow({
        ROWID: tokenRow.ROWID,
        zsoid: zsoid
      });
    }

    // 2. Fetch Recordings from Zoho
    console.log("[SyncService] Fetching Zoho recordings...");
    const recordingsUrl = `${MEETING_DOMAIN}/meeting/api/v2/${zsoid}/recordings.json`;
    const zohoResponse = await axios.get(recordingsUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
    });
    const recordings = zohoResponse.data.recordings || [];
    console.log(`[SyncService] Found ${recordings.length} recordings in Zoho`);

    // 3. Save Metadata to DataStore
    console.log("[SyncService] Syncing metadata to DataStore...");
    const recTable = datastore.table("Recordings");
    const existingRows = await recTable.getAllRows();
    const existingIds = new Set(
      existingRows
        .filter(r => String(r.userId) === String(userId))
        .map(r => r.erecordingId)
    );

    for (let rec of recordings) {
      if (!rec.transcriptionDownloadUrl) continue;
      if (existingIds.has(rec.erecordingId)) continue;

      await recTable.insertRow({
        userId: String(userId),
        erecordingId: rec.erecordingId,
        topic: rec.topic || "",
        sDate: rec.sDate || "",
        durationInMins: rec.durationInMins || 0,
        transcriptionDownloadUrl: rec.transcriptionDownloadUrl,
        meetingKey: rec.meetingKey || ""
      });
    }

    // 4. Syc Transcripts to Stratus
    console.log("[SyncService] Offloading transcripts to Stratus...");
    // Refresh rows after insertion
    const currentRows = await recTable.getAllRows();
    const userRecs = currentRows.filter(r => String(r.userId) === String(userId));
    
    let syncedCount = 0;
    for (const rec of userRecs) {
      if (rec.stratusFileName || !rec.transcriptionDownloadUrl) continue;

      try {
        const transcriptRes = await axios.get(rec.transcriptionDownloadUrl, {
          responseType: "arraybuffer",
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
        });

        const stratusFilePath = `${userId}/${rec.erecordingId}.txt`;
        await bucket.putObject(stratusFilePath, transcriptRes.data, {
          overwrite: true,
          contentType: "text/plain"
        });

        await recTable.updateRow({
          ROWID: rec.ROWID,
          stratusFileName: stratusFilePath
        });
        syncedCount++;
      } catch (err) {
        console.error(`[SyncService] Failed to sync transcript for ${rec.erecordingId}:`, err.message);
      }
    }

    console.log(`--- [SyncService] Master Sync Completed. Synced: ${syncedCount} ---`);
    return { success: true, syncedCount };

  } catch (err) {
    console.error(`--- [SyncService] Master Sync Failed ---`);
    console.error(err.message);
    throw err;
  }
};

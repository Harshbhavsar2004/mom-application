

exports.saveRecordings = async (req, res, app) => {
  try {
    const datastore = app.datastore();
    const table = datastore.table("Recordings");

    let body = {};
    try {
      const rawBody = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk.toString();
        });
        req.on("end", () => resolve(data));
        req.on("error", (err) => reject(err));
      });
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      console.log("Body parse error:", e);
    }

    const { recordings, userId } = body;

    if (!recordings || !userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        status: "error",
        message: "recordings and userId required",
        receivedBody: body // Adding this for better debugging if it still fails
      }));
    }

    // Get existing rows for duplicate check
    const existingRows = await table.getAllRows();

    const existingIds = new Set(
      existingRows
        .filter(r => String(r.userId) === String(userId))
        .map(r => r.erecordingId)
    );

    let inserted = 0;

    for (let rec of recordings) {
      if (!rec.transcriptionDownloadUrl) continue;
      if (existingIds.has(rec.erecordingId)) continue;

      await table.insertRow({
        userId: String(userId),
        erecordingId: rec.erecordingId,
        topic: rec.topic || "",
        sDate: rec.sDate || "",
        durationInMins: rec.durationInMins || 0,
        transcriptionDownloadUrl: rec.transcriptionDownloadUrl,
        meetingKey: rec.meetingKey || ""
      });

      inserted++;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "success",
      insertedCount: inserted
    }));

  } catch (error) {
    console.error("Save Recordings Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "error",
      message: error.message
    }));
  }
};


exports.getStoredRecordings = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        status: "error",
        message: "user_id missing"
      }));
    }

    const datastore = app.datastore();
    const table = datastore.table("Recordings");

    const rows = await table.getAllRows();

    const recordings = rows
      .filter(r => String(r.userId) === String(userId))
      .sort((a, b) => b.ROWID - a.ROWID)
      .map(r => ({
        topic: r.topic,
        sDate: r.sDate,
        durationInMins: r.durationInMins,
        transcriptionDownloadUrl: r.transcriptionDownloadUrl,
        meetingKey: r.meetingKey,
        erecordingId: r.erecordingId,
        stratusFileName: r.stratusFileName || null
      }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "success",
      recordings
    }));

  } catch (err) {
    console.error("Fetch Stored Recordings Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "error",
      message: err.toString()
    }));
  }
};


/* =====================================================
   (DEPRECATED) UPLOAD TRANSCRIPT TO STRATUS
   Replaced by backend-to-backend sync in downloadTranscripts.js
===================================================== */

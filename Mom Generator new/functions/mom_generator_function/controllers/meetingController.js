require("dotenv").config();
const axios = require("axios");
const { getZohoDC } = require("./zohoDC")

/**
 * Get All Recordings
 * /recordings?user_id=XXX
 */
exports.getMeetings = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.end("user_id missing");
      return;
    }

    const { tokenRow, MEETING_DOMAIN } = await getZohoDC(app, userId);
    let zsoid = tokenRow.zsoid;

    // ---------------------------------------------------------
    // 1. If zsoid is missing, fetch it from Zoho User API
    // ---------------------------------------------------------
    if (!zsoid) {
      console.log("zsoid missing. Fetching from Zoho User API...");

      const userResponse = await axios.get(`${MEETING_DOMAIN}/api/v2/user.json`, {
        headers: { Authorization: `Zoho-oauthtoken ${tokenRow.access_token}` }
      });

      zsoid = userResponse.data.userDetails?.zsoid;

      if (!zsoid) {
        throw new Error("Could not retrieve zsoid from Zoho API.");
      }

      // 2. Persist zsoid to Datastore for future use
      const datastore = app.datastore();
      const table = datastore.table("ZohoTokens");
      await table.updateRow({
        ROWID: tokenRow.ROWID,
        zsoid: zsoid
      });

      console.log("zsoid updated in Datastore:", zsoid);
    }

    // ---------------------------------------------------------
    // 3. Proceed to call the Meetings API
    // ---------------------------------------------------------
    const response = await axios.get(
      `${MEETING_DOMAIN}/api/v2/${zsoid}/sessions.json`,
      {
        headers: { Authorization: `Zoho-oauthtoken ${tokenRow.access_token}` },
      }
    );

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response.data));

  } catch (err) {
    console.error("Meeting Fetch Error:", err.response?.data || err.message);
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(JSON.stringify(err.response?.data || { message: err.message }));
  }
};

exports.checkConnection = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "error", message: "user_id missing" }));
    }

    // getZohoDC will verify connection AND handle auto-refresh if needed
    const { tokenRow } = await getZohoDC(app, userId);

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      connected: true,
      expires_at: tokenRow.expires_at
    }));

  } catch (err) {
    console.log("Check Connection Status: Disconnected (", err.message, ")");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ connected: false }));
  }
};

/**
 * Create a new meeting in Zoho
 */
exports.createMeeting = async (req, res, app) => {
  try {
    // 1. Robust Body parsing
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => { data += chunk.toString(); });
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    const { userId, topic, agenda, startTime, duration, participants, timezone } = JSON.parse(rawBody);

    if (!userId || !topic || !startTime) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "error", message: "userId, topic, and startTime are required" }));
    }

    // 2. Get Zoho Tokens & User Details (zsoid and zuid)
    const { tokenRow, MEETING_DOMAIN } = await getZohoDC(app, userId);
    
    // We always fetch the latest details to ensure we have the correct ZUID (presenter)
    const userResponse = await axios.get(`${MEETING_DOMAIN}/api/v2/user.json`, {
      headers: { Authorization: `Zoho-oauthtoken ${tokenRow.access_token}` }
    });
    // Removed raw console.log for cleaner output
    const zsoid = userResponse.data.userDetails?.zsoid;
    const zuid = userResponse.data.userDetails?.zuid; // This is the REAL ZUID

    console.log("Zoho User Profile - zsoid:", zsoid, "zuid:", zuid, "Original userId:", userId);

    if (!zsoid || !zuid) {
      throw new Error("Could not retrieve Zoho profile (zsoid/zuid).");
    }

    // Optional: Sync zsoid to datastore if it was missing or different
    if (tokenRow.zsoid !== zsoid) {
       const datastore = app.datastore();
       const table = datastore.table("ZohoTokens");
       await table.updateRow({ ROWID: tokenRow.ROWID, zsoid: zsoid });
    }

    // 3. Construct Zoho API payload
    // Zoho expects participants as [{email: '...'}]
    const zohoParticipants = participants?.map(p => ({ email: typeof p === 'string' ? p : p.email })) || [];

    const payload = {
      session: {
        topic: topic,
        agenda: agenda || "",
        presenter: zuid, // Use the fetched ZUID, which may differ from userId
        startTime: startTime, // Format should be "MMM dd, yyyy hh:mm a" e.g "Jun 19, 2020 07:00 PM"
        duration: duration ? parseInt(duration) * 60000 : 3600000, // min to ms
        timezone: timezone || "Asia/Calcutta",
        participants: zohoParticipants
      }
    };

    console.log("Creating Zoho Meeting with payload:", JSON.stringify(payload));

    const response = await axios.post(
      `${MEETING_DOMAIN}/api/v2/${zsoid}/sessions.json`,
      payload,
      {
        headers: { 
          "Authorization": `Zoho-oauthtoken ${tokenRow.access_token}`,
          "Content-Type": "application/json"
        },
      }
    );

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "success",
      meeting: response.data.session
    }));

  } catch (err) {
    console.error("Create Meeting Error:", err.response?.data || err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "error", 
      message: err.response?.data?.message || err.message,
      details: err.response?.data
    }));
  }
};

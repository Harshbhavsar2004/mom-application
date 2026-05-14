require("dotenv").config();
const axios = require("axios");

const CLIENT_ID = process.env.CLIENT_ID;

// DC specific secrets
const CLIENT_SECRETS = {
  in: process.env.CLIENT_SECRET_IN,
  us: process.env.CLIENT_SECRET_US,
};

// Redirect URI
const REDIRECT_URI = process.env.REDIRECT_URI;

// IMPORTANT: Always use .com for Multi-DC login
const AUTH_DOMAIN = "https://accounts.zoho.com";

/**
 * Step 1: Redirect to Zoho OAuth (Multi-DC)
 */
exports.connect = async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");

    const scope =
      "ZohoMeeting.meeting.READ,ZohoMeeting.meeting.CREATE,ZohoMeeting.recording.READ,ZohoMeeting.manageOrg.READ,ZohoMeeting.meetinguds.READ,ZohoFiles.files.READ,ZohoSheet.dataAPI.READ,ZohoSheet.dataAPI.UPDATE";

    const authUrl =
      `${AUTH_DOMAIN}/oauth/v2/auth?scope=${scope}` +
      `&client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&access_type=offline` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(userId)}`;

    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (err) {
    console.error("Connect Error:", err.message);
    res.end("Connect Error");
  }
};

/**
 * Step 2: OAuth Callback (Multi-DC aware)
 */
exports.callback = async (req, res, app) => {
  console.log("===== OAuth Callback Hit =====");

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    console.log("Incoming Query:", Object.fromEntries(urlObj.searchParams));

    const code = urlObj.searchParams.get("code");
    const userId = urlObj.searchParams.get("state");

    // Multi-DC location from Zoho
    const location = urlObj.searchParams.get("location") || "us"; // default US

    if (!code || !userId) {
      res.end("Invalid OAuth response");
      return;
    }

    console.log("User DC:", location);

    // Select correct token domain
    const tokenDomain =
      location === "in"
        ? "https://accounts.zoho.in"
        : "https://accounts.zoho.com";

    const CLIENT_SECRET = CLIENT_SECRETS[location];

    if (!CLIENT_SECRET) {
      throw new Error(`Client secret not configured for DC: ${location}`);
    }

    console.log("Using Token Domain:", tokenDomain);

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      `${tokenDomain}/oauth/v2/token`,
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code,
        },
      }
    );

    console.log("Zoho Token API Status:", tokenResponse.status);
    console.log("Token Response:", tokenResponse.data);

    const data = tokenResponse.data;
    // Robust detection: Zoho usually returns ms (3,600,000) but sometimes seconds (3600).
    // If it's less than 10,000, it's almost certainly seconds.
    const expiresInMs = data.expires_in < 10000 ? data.expires_in * 1000 : data.expires_in;
    const expiresAt = Date.now() + expiresInMs;

    // Save to Catalyst
    const datastore = app.datastore();
    const table = datastore.table("ZohoTokens");

    const rows = await table.getAllRows();
    const existing = rows.find(
      (r) => String(r.user_id) === String(userId)
    );

    const rowData = {
      user_id: String(userId),
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      api_domain: data.api_domain, // IMPORTANT for future APIs
      expires_at: expiresAt,
      dc: location,
      zsoid: existing?.zsoid || null,
    };

    if (existing) {
      console.log("Updating existing user...");
      await table.updateRow({
        ROWID: existing.ROWID,
        ...rowData,
      });
    } else {
      console.log("Saving new user...");
      await table.insertRow(rowData);
    }

    // Redirect to frontend
    const frontendUrl = `${process.env.FRONTEND_URL}/#/dashboard?connected=true`;

    res.writeHead(302, { Location: frontendUrl });
    res.end();
  } catch (err) {
    console.log("===== OAuth ERROR =====");

    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Zoho Error:", err.response.data);
    }

    res.end(
      JSON.stringify(err.response?.data || { message: err.message }, null, 2)
    );
  }
};
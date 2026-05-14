const { google } = require("googleapis");
const catalyst = require("zcatalyst-sdk-node");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI.replace(
  "/callback",
  "/google-callback",
);

/**
 * Step 1: Redirect to Google OAuth
 */
exports.googleConnect = async (req, res) => {
  try {
    const urlObj = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );
    const userId = urlObj.searchParams.get("user_id");

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI,
    );

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: userId,
      prompt: "consent",
    });

    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (err) {
    console.error("Google Connect Error:", err.message);
    res.end("Google Connect Error");
  }
};

/**
 * Step 2: OAuth Callback
 */
exports.googleCallback = async (req, res, app) => {
  console.log("===== Google OAuth Callback Hit =====");
  try {
    const urlObj = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );
    const code = urlObj.searchParams.get("code");
    const userId = urlObj.searchParams.get("state");

    if (!code || !userId) {
      res.end("Invalid OAuth response");
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);
    console.log("Google Tokens Reserved:", tokens);

    // Save to Catalyst
    const datastore = app.datastore();
    const table = datastore.table("GoogleTokens");

    const rows = await table.getAllRows();
    const existing = rows.find((r) => String(r.user_id) === String(userId));

    const rowData = {
      user_id: String(userId),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existing?.refresh_token,
      expiry_date: tokens.expiry_date,
    };

    if (existing) {
      console.log("Updating existing Google user...");
      await table.updateRow({
        ROWID: existing.ROWID,
        ...rowData,
      });
    } else {
      console.log("Saving new Google user...");
      await table.insertRow(rowData);
    }

    const frontendUrl = `${process.env.FRONTEND_URL}/#/dashboard?google_connected=true`;
    res.writeHead(302, { Location: frontendUrl });
    res.end();
  } catch (err) {
    console.error("Google Callback Error:", err.message);
    res.end("Google Callback Error");
  }
};

/**
 * Utility: Get OAuth2 Client with auto-refresh
 */
exports.getOAuth2Client = async (app, userId) => {
  const datastore = app.datastore();
  const table = datastore.table("GoogleTokens");
  const rows = await table.getAllRows();

  const tokenRow = rows.find((r) => String(r.user_id) === String(userId));

  if (!tokenRow) {
    console.error("Token row not found for user:", userId);
    throw new Error("User not connected to Google Sheets");
  }

  console.log("Token found. Expiry (Unix):", tokenRow.expiry_date);

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: parseInt(tokenRow.expiry_date),
  });

  // Check if token is expired (or about to expire in 5 mins)
  const buffer = 5 * 60 * 1000;
  const isExpired = Date.now() + buffer > parseInt(tokenRow.expiry_date);
  console.log("Current Time + 5min Buffer:", Date.now() + buffer);
  console.log("Is Token Expired?:", isExpired);

  if (isExpired) {
    console.log("Refreshing Google token...");
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log("Token refreshed successfully. New Expiry:", credentials.expiry_date);

      await table.updateRow({
        ROWID: tokenRow.ROWID,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      });
      console.log("Update database with new token.");

      oauth2Client.setCredentials(credentials);
    } catch (refreshErr) {
      console.error("Failed to refresh Google token:", refreshErr.message);
      throw refreshErr;
    }
  }

  return oauth2Client;
};

/**
 * Step 3: Check Google Connection
 */
exports.checkGoogleConnection = async (req, res, app) => {
  try {
    const urlObj = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`,
    );
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ connected: false, error: "user_id missing" }),
      );
    }

    const oauth2Client = await exports.getOAuth2Client(app, userId);
    const credentials = oauth2Client.credentials;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        connected: true,
        expiry_date: credentials.expiry_date,
      }),
    );
  } catch (err) {
    const errMsg = err.message || String(err);
    console.log("Google Connection Status: Disconnected (", errMsg, ")");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ connected: false, error: errMsg }));
  }
};

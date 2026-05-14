require("dotenv").config();
const axios = require("axios");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET_IN = process.env.CLIENT_SECRET_IN;
const CLIENT_SECRET_US = process.env.CLIENT_SECRET_US;

/**
 * Get Zoho DC details for a user and handle automatic token refresh
 */
exports.getZohoDC = async (app, userId) => {
  const datastore = app.datastore();
  const table = datastore.table("ZohoTokens");
  const rows = await table.getAllRows();

  let tokenRow = rows.find(
    (r) => String(r.user_id) === String(userId)
  );

  if (!tokenRow) {
    throw new Error("User not connected to Zoho");
  }

  const apiDomain = tokenRow.api_domain;
  if (!apiDomain) {
    throw new Error("api_domain missing in DB");
  }

  let AUTH_DOMAIN = "";
  let MEETING_DOMAIN = "";
  let SHEET_DOMAIN = "";
  let CLIENT_SECRET = "";
  let dc = "";

  if (apiDomain.includes(".in")) {
    dc = "IN";
    AUTH_DOMAIN = "https://accounts.zoho.in";
    MEETING_DOMAIN = "https://meeting.zoho.in";
    SHEET_DOMAIN = "https://sheet.zoho.in";
    CLIENT_SECRET = CLIENT_SECRET_IN;
  }
  else {
    dc = "US";
    AUTH_DOMAIN = "https://accounts.zoho.com";
    MEETING_DOMAIN = "https://meeting.zoho.com";
    SHEET_DOMAIN = "https://sheet.zoho.com";
    CLIENT_SECRET = CLIENT_SECRET_US;
  }

  // ---------------------------------------------------------
  // Token Refresh Logic
  // ---------------------------------------------------------
  const now = Date.now();
  const expiresAt = parseInt(tokenRow.expires_at);
  const buffer = 5 * 60 * 1000; // 5 minutes buffer

  if (now + buffer > expiresAt) {
    console.log(`Token for user ${userId} expired or expiring soon. Refreshing...`);

    try {
      const refreshResponse = await axios.post(
        `${AUTH_DOMAIN}/oauth/v2/token`,
        null,
        {
          params: {
            grant_type: "refresh_token",
            refresh_token: tokenRow.refresh_token,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
          }
        }
      );

      const data = refreshResponse.data;
      if (data.access_token) {
        // Robust detection: Zoho usually returns ms (3,600,000) but sometimes seconds (3600).
        const expiresInMs = data.expires_in < 10000 ? data.expires_in * 1000 : data.expires_in;
        const newExpiresAt = Date.now() + expiresInMs;

        console.log("Token refreshed successfully.");

        // Update DataStore
        await table.updateRow({
          ROWID: tokenRow.ROWID,
          access_token: data.access_token,
          expires_at: newExpiresAt
        });

        // Update local tokenRow object for immediate use
        tokenRow.access_token = data.access_token;
        tokenRow.expires_at = newExpiresAt;
      } else {
        console.error("Refresh failed:", data);
        throw new Error("Failed to refresh Zoho access token: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error("Refresh Token Error:", err.response?.data || err.message);
      // If refresh fails, we might still want to return the old token and let the actual API call fail
      // or we can throw. Throwing is safer to avoid confusing error messages.
      throw new Error("Zoho session expired and could not be refreshed. Please reconnect.");
    }
  }

  return {
    tokenRow,
    AUTH_DOMAIN,
    MEETING_DOMAIN,
    SHEET_DOMAIN,
    CLIENT_SECRET,
    CLIENT_ID,
    dc
  };
};
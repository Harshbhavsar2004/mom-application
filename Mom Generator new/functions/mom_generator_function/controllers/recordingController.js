require("dotenv").config();
const axios = require("axios");
const { getZohoDC } = require("./zohoDC");

exports.getRecordings = async (req, res, app) => {
  console.log("==== [GET RECORDINGS API CALLED] ====");

  try {
    /* --------------------------------------------------
       Step 1: Parse user_id
    -------------------------------------------------- */
    console.log("[Step 1] Parsing request URL...");
    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const userId = urlObj.searchParams.get("user_id");
    console.log("User ID:", userId);

    if (!userId) {
      console.error("[Error] user_id missing");
      res.end("user_id missing");
      return;
    }

    /* --------------------------------------------------
       Step 2: Fetch Zoho DC + Token
    -------------------------------------------------- */
    console.log("[Step 2] Fetching Zoho DC and token...");
    const { tokenRow, MEETING_DOMAIN } = await getZohoDC(app, userId);

    if (!tokenRow) {
      throw new Error("Token row not found in datastore");
    }

    console.log("Meeting Domain:", MEETING_DOMAIN);
    console.log("Token fetched successfully");

    let zsoid = tokenRow.zsoid;
    const accessToken = tokenRow.access_token;

    if (!accessToken) {
      throw new Error("Access token missing");
    }

    /* --------------------------------------------------
       Step 3: Check / Fetch zsoid
    -------------------------------------------------- */
    if (!zsoid) {
      console.warn("[Step 3] zsoid missing. Fetching from Zoho User API...");

      const userUrl = `${MEETING_DOMAIN}/api/v2/user.json`;
      console.log("Calling:", userUrl);

      const userResponse = await axios.get(userUrl, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
      });

      console.log("User API response received");

      zsoid = userResponse.data.userDetails?.zsoid;

      if (!zsoid) {
        throw new Error("Could not retrieve zsoid from Zoho response");
      }

      console.log("zsoid fetched:", zsoid);

      /* Update datastore */
      console.log("[Step 4] Updating zsoid in datastore...");
      const datastore = app.datastore();
      await datastore.table("ZohoTokens").updateRow({
        ROWID: tokenRow.ROWID,
        zsoid: zsoid
      });

      console.log("Datastore updated with zsoid");
    } else {
      console.log("[Step 3] zsoid already exists:", zsoid);
    }

    /* --------------------------------------------------
       Step 5: Call Recordings API
    -------------------------------------------------- */
    const recordingsUrl = `${MEETING_DOMAIN}/meeting/api/v2/${zsoid}/recordings.json`;
    console.log(recordingsUrl)
    console.log("[Step 5] Calling Recordings API:");
    console.log(recordingsUrl);

    const response = await axios.get(recordingsUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    console.log("[Step 6] Recordings API Success");
    console.log("Recordings count:", response.data?.recordings?.length || 0);

    /* --------------------------------------------------
       Step 6: Send Response
    -------------------------------------------------- */
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response.data));

    console.log("==== [GET RECORDINGS COMPLETED SUCCESSFULLY] ====");

  } catch (err) {
    console.error("==== [GET RECORDINGS FAILED] ====");
    console.error("Error Step Info:");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(err.response?.data || { message: err.message }));
  }
};
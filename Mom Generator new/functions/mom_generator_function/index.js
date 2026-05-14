const catalyst = require("zcatalyst-sdk-node");

/* Controllers */
const zohoAuth = require("./controllers/zohoAuthController");
const meetingController = require("./controllers/meetingController");
const recordingController = require("./controllers/recordingController");
const recordingStoreController = require("./controllers/recordingStoreController");
const momController = require("./controllers/momController");
const downloadController = require("./controllers/downloadTranscripts");
const participantController = require("./controllers/participantController");
const googleAuth = require("./controllers/googleAuthController");
const googleSheetController = require("./controllers/googleSheetController");
const automationController = require("./controllers/automationController");
const syncService = require("./services/syncService");

module.exports = async (req, res) => {
  try {
    const allowedOrigins = [
      "http://localhost:3000/",
      "https://mom-generator-60065948077.development.catalystserverless.in",
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      return res.end();
    }

    const app = catalyst.initialize(req);
    const url = req.url || "";

    console.log("Incoming URL:", url, "Method:", req.method);

    /* ==================================================
       ZOHO AUTH
    ================================================== */

    if (url.startsWith("/connect") && req.method === "GET") {
      return zohoAuth.connect(req, res);
    }

    if (url.startsWith("/callback") && req.method === "GET") {
      return zohoAuth.callback(req, res, app);
    }

    /* ==================================================
       GOOGLE AUTH
    ================================================== */

    if (url.startsWith("/google-connect") && req.method === "GET") {
      return googleAuth.googleConnect(req, res);
    }

    if (url.startsWith("/google-callback") && req.method === "GET") {
      return googleAuth.googleCallback(req, res, app);
    }

    if (url.startsWith("/check-google-connection") && req.method === "GET") {
      return googleAuth.checkGoogleConnection(req, res, app);
    }

    /* ==================================================
       CONNECTION CHECK
    ================================================== */

    if (url.startsWith("/checkConnection") && req.method === "GET") {
      return meetingController.checkConnection(req, res, app);
    }

    /* ==================================================
       MEETINGS
    ================================================== */

    if (url.startsWith("/create-meeting") && req.method === "POST") {
      return meetingController.createMeeting(req, res, app);
    }

    if (url.startsWith("/meetings") && req.method === "GET") {
      return meetingController.getMeetings(req, res, app);
    }

    /* ==================================================
       ZOHO RECORDINGS (Fetch from Zoho)
    ================================================== */

    if (url.startsWith("/recordings") && req.method === "GET") {
      return recordingController.getRecordings(req, res, app);
    }

    /* ==================================================
       DATASTORE RECORDINGS
    ================================================== */

    if (url.startsWith("/saveRecordings") && req.method === "POST") {
      return recordingStoreController.saveRecordings(req, res, app);
    }

    if (url.startsWith("/getStoredRecordings") && req.method === "GET") {
      return recordingStoreController.getStoredRecordings(req, res, app);
    }

    if (url.startsWith("/downloadAllTranscripts") && req.method === "GET") {
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const userId = urlObj.searchParams.get("user_id");
      
      syncService.executeMasterSync(app, userId)
        .then(result => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "success", syncedCount: result.syncedCount }));
        })
        .catch(err => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: err.message }));
        });
      return;
    }

    /* ==================================================
       AUTOMATION & CRON
    ================================================== */

    if (url.startsWith("/sync-settings") && req.method === "GET") {
      return automationController.getSettings(req, res, app);
    }

    if (url.startsWith("/sync-settings") && req.method === "POST") {
      return automationController.updateSettings(req, res, app);
    }

    if (url.startsWith("/cron/sync") && req.method === "GET") {
      return automationController.handleCronTrigger(req, res, app);
    }

    /* ==================================================
       TEAMS & PARTICIPANTS
    ================================================== */
    if (url.startsWith("/getTeams") && req.method === "GET") {
      return participantController.getTeams(req, res, app);
    }
    if (url.startsWith("/createTeam") && req.method === "POST") {
      return participantController.createTeam(req, res, app);
    }
    if (url.startsWith("/updateTeam") && req.method === "POST") {
      return participantController.updateTeam(req, res, app);
    }
    if (url.startsWith("/deleteTeam") && req.method === "DELETE") {
      return participantController.deleteTeam(req, res, app);
    }
    /* ==================================================
       GENERATE MOM (Stratus → Gemini)
    ================================================== */

    if (url.startsWith("/generate-minutes") && req.method === "POST") {
      return momController.generateMinutes(req, res, app);
    }

    /* ==================================================
       GENERATE MOM (Stratus → Gemini)
    ================================================== */

    if (url.startsWith("/generate-minutes") && req.method === "POST") {
      return momController.generateMinutes(req, res, app);
    }

    /* ==================================================
       GOOGLE SHEET
    ================================================== */

    if (url.startsWith("/google-workbooks") && req.method === "GET") {
      return googleSheetController.listWorkbooks(req, res, app);
    }

    if (url.startsWith("/google-drive-list") && req.method === "GET") {
      return googleSheetController.listDriveSheets(req, res, app);
    }

    if (url.startsWith("/google-manage-sheet") && req.method === "POST") {
      return googleSheetController.toggleManagedSheet(req, res, app);
    }

    if (url.startsWith("/google-create-workbook") && req.method === "POST") {
      return googleSheetController.createWorkbook(req, res, app);
    }

    if (url.startsWith("/google-sheet-mom") && req.method === "POST") {
      return googleSheetController.populateMoM(req, res, app);
    }

    /* ==================================================
       HEALTH CHECK / DEFAULT
    ================================================== */

    if (url === "/" || url === "") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("MOM Generator API Running");
    }

    /* ==================================================
       404
    ================================================== */

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  } catch (err) {
    console.error("Index Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server Error" }));
  }
};

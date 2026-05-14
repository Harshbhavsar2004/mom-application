const { google } = require("googleapis");
const { getOAuth2Client } = require("./googleAuthController");

/**
 * 1. List Managed Spreadsheets (from Datastore)
 */
exports.listWorkbooks = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "user_id required" }));
    }

    const datastore = app.datastore();
    const table = datastore.table("ManagedGoogleSheets");
    const rows = await table.getAllRows();

    const workbooks = rows
      .filter((r) => String(r.user_id) === String(userId))
      .map((r) => ({
        id: r.sheet_id,
        name: r.sheet_name,
        rowId: r.ROWID,
      }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ workbooks }));
  } catch (err) {
    console.error("Google List Managed Error:", err);
    const errMsg = err.message || String(err);
    // If table doesn't exist yet, return empty list instead of error
    if (errMsg.includes("No such resource")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ workbooks: [] }));
    }
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: errMsg }));
  }
};

/**
 * 2. List All Spreadsheets from Google Drive
 */
exports.listDriveSheets = async (req, res, app) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const userId = urlObj.searchParams.get("user_id");

    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "user_id required" }));
    }

    const auth = await getOAuth2Client(app, userId);
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: "files(id, name, modifiedTime, webViewLink)",
      pageSize: 50,
      orderBy: "modifiedTime desc",
    });

    const files = response.data.files.map((f) => ({
      id: f.id,
      name: f.name,
      modified: f.modifiedTime,
      url: f.webViewLink,
    }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ files }));
  } catch (err) {
    console.error("Google Drive List Error:", err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
};

/**
 * 3. Add/Remove Sheet from Managed List
 */
exports.toggleManagedSheet = async (req, res, app) => {
  try {
    const rawBody = await readBody(req);
    const { userId, sheetId, sheetName, action } = JSON.parse(rawBody);

    if (!userId || !sheetId) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "userId and sheetId required" }));
    }

    const datastore = app.datastore();
    const table = datastore.table("ManagedGoogleSheets");

    if (action === "add") {
      try {
        const rows = await table.getAllRows();
        const exists = rows.find(
          (r) => String(r.user_id) === String(userId) && r.sheet_id === sheetId,
        );

        if (!exists) {
          await table.insertRow({
            user_id: String(userId),
            sheet_id: sheetId,
            sheet_name: sheetName,
          });
        }
      } catch (err) {
        if (err.message.includes("No such resource")) {
          // Create table implicitly by trying to insert if allowed?
          // No, Catalyst usually requires table creation via CLI/Console.
          // But we can throw a clearer message.
          throw new Error(
            "Datastore table 'ManagedGoogleSheets' not found. Please create it in the Catalyst Console.",
          );
        }
        throw err;
      }
    } else {
      try {
        const rows = await table.getAllRows();
        const target = rows.find(
          (r) => String(r.user_id) === String(userId) && r.sheet_id === sheetId,
        );
        if (target) {
          await table.deleteRow(target.ROWID);
        }
      } catch (err) {
        if (err.message.includes("No such resource")) return; // Nothing to delete
        throw err;
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "success" }));
  } catch (err) {
    const errMsg = err.message || String(err);
    console.error("Google Toggle Managed Error:", errMsg);
    if (errMsg.includes("No such resource")) {
      res.writeHead(500);
      return res.end(
        JSON.stringify({
          error: "ManagedGoogleSheets table missing in Datastore.",
        }),
      );
    }
    res.writeHead(500);
    res.end(JSON.stringify({ error: errMsg }));
  }
};

/**
 * 2. Create Spreadsheet
 */
exports.createWorkbook = async (req, res, app) => {
  try {
    const rawBody = await readBody(req);
    const { userId, name } = JSON.parse(rawBody);

    if (!userId) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "userId required" }));
    }

    const auth = await getOAuth2Client(app, userId);
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: name || `MoM_${Date.now()}`,
        },
      },
    });

    const sheetId = spreadsheet.data.spreadsheetId;
    const sheetName = spreadsheet.data.properties.title;

    // Auto-add to managed sheets
    const datastore = app.datastore();
    const table = datastore.table("ManagedGoogleSheets");
    await table.insertRow({
      user_id: String(userId),
      sheet_id: sheetId,
      sheet_name: sheetName,
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "success",
        resourceId: sheetId,
        workbookUrl: spreadsheet.data.spreadsheetUrl,
        name: sheetName,
      }),
    );
  } catch (err) {
    console.error("Google Create Error:", err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

/**
 * 3. Populate MoM using Template Copy & Precise Mapping
 */
exports.populateMoM = async (req, res, app) => {
  try {
    const rawBody = await readBody(req);
    const { userId, workbookId, meetingDate, meetingDetails, momData } =
      JSON.parse(rawBody);
    console.log("--- Google Populate MoM Started (Integrated) ---");
    console.log("User ID:", userId);
    console.log("Workbook ID:", workbookId);
    console.log("Meeting Date:", meetingDate);

    const templateId = process.env.GOOGLE_MOM_TEMPLATE_ID;
    console.log("Template ID from Env:", templateId);

    if (!templateId || templateId === "your_template_id_here") {
      throw new Error("GOOGLE_MOM_TEMPLATE_ID not configured in .env");
    }

    if (!userId || !workbookId || !momData) {
      console.error("Missing userId, workbookId or momData");
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "userId, workbookId and momData required" }));
    }

    const auth = await getOAuth2Client(app, userId);
    const sheets = google.sheets({ version: "v4", auth });

    // 1. Get Template Spreadsheet Metadata to find the first sheet ID
    const templateMeta = await sheets.spreadsheets.get({ spreadsheetId: templateId });
    const firstSheetId = templateMeta.data.sheets[0].properties.sheetId;

    // 2. Copy Template Sheet to Target Workbook
    console.log("Copying template sheet to targeting workbook...");
    const copyResponse = await sheets.spreadsheets.sheets.copyTo({
      spreadsheetId: templateId,
      sheetId: firstSheetId,
      requestBody: {
        destinationSpreadsheetId: workbookId,
      },
    });

    const newSheetId = copyResponse.data.sheetId;
    console.log("Template sheet copied. New Sheet ID:", newSheetId);

    // 3. Rename the new sheet and Update values
    console.log("Checking for unique sheet title...");
    
    // Fetch destination workbook metadata to check for title collisions
    const destMeta = await sheets.spreadsheets.get({ spreadsheetId: workbookId });
    const existingTitles = destMeta.data.sheets.map(s => s.properties.title);
    
    let baseTitle = meetingDate || `MoM_${Date.now()}`;
    let newSheetTitle = baseTitle;
    
    if (existingTitles.includes(newSheetTitle)) {
      const now = new Date();
      const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      newSheetTitle = `${baseTitle} (${timestamp})`;
      console.log(`Title collision detected. Renaming to: ${newSheetTitle}`);
    }

    console.log("Updating sheet title and population data...");
    // Format Date to dd/mm/yyyy
    let formattedDate = meetingDate || "";
    if (formattedDate.includes("-")) {
      const parts = formattedDate.split("-"); // YYYY-MM-DD
      if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Header Section (C2:C6)
    const headerData = [
      [momData.header?.topic || meetingDetails?.topic || ""], // C2
      [meetingDetails?.location || ""], // C3
      [(momData.header?.attendees || []).join(", ")], // C4
      [formattedDate], // C5
      [meetingDetails?.time || ""], // C6
    ];

    // Agenda Section (Columns B and C)
    const rawAgenda = momData.agendaItems || [];
    const agendaRows = rawAgenda.map((item, i) => ({
        values: [
            { userEnteredValue: { stringValue: String(i + 1) } }, // Column B (Numbering)
            { userEnteredValue: { stringValue: typeof item === "string" ? item : item.summary || item.topic || "" } } // Column C (Text)
        ]
    }));

    // Discussion Section (Columns B and C)
    const rawDiscussion = momData.keyDiscussionPoints || [];
    const discussionRows = rawDiscussion.map((pt, i) => ({
        values: [
            { userEnteredValue: { stringValue: String(i + 1) } }, // Column B (Numbering)
            { userEnteredValue: { stringValue: typeof pt === "string" ? pt : pt.decision || String(pt) } } // Column C (Text)
        ]
    }));

    console.log("Prepared Mappings:");
    console.log("- Header Data:", JSON.stringify(headerData));
    console.log("- Agenda Rows Count:", agendaRows.length);
    console.log("- Discussion Rows Count:", discussionRows.length);

    // Build BatchUpdate requests
    const requests = [
      // 1. Rename the copied sheet
      {
        updateSheetProperties: {
          properties: {
            sheetId: newSheetId,
            title: newSheetTitle,
          },
          fields: "title",
        },
      },
      // 2. Populate Headers (C2:C6, start index 1:2)
      {
        updateCells: {
          range: { sheetId: newSheetId, startRowIndex: 1, endRowIndex: 6, startColumnIndex: 2, endColumnIndex: 3 },
          rows: headerData.map(val => ({ values: [{ userEnteredValue: { stringValue: val[0] } }] })),
          fields: "userEnteredValue",
        },
      },
      // 3. Populate Agenda (B8 and C8 downward)
      {
        updateCells: {
          range: { sheetId: newSheetId, startRowIndex: 7, endRowIndex: 7 + agendaRows.length, startColumnIndex: 1, endColumnIndex: 3 },
          rows: agendaRows,
          fields: "userEnteredValue",
        },
      },
      // 4. Populate Discussion (B20 and C20 downward)
      {
        updateCells: {
          range: { sheetId: newSheetId, startRowIndex: 19, endRowIndex: 19 + discussionRows.length, startColumnIndex: 1, endColumnIndex: 3 },
          rows: discussionRows,
          fields: "userEnteredValue",
        },
      },
      // 5. Populate Conclusion (C28)
      {
        updateCells: {
          range: { sheetId: newSheetId, startRowIndex: 27, endRowIndex: 28, startColumnIndex: 2, endColumnIndex: 3 },
          rows: [[momData.conclusion || momData.executiveSummary || ""]].map(val => ({ values: [{ userEnteredValue: { stringValue: val[0] } }] })),
          fields: "userEnteredValue",
        },
      },
    ];

    // 6. Strategic Deletion: Remove empty rows to "tighten" the template
    // We do this from BOTTOM to TOP so indices don't shift during processing.
    
    // Discussion Cleanup: Template has 6 rows (20-25). 
    if (discussionRows.length < 6) {
        requests.push({
            deleteDimension: {
                range: {
                    sheetId: newSheetId,
                    dimension: "ROWS",
                    startIndex: 19 + discussionRows.length,
                    endIndex: 25 // Original end of Discussion block
                }
            }
        });
    }

    // Agenda Cleanup: Template has 10 rows (8-17).
    if (agendaRows.length < 10) {
        requests.push({
            deleteDimension: {
                range: {
                    sheetId: newSheetId,
                    dimension: "ROWS",
                    startIndex: 7 + agendaRows.length,
                    endIndex: 17 // Original end of Agenda block
                }
            }
        });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: workbookId,
      resource: { requests },
    });
    // 4. Register this new sheet as "Managed" so it appears in the list
    try {
      console.log("Registering sheet in ManagedGoogleSheets...");
      const datastore = app.datastore();
      const table = datastore.table("ManagedGoogleSheets");
      await table.insertRow({
        user_id: String(userId),
        sheet_id: newSheetId,
        sheet_name: newSheetTitle,
      });
      console.log("Sheet registered successfully.");
    } catch (dsErr) {
      console.warn(
        "Could not register session in ManagedGoogleSheets:",
        dsErr.message,
      );
      // Non-blocking for the export success
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "success",
        resourceId: workbookId,
        sheetId: newSheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${workbookId}/edit#gid=${newSheetId}`,
        name: newSheetTitle,
      }),
    );
  } catch (err) {
    const errMsg = err.message || String(err);
    console.error("Google Populate MoM Error:", errMsg);
    res.writeHead(500);
    res.end(JSON.stringify({ error: errMsg }));
  }
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

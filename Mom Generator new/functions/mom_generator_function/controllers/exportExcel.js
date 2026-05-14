const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");

/**
 * Lists all available Excel templates in the templates directory.
 */
exports.getTemplates = async (req, res, app) => {
  try {
    const templatesDir = path.join(__dirname, "../templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir);
    }

    const files = fs.readdirSync(templatesDir);
    const templates = files
      .filter(file => file.endsWith(".xlsx") || file.endsWith(".xls"))
      .map(file => ({
        name: file,
        displayName: file.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        path: file
      }));

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "success", templates }));
  } catch (err) {
    console.error("Get Templates Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error", message: err.message }));
  }
};

/**
 * Exports MOM data to Excel, supporting both default logic and custom templates.
 */
exports.exportExcel = async (req, res, app) => {
  try {
    // Handle both JSON body (POST) or multipart if needed later
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk.toString();
      });
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    const { minutes, meetingTitle, meetingDate, templateName } = JSON.parse(rawBody);

    let wb;

    if (templateName) {
      const templatePath = path.join(__dirname, "../templates", templateName);
      if (fs.existsSync(templatePath)) {
        // Load existing template
        wb = XLSX.readFile(templatePath);
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Simple Placeholder Injection (Case Insensitive)
        // Note: This is a basic implementation. Robust injection usually requires 
        // iterating through cells or using specialized libraries like exceljs.
        // For 'xlsx' library, we'll do a simple key-value replacement if we find exact matches
        const data = {
          "{{topic}}": meetingTitle || "",
          "{{date}}": meetingDate || "",
          "{{summary}}": minutes.executiveSummary || minutes.summary || "",
          "{{attendees}}": minutes.header?.attendees?.join(", ") || "",
          "{{agenda}}": (minutes.agendaItems || []).map(a => `${a.topic}: ${a.summary}`).join("\n") || "",
          "{{decisions}}": (minutes.decisions || []).map(d => `- ${d.decision}`).join("\n") || "",
          "{{action_items}}": (minutes.actionItems || []).map(ai => `- ${ai.task} (Owner: ${ai.owner}, Due: ${ai.deadline})`).join("\n") || ""
        };

        // Inject into cells
        Object.keys(ws).forEach(cell => {
          if (cell[0] === '!') return;
          if (ws[cell].v && typeof ws[cell].v === 'string') {
            Object.keys(data).forEach(key => {
              if (ws[cell].v.includes(key)) {
                ws[cell].v = ws[cell].v.replace(key, data[key]);
              }
            });
          }
        });

        // For Action Items/Decisions, we might need to append if specific rows exist
        // This is template-dependent. For now, we'll keep it simple.
      }
    }

    // If no template or loading failed, use default logic
    if (!wb) {
      wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["Meeting Minutes"],
        ["Title", meetingTitle],
        ["Date", meetingDate],
        [],
        ["Executive Summary"],
        [minutes.executiveSummary || minutes.summary || ""],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Action Items
      if (minutes.actionItems?.length > 0) {
        const actionData = [["Task", "Owner", "Deadline"]];
        minutes.actionItems.forEach(item => {
          actionData.push([item.task || item, item.owner || "TBD", item.deadline || "TBD"]);
        });
        const actionSheet = XLSX.utils.aoa_to_sheet(actionData);
        actionSheet["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, actionSheet, "Action Items");
      }
    }

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    res.writeHead(200, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="MOM-${meetingTitle}-${meetingDate}.xlsx"`
    });
    res.end(excelBuffer);

  } catch (err) {
    console.error("Export Excel Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error", message: err.message }));
  }
};

/**
 * Saves a custom template created from the Frontend UI.
 */
exports.saveTemplate = async (req, res, app) => {
  try {
    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk.toString();
      });
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    const { name, grid } = JSON.parse(rawBody);
    if (!name || !grid) {
      throw new Error("Template name and grid data are required");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MOM Template');

    // Fill the grid
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          worksheet.getRow(r + 1).getCell(c + 1).value = cell;
        }
      });
    });

    // Save to templates directory
    const templatesDir = path.join(__dirname, "../templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir);
    }

    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeName}.xlsx`;
    const filePath = path.join(templatesDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "success",
      message: "Template saved successfully",
      fileName: fileName
    }));

  } catch (err) {
    console.error("Save Template Error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error", message: err.message }));
  }
};

const Busboy = require("busboy");

module.exports = {
  getSpeakers: async (catalystApp, res, req) => {
    try {
      const datastore = catalystApp.datastore();
      const table = datastore.table("Speakers");
      
      // Get user ID from header or catalyst context
      let creatorId = req?.headers?.['x-user-id'];
      if (!creatorId) {
        try {
          const currentUser = await catalystApp.userManagement().getCurrentUser();
          creatorId = currentUser.userId;
        } catch (e) {
          console.error("Error getting current user:", e.message);
        }
      }

      if (!creatorId) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: "User not authenticated" }));
        return;
      }

      // Query rows where CREATORID matches current user (Normal method)
      const allRows = await table.getAllRows();
      const rows = allRows.filter(s => String(s.CREATORID) === String(creatorId));
      
      // Generate download URLs for each speaker with an image
      const stratus = catalystApp.stratus();
      const bucket = stratus.bucket("profile-pictures");
      
      const speakersWithUrls = await Promise.all(rows.map(async (speaker) => {
        if (speaker.imageUrl && !speaker.imageUrl.startsWith('http')) {
          try {
            const presignedUrlRes = await bucket.generatePreSignedUrl(speaker.imageUrl, 'GET');
            return { ...speaker, imageUrl: presignedUrlRes.signature || speaker.imageUrl };
          } catch (urlErr) {
            console.error(`Error generating sign url for ${speaker.imageUrl}:`, urlErr.message);
          }
        }
        return speaker;
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", data: speakersWithUrls }));
    } catch (err) {
      console.error("[getSpeakers] Error:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
  },

  createSpeaker: async (catalystApp, req, res) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let fileName = null;
    let contentType = null;

    // Get user ID from header or catalyst context
    let creatorId = req.headers['x-user-id'];
    if (!creatorId) {
      try {
        const currentUser = await catalystApp.userManagement().getCurrentUser();
        creatorId = currentUser.userId;
      } catch (e) {
        console.error("Error getting creator on upload:", e.message);
      }
    }

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      console.log(`[SpeakerUpload] New file detected: ${filename} (Mime: ${mimeType})`);
      fileName = filename;
      contentType = mimeType;
      const chunks = [];

      file.on("data", (data) => {
        chunks.push(data);
      });

      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
        console.log(`[SpeakerUpload] File buffered successfully, total size: ${fileBuffer.length} bytes`);
      });
    });

    busboy.on("field", (name, val) => {
      console.log(`[SpeakerUpload] Field received: ${name} = ${val}`);
      fields[name] = val;
    });

    busboy.on("finish", async () => {
      console.log("[SpeakerUpload] Busboy finished parsing, starting backend process...");
      try {
        let imageUrl = "";

        if (fileBuffer) {
          console.log("[SpeakerUpload] Starting Stratus upload...");
          const stratus = catalystApp.stratus();
          const bucket = stratus.bucket("profile-pictures");

          const objectName = `${Date.now()}_${fileName}`;

          await bucket.putObject(objectName, fileBuffer, {
            contentType: contentType,
          });
          
          console.log(`[SpeakerUpload] Successfully uploaded to Stratus: ${objectName}`);
          imageUrl = objectName;
        } else {
          console.log("[SpeakerUpload] No file buffer found, skipping Stratus upload.");
        }

        console.log("[SpeakerUpload] Saving metadata to Datastore...");
        const datastore = catalystApp.datastore();
        const table = datastore.table("Speakers");

        const rowData = {
          name: fields.name,
          role: fields.role,
          email: fields.email,
          company: fields.company,
          imageUrl: imageUrl || fields.imageUrl,
          CREATORID: creatorId || ""
        };

        console.log("[SpeakerUpload] Row data to insert:", JSON.stringify(rowData));
        const insertedRow = await table.insertRow(rowData);
        console.log("[SpeakerUpload] Successfully saved to Datastore. ROWID:", insertedRow.ROWID);

        // Generate download URL for the newly created speaker if they have an image
        if (insertedRow.imageUrl && !insertedRow.imageUrl.startsWith('http')) {
            const stratus = catalystApp.stratus();
            const bucket = stratus.bucket("profile-pictures");
            try {
                const presignedUrlRes = await bucket.generatePreSignedUrl(insertedRow.imageUrl, 'GET');
                insertedRow.imageUrl = presignedUrlRes.signature || insertedRow.imageUrl;
            } catch (urlErr) {
                console.error("[SpeakerUpload] Error generating download URL for new speaker:", urlErr.message);
            }
        }

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            data: insertedRow,
          }),
        );
      } catch (err) {
        console.error("[SpeakerUpload] CRITICAL ERROR:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            message: err.message,
          }),
        );
      }
    });

    req.pipe(busboy);
  },

  updateSpeaker: async (catalystApp, id, data, res, req) => {
    try {
      const datastore = catalystApp.datastore();
      const table = datastore.table("Speakers");

      // Get user ID from header or catalyst context
      let creatorId = req.headers['x-user-id'];
      if (!creatorId) {
        try {
          const currentUser = await catalystApp.userManagement().getCurrentUser();
          creatorId = currentUser.userId;
        } catch (e) { }
      }

      if (creatorId) {
        const existingRow = await table.getRow(id);
        if (existingRow.CREATORID && String(existingRow.CREATORID) !== String(creatorId)) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: "You do not have permission to update this record" }));
          return;
        }
      }

      const rowData = { ROWID: id, ...data };
      await table.updateRow(rowData);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "success", message: "Updated successfully" }),
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
  },

  deleteSpeaker: async (catalystApp, id, res, req) => {
    try {
      const datastore = catalystApp.datastore();
      const table = datastore.table("Speakers");

      // Get user ID from header or catalyst context
      let creatorId = req.headers['x-user-id'];
      if (!creatorId) {
        try {
          const currentUser = await catalystApp.userManagement().getCurrentUser();
          creatorId = currentUser.userId;
        } catch (e) { }
      }

      if (creatorId) {
        const existingRow = await table.getRow(id);
        if (existingRow.CREATORID && String(existingRow.CREATORID) !== String(creatorId)) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: "You do not have permission to delete this record" }));
          return;
        }
      }

      await table.deleteRow(id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "success", message: "Deleted successfully" }),
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
  },

  loginSpeaker: async (catalystApp, data, res) => {
    try {
      const { username, password } = data;
      if (!username || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status: "error", message: "Username and password required" }));
      }

      const datastore = catalystApp.datastore();
      const table = datastore.table("Speakers");
      
      const allSpeakers = await table.getAllRows();
      const speaker = allSpeakers.find(s => s.username === username && s.password === password);

      if (!speaker) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status: "error", message: "Invalid credentials" }));
      }

      // Return speaker details (excluding password)
      const { password: _, ...safeSpeaker } = speaker;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", data: safeSpeaker }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
  },

  getSpeakerAssets: async (catalystApp, visitId, res) => {
    try {
      const datastore = catalystApp.datastore();
      const visitTable = datastore.table("Visits");
      const visit = await visitTable.getRow(visitId);

      if (!visit) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ status: "error", message: "Visit not found" }));
      }

      let assets = [];
      try {
        assets = JSON.parse(visit.assets || "[]");
      } catch (e) { assets = []; }

      // Generate signed URLs for assets stored in Stratus
      const stratus = catalystApp.stratus();
      const bucket = stratus.bucket("speaker-assets");

      const assetsWithUrls = await Promise.all(assets.map(async (asset) => {
        if (asset.fileKey) {
          try {
            const presignedUrlRes = await bucket.generatePreSignedUrl(asset.fileKey, 'GET');
            return { ...asset, downloadUrl: presignedUrlRes.signature };
          } catch (e) {
            console.error(`Error signing asset ${asset.fileKey}:`, e.message);
          }
        }
        return asset;
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", data: assetsWithUrls }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: err.message }));
    }
  },

  uploadAsset: async (catalystApp, req, res) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let fileName = null;
    let contentType = null;
    const fields = {};

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      fileName = filename;
      contentType = mimeType;
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on("field", (name, val) => { fields[name] = val; });

    busboy.on("finish", async () => {
      try {
        if (!fileBuffer) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ status: "error", message: "No file uploaded" }));
        }

        const stratus = catalystApp.stratus();
        const bucket = stratus.bucket("speaker-assets");
        const objectName = `${Date.now()}_${fileName}`;

        await bucket.putObject(objectName, fileBuffer, { contentType });

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
          status: "success", 
          data: { 
            name: fileName, 
            fileKey: objectName, 
            type: contentType 
          } 
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
      }
    });

    req.pipe(busboy);
  }
};

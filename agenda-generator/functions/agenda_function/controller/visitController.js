const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toISOString().replace('T', ' ').split('.')[0];
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hbhavsar847@gmail.com',
        pass: 'axblmhaukczsirxw'
    }
});

module.exports = {
    getVisits: async (catalystApp, res, req) => {
        const datastore = catalystApp.datastore();
        const table = datastore.table('Visits');
        const stratus = catalystApp.stratus();
        const bucket = stratus.bucket("profile-pictures");
        
        // Get user ID from header or catalyst context
        let creatorId = req.headers['x-user-id'];
        if (!creatorId) {
            try {
                const currentUser = await catalystApp.userManagement().getCurrentUser();
                creatorId = currentUser.userId;
            } catch (e) {
                console.error("Error getting current user:", e.message);
            }
        }

        if (!creatorId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'User not authenticated' }));
            return;
        }

        // Query rows where CREATORID matches current user (Normal method)
        const allRows = await table.getAllRows();
        let rows = allRows.filter(v => String(v.CREATORID) === String(creatorId));

        // Refresh signed URLs for speakers in each visit
        rows = await Promise.all(rows.map(async (visit) => {
            if (visit.speakers) {
                try {
                    let speakers = JSON.parse(visit.speakers);
                    speakers = await Promise.all(speakers.map(async (s) => {
                        if (s.imageUrl) {
                            let key = s.imageUrl;
                            // If it's a URL, extract the path after hostname
                            if (s.imageUrl.startsWith('http')) {
                                try {
                                    const urlObj = new URL(s.imageUrl);
                                    // Remove /_signed/ if present, then take the remaining path
                                    key = urlObj.pathname.replace(/^\/(_signed\/)?/, '');
                                } catch (e) { }
                            }

                            // If key is a valid object key (not a hostname and not empty)
                            if (key && !key.startsWith('http') && !key.includes('.zohostratus.in')) {
                                try {
                                    const signRes = await bucket.generatePreSignedUrl(key, 'GET');
                                    return { ...s, imageUrl: signRes.signature || s.imageUrl };
                                } catch (e) { console.error("URL Sign error (visit list):", e.message); }
                            }
                        }
                        return s;
                    }));
                    return { ...visit, speakers: JSON.stringify(speakers) };
                } catch (e) {
                    console.error("Speaker parse error in visit list:", e.message);
                }
            }
            return visit;
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: rows }));
    },

    getVisitById: async (catalystApp, id, res) => {
        const datastore = catalystApp.datastore();
        const table = datastore.table('Visits');
        const stratus = catalystApp.stratus();
        const bucket = stratus.bucket("profile-pictures");

        const row = await table.getRow(id);
        
        // NOTE: We don't filter getVisitById by CREATORID to allow public share links to work.
        // The non-guessable ROWID serves as the security token for public access.

        if (row && row.speakers) {
            try {
                let speakers = JSON.parse(row.speakers);
                speakers = await Promise.all(speakers.map(async (s) => {
                    if (s.imageUrl) {
                        let key = s.imageUrl;
                        if (s.imageUrl.startsWith('http')) {
                            try {
                                const urlObj = new URL(s.imageUrl);
                                key = urlObj.pathname.replace(/^\/(_signed\/)?/, '');
                            } catch (e) { }
                        }
                        
                        if (key && !key.startsWith('http') && !key.includes('.zohostratus.in')) {
                            try {
                                const signRes = await bucket.generatePreSignedUrl(key, 'GET');
                                return { ...s, imageUrl: signRes.signature || s.imageUrl };
                            } catch (e) { 
                                console.error("URL Sign error (visit detail):", e.message);
                            }
                        }
                    }
                    return s;
                }));
                row.speakers = JSON.stringify(speakers);
            } catch (e) {
                console.error("Speaker parse error in visit detail:", e.message);
            }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: row }));
    },

    createVisit: async (catalystApp, data, res, req) => {
        const datastore = catalystApp.datastore();
        const table = datastore.table('Visits');
        
        // Get user ID from header or catalyst context
        let creatorId = req.headers['x-user-id'];
        if (!creatorId) {
            try {
                const currentUser = await catalystApp.userManagement().getCurrentUser();
                creatorId = currentUser.userId;
            } catch (e) {
                console.error("Error getting creator on create:", e.message);
            }
        }

        // Clean speakers to store only keys, not signed URLs
        let speakers = data.speakers || [];
        if (typeof speakers === 'string') try { speakers = JSON.parse(speakers); } catch(e) {}
        
        const cleanedSpeakers = (Array.isArray(speakers) ? speakers : []).map(s => {
            if (s.imageUrl && s.imageUrl.startsWith('http')) {
                try {
                    const urlObj = new URL(s.imageUrl);
                    const key = urlObj.pathname.replace(/^\/(_signed\/)?/, '');
                    // Verify it's not a hostname
                    if (key && !key.includes('.zohostratus.in')) {
                        return { ...s, imageUrl: key };
                    }
                } catch (e) { }
            }
            return s;
        });

        const rowData = {
            title: data.title,
            mode: data.mode,
            startDate: formatDate(data.startDate),
            endDate: formatDate(data.endDate),
            location: data.location,
            objective: data.objective,
            agenda: data.agenda ? JSON.stringify(data.agenda) : '{}',
            speakers: JSON.stringify(cleanedSpeakers),
            assets: data.assets ? JSON.stringify(data.assets) : '[]',
            CREATORID: creatorId || ""
        };

        const insertedRow = await table.insertRow(rowData);

        // --- End Speaker Processing ---

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: insertedRow }));
    },

    updateVisit: async (catalystApp, id, data, res, req) => {
        const datastore = catalystApp.datastore();
        const table = datastore.table('Visits');
        
        // Secure check: verify ownership
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
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'You do not have permission to update this record' }));
                return;
            }
        }

        const rowData = { ROWID: id };
        if (data.title) rowData.title = data.title;
        if (data.mode) rowData.mode = data.mode;
        if (data.startDate) rowData.startDate = formatDate(data.startDate);
        if (data.endDate) rowData.endDate = formatDate(data.endDate);
        if (data.location) rowData.location = data.location;
        if (data.objective) rowData.objective = data.objective;
        if (data.agenda) rowData.agenda = JSON.stringify(data.agenda);
        
        if (data.speakers) {
            let speakers = data.speakers;
            if (typeof speakers === 'string') try { speakers = JSON.parse(speakers); } catch(e) {}
            
            const cleanedSpeakers = (Array.isArray(speakers) ? speakers : []).map(s => {
                if (s.imageUrl && s.imageUrl.startsWith('http')) {
                    try {
                        const urlObj = new URL(s.imageUrl);
                        const key = urlObj.pathname.replace(/^\/(_signed\/)?/, '');
                        if (key && !key.includes('.zohostratus.in')) {
                            return { ...s, imageUrl: key };
                        }
                    } catch (e) { }
                }
                return s;
            });
            rowData.speakers = JSON.stringify(cleanedSpeakers);

            // --- Speaker Credential Generation & Notification (Using Nodemailer) ---
            console.log(`[EmailDebug-Nodemailer] Starting processing for visit ID: ${id}`);
            try {
                const speakerTable = datastore.table('Speakers');
                
                // Get existing visit to check who was already notified
                const existingVisit = await table.getRow(id);
                let previouslyNotifiedEmails = [];
                try {
                    const existingSpeakers = JSON.parse(existingVisit.speakers || '[]');
                    previouslyNotifiedEmails = existingSpeakers
                        .filter(s => s.notified === true)
                        .map(s => s.email);
                } catch (e) {
                    console.error("[EmailDebug-Nodemailer] Error parsing existing speakers:", e.message);
                }

                const notifiedSpeakers = [];
                for (const s of cleanedSpeakers) {
                    let isNotifiedThisTime = previouslyNotifiedEmails.includes(s.email);
                    
                    if (s.email && !isNotifiedThisTime) {
                        try {
                            // 1. Check/Generate credentials
                            const speakersList = await speakerTable.getAllRows();
                            const speakerRecord = speakersList.find(record => record.email === s.email);
                            
                            let username = speakerRecord?.username;
                            let password = speakerRecord?.password;

                            if (!username || !password) {
                                username = s.email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);
                                password = Math.random().toString(36).slice(-8);

                                if (speakerRecord) {
                                    await speakerTable.updateRow({
                                        ROWID: speakerRecord.ROWID, username, password
                                    });
                                }
                            }

                            // 2. Send email via Nodemailer
                            if (username && password) {
                                console.log(`[EmailDebug-Nodemailer] Sending to ${s.email}...`);
                                
                                const mailOptions = {
                                    from: '"Visit Agenda Application" <hbhavsar847@gmail.com>',
                                    to: s.email,
                                    subject: `Speaker Access: ${data.title || 'Briefing Update'}`,
                                    html: `
                                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                            <h2 style="color: #255AD8;">Welcome, ${s.name}!</h2>
                                            <p>You have been assigned as a speaker for an upcoming briefing.</p>
                                            <p>You can access your private data and provisioned assets using the following credentials:</p>
                                            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
                                                <p style="margin: 0; font-size: 16px;"><strong>Username:</strong> ${username}</p>
                                                <p style="margin: 10px 0 0; font-size: 16px;"><strong>Password:</strong> ${password}</p>
                                            </div>
                                            <p><strong>Briefing Link:</strong> <a href="${req.headers.origin}/#/share/${id}" style="color: #255AD8; text-decoration: none; font-weight: bold;">Click here to access</a></p>
                                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                                            <p style="font-size: 12px; color: #888;">This is an automated message from the Visit Agenda Application.</p>
                                        </div>
                                    `
                                };

                                const info = await transporter.sendMail(mailOptions);
                                console.log(`[EmailDebug-Nodemailer] Success for ${s.email}, MessageID: ${info.messageId}`);
                                isNotifiedThisTime = true;
                            }
                        } catch (sErr) {
                            console.error(`[EmailDebug-Nodemailer] Critical speaker error for ${s.email}:`, sErr.message);
                        }
                    }
                    notifiedSpeakers.push({ ...s, notified: isNotifiedThisTime });
                }
                // Update rowData with the speakers list that includes notified status
                rowData.speakers = JSON.stringify(notifiedSpeakers);

            } catch (err) {
                console.error("[EmailDebug-Nodemailer] Loop error:", err.message);
            }
        }
        
        if (data.assets) rowData.assets = JSON.stringify(data.assets);

        await table.updateRow(rowData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Updated successfully' }));
    },

    deleteVisit: async (catalystApp, id, res, req) => {
        const datastore = catalystApp.datastore();
        const table = datastore.table('Visits');

        // Secure check: verify ownership
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
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'You do not have permission to delete this record' }));
                return;
            }
        }

        await table.deleteRow(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Deleted successfully' }));
    }
};

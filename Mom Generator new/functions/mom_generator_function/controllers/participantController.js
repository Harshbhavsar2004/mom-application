

/**
 * Get all teams for a user, including their participants
 */
exports.getTeams = async (req, res, app) => {
    try {
        const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const userId = urlObj.searchParams.get("user_id");

        if (!userId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ status: "error", message: "user_id is required" }));
        }

        const datastore = app.datastore();
        const teamsTable = datastore.table("Teams");
        const participantsTable = datastore.table("Participants");

        // Fetch teams
        const teamRows = await teamsTable.getAllRows();
        const userTeams = teamRows.filter(r => String(r.userId) === String(userId));

        // Fetch participants
        const participantRows = await participantsTable.getAllRows();
        const userParticipants = participantRows.filter(r => String(r.userId) === String(userId));

        // Merge them
        const teams = userTeams.map(team => ({
            ...team,
            participants: userParticipants.filter(p => String(p.teamId) === String(team.ROWID))
        }));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", teams }));

    } catch (err) {
        console.error("Get Teams Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
    }
};

/**
 * Create a new team with optional participants
 */
exports.createTeam = async (req, res, app) => {
    try {
        const rawBody = await new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => {
                data += chunk.toString();
            });
            req.on("end", () => resolve(data));
            req.on("error", (err) => reject(err));
        });
        const body = JSON.parse(rawBody);
        const { userId, teamName, participants } = body;

        if (!userId || !teamName) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ status: "error", message: "userId and teamName are required" }));
        }

        const datastore = app.datastore();
        const teamsTable = datastore.table("Teams");
        const participantsTable = datastore.table("Participants");

        // Create Team
        const teamResult = await teamsTable.insertRow({
            userId: String(userId),
            teamName: teamName
        });

        const teamId = teamResult.ROWID;

        // Create Participants if any
        if (Array.isArray(participants) && participants.length > 0) {
            for (const p of participants) {
                await participantsTable.insertRow({
                    userId: String(userId),
                    teamId: String(teamId),
                    name: p.name,
                    email: p.email
                });
            }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success", teamId }));

    } catch (err) {
        console.error("Create Team Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
    }
};

/**
 * Update team name and its participants
 */
exports.updateTeam = async (req, res, app) => {
    try {
        const rawBody = await new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => {
                data += chunk.toString();
            });
            req.on("end", () => resolve(data));
            req.on("error", (err) => reject(err));
        });
        const body = JSON.parse(rawBody);
        const { userId, teamId, teamName, participants } = body;

        if (!teamId || !teamName) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ status: "error", message: "teamId and teamName are required" }));
        }

        const datastore = app.datastore();
        const teamsTable = datastore.table("Teams");
        const participantsTable = datastore.table("Participants");

        // Update Team Name
        await teamsTable.updateRow({
            ROWID: teamId,
            teamName: teamName
        });

        // Simple strategy for participants: Delete all existing for this team and re-insert
        // In a prod app, we'd do incremental updates, but this is cleaner for now
        const existingParts = await participantsTable.getAllRows();
        const teamParts = existingParts.filter(p => String(p.teamId) === String(teamId));

        for (const p of teamParts) {
            await participantsTable.deleteRow(p.ROWID);
        }

        if (Array.isArray(participants)) {
            for (const p of participants) {
                await participantsTable.insertRow({
                    userId: String(userId),
                    teamId: String(teamId),
                    name: p.name,
                    email: p.email
                });
            }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));

    } catch (err) {
        console.error("Update Team Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
    }
};

/**
 * Delete a team and its participants
 */
exports.deleteTeam = async (req, res, app) => {
    try {
        const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const teamId = urlObj.searchParams.get("team_id");

        if (!teamId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ status: "error", message: "team_id is required" }));
        }

        const datastore = app.datastore();
        const teamsTable = datastore.table("Teams");
        const participantsTable = datastore.table("Participants");

        // Delete Team
        await teamsTable.deleteRow(teamId);

        // Delete Participants
        const existingParts = await participantsTable.getAllRows();
        const teamParts = existingParts.filter(p => String(p.teamId) === String(teamId));

        for (const p of teamParts) {
            await participantsTable.deleteRow(p.ROWID);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));

    } catch (err) {
        console.error("Delete Team Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", message: err.message }));
    }
};

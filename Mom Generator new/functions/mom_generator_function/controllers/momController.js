const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function fetchTranscriptFromStratus(app, filePath) {
  try {
    console.log("Fetching transcript from Stratus:", filePath);

    const stratus = app.stratus();
    const bucket = stratus.bucket("transcripts");

    // Get file as stream
    const fileStream = await bucket.getObject(filePath);

    return new Promise((resolve, reject) => {
      let data = "";

      fileStream.on("data", (chunk) => {
        data += chunk.toString();
      });

      fileStream.on("end", () => {
        console.log("Transcript fetched. Length:", data.length);
        resolve(data);
      });

      fileStream.on("error", (err) => {
        console.error("Stratus read error:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Stratus fetch failed:", error);
    throw new Error("Transcript not found in Stratus");
  }
}
/* -------------------------------------------------- */
/* Extract speaker names automatically */
/* -------------------------------------------------- */
function extractSpeakers(transcript) {
  const speakerPattern = /^([A-Za-z\s]+):/gm;
  const speakers = new Set();
  let match;

  while ((match = speakerPattern.exec(transcript)) !== null) {
    const name = match[1].trim();
    if (name.length > 2 && name.length < 50) {
      speakers.add(name);
    }
  }

  return Array.from(speakers);
}

/* -------------------------------------------------- */
/* Generate Minutes using Gemini */
/* -------------------------------------------------- */
async function generateMinutesWithGemini(
  transcript,
  participants,
  meetingDate,
) {
  const participantsList =
    participants && participants.length > 0
      ? participants.map((p) => (typeof p === "string" ? p : p.name)).join(", ")
      : "Extract from transcript";

  const prompt = `
You are a highly precise Meeting Minutes Architect. Your goal is to transform the provided TRANSCRIPT into professional, actionable Meeting Minutes in a specific JSON format.

### CRITICAL CONSTRAINTS:
1. **TRANSCRIPT-ONLY**: You must ONLY use information explicitly mentioned in the transcript. Do NOT hallucinate names, dates, topics, or action items that do not exist in the text.
2. **SCOPE**: Do not use any external knowledge. If the transcript is brief, the minutes should be brief.
3. **PARTICIPANTS**: Use this list as a reference: ${participantsList}. If people are mentioned in the transcript who aren't in this list, add them to the output.
4. **FORMAT**: The output will be stored directly in a Zoho Sheet with specific sections. Follow the output structure exactly.

### OUTPUT STRUCTURE (JSON ONLY, no markdown, no extra text):
{
  "header": {
    "topic": "Meeting Title",
    "date": "${meetingDate}",
    "attendees": ["Name 1", "Name 2"]
  },
  "executiveSummary": "A 2-3 sentence overview of the meeting's primary objective and outcome.",
  "agendaItems": [
    "Agenda item as a short, clear sentence",
    "Another agenda item"
  ],
  "keyDiscussionPoints": [
    "Key point discussed during the meeting",
    "Another important discussion point"
  ],
  "conclusion": "A single paragraph summarizing the overall outcome, decisions made, and next steps agreed upon."
}

TRANSCRIPT:
${transcript}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Use the latest stable powerful model
    contents: prompt,
  });

  const text = response.text;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Gemini did not return valid JSON");
  }

  return JSON.parse(match[0]);
}

/* -------------------------------------------------- */
/* Catalyst Controller */
/* -------------------------------------------------- */
exports.generateMinutes = async (req, res, app) => {
  try {
    console.log("===== Generate Minutes Endpoint Hit =====");

    const rawBody = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk.toString();
      });
      req.on("end", () => resolve(data));
      req.on("error", (err) => reject(err));
    });

    const body = JSON.parse(rawBody);
    const {
      meetingId,
      participants,
      useAutomated,
      meetingDate,
      userId,
      transcriptionText, // Optional transcription text from frontend
    } = body;

    try {
      if (!userId || (!meetingId && !transcriptionText)) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({
            error:
              "userId and either meetingId or transcriptionText are required",
          }),
        );
      }

      let transcript = "";

      if (transcriptionText) {
        console.log("Using transcription text provided in request body");
        transcript = transcriptionText;
      } else {
        console.log("Generating MOM from Stratus");

        /* -------------------------------------------------- */
        /* Fetch Transcript from Stratus */
        /* -------------------------------------------------- */

        const stratusFilePath = `${userId}/${meetingId}.txt`;

        transcript = await fetchTranscriptFromStratus(app, stratusFilePath);
      }

      /* -------------------------------------------------- */
      /* Participants */
      /* -------------------------------------------------- */

      let finalParticipants = participants || [];

      if (useAutomated) {
        finalParticipants = extractSpeakers(transcript);
      }

      /* -------------------------------------------------- */
      /* Generate MOM */
      /* -------------------------------------------------- */

      const minutes = await generateMinutesWithGemini(
        transcript,
        finalParticipants,
        meetingDate,
      );
      console.log(minutes);
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(minutes));
    } catch (err) {
      console.error("Generate Minutes Error:", err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  } catch (error) {
    console.error("Generate Minutes Outer Error:", error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
};

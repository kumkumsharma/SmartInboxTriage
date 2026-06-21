import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it in the Secrets panel in AI Studio Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for triaging operations messages
app.post("/api/triage", async (req, res) => {
  try {
    const { text, splitPatterns } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Please input valid messages text to continue." });
    }

    // Determine custom split pattern or default
    // We support splitting by common separators like '---', '=====', '---' (with linebreaks), etc.
    // Also strip trailing/leading spaces, empty messages
    const patterns = splitPatterns || ["---", "====="];
    
    // Split text based on patterns
    // We build a dynamic regex from the patterns
    // Escaping regex special characters
    const escapedPatterns = patterns.map((p: string) => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
    const regex = new RegExp(`(?:${escapedPatterns.join("|")})`, "g");
    
    const rawSegments = text.split(regex);
    const messages = rawSegments
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (messages.length === 0) {
      return res.status(400).json({ error: "No non-empty messages found after splitting." });
    }

    const ai = getGeminiClient();

    // Call Gemini with the structured schema
    const prompt = `You are a professional operations triage assistant. 
Analyze the following ${messages.length} messages extracted from a bulk paste logs or operational channels.
For each message:
1. Classify urgency: High, Medium, or Low.
2. Provide a clear, short, realistic operational reasoning for the urgency classification (e.g., driver safety, system breakdown, financial invoice discrepancy, simple delivery confirmation).
3. Draft a highly professional, composed, polite, and direct response addressing the situation in a transport, logistics, or operational context.

Input Messages to analyze:
${messages.map((msg, index) => `[Message ID: ${index + 1}]\n${msg}`).join("\n\n---\n\n")}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert logistics, operations, and dispatch coordinator. Respond with pure JSON matching the requested responseSchema exactly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              description: "Array of triaged operational message results",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { 
                    type: Type.INTEGER,
                    description: "The 1-based index matching the order of input messages analyzed"
                  },
                  originalMessage: { 
                    type: Type.STRING,
                    description: "The original content of the message being analyzed"
                  },
                  urgency: { 
                    type: Type.STRING, 
                    description: "Must be strictly one of: High, Medium, Low" 
                  },
                  reason: { 
                    type: Type.STRING, 
                    description: "Reasoning for the urgency classification in 1-2 clear bullet points or crisp sentences" 
                  },
                  draftResponse: { 
                    type: Type.STRING, 
                    description: "Professional draft reply resolving or acknowledging the system event or driver query" 
                  }
                },
                required: ["id", "originalMessage", "urgency", "reason", "draftResponse"]
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from Gemini model.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json({
      success: true,
      results: parsedData.results || [],
      messageCount: messages.length
    });

  } catch (error: any) {
    console.error("Triage Error:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred during operations triage analysis." 
    });
  }
});

// Configure Vite or Static Files depending on the environment
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

init();

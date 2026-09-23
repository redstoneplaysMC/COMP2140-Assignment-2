import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { parsePresentMD } = require("./presentMDparser.cjs");
const { createIntermediateJSON, createFodpMain, createSlidesFormat } = require("./deckconverter.cjs");
import { generateAiSlide } from "./llm_server.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

app.post("/parse-md", (req, res) => {
    try {
        const parsed = parsePresentMD(req.body.markdown);
        res.json(parsed);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

app.post("/create-intermediate-json", (req, res) => {
    try {
        const intermediate = createIntermediateJSON(req.body.parsed);
        res.json(intermediate);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

app.post("/create-fodp", (req, res) => {
    try {
        const fodpOutput = createFodpMain(req.body.intermediate);
        res.json(fodpOutput);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

app.post("/create-slides-format", (req, res) => {
    try {
        const slideOutput = createSlidesFormat(req.body.intermediate, req.body.presentationId);
        res.json(slideOutput);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

app.post("/api/generate-presentation", async (req, res) => {
  try {
    const topic = req.body?.topic;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({
        error: "Topic is required",
      });
    }

    const markdown = await generateAiSlide(topic);
    res.json({ markdown });

  } catch (err) {
    console.error("Error generating presentation:", err);

    res.status(500).json({
      error: "Failed to generate presentation",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { parsePresentMD } = require("./presentMDparser.cjs");

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

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
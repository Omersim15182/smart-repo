import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleAgentMessage } from "./services/agentService.js";

dotenv.config();
const app = express();

app.use(cors(), express.json());

app.post("/agent", async (req, res) => {
  try {
    const response = await handleAgentMessage(req.body.message);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 server is running on port ${PORT}`));

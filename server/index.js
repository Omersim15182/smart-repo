import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import groqService from "./AI/groq.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to MCP server
const transport = new StdioClientTransport({
  command: "node",
  args: ["./mcp/mcpServer.js"],
});

const mcpClient = new Client({ name: "express-client", version: "1.0.0" });
await mcpClient.connect(transport);

app.post("/agent", async (req, res) => {
  const { message } = req.body;

  try {
    const intent = await groqService.extractIntent(message);
    console.log("Intent:", intent);

    let result;

    if (intent === "pipeline") {
      const { repo, branch, shouldFetchLogs } =
        await groqService.extractPipelineParams(message);
      result = await mcpClient.callTool({
        name: "get_pipeline_status",
        arguments: { repo, branch, shouldFetchLogs },
      });
    } else if (intent === "issue") {
      const { repo, title, body, labels } =
        await groqService.extractIssueParams(message);
      result = await mcpClient.callTool({
        name: "create_issue",
        arguments: { repo, title, body, labels },
      });
    } else {
      return res.json({
        success: false,
        data: "I didn't understand the request. Try asking to check a pipeline or create an issue.",
      });
    }

    res.json({ success: true, data: result.content[0].text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

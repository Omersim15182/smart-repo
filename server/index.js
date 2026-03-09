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

const transport = new StdioClientTransport({
  command: "node",
  args: ["./mcp/mcpServer.js"],
});

const mcpClient = new Client({ name: "express-client", version: "1.0.0" });
await mcpClient.connect(transport);

app.post("/agent", async (req, res) => {
  const { message } = req.body;

  try {
    const { type, content, toolCalls } =
      await groqService.getToolCalls(message);

    if (type === "text") {
      return res.json({ success: true, data: content, toolResults: [] });
    }

    const toolResults = await Promise.all(
      toolCalls.map(async ({ id, toolName, args }) => {
        console.log(`Calling tool: ${toolName}`, args);
        try {
          const result = await mcpClient.callTool({
            name: toolName,
            arguments: args,
          });
          return {
            id,
            toolName,
            args,
            result: result.content[0].text,
            error: null,
          };
        } catch (err) {
          return { id, toolName, args, result: null, error: err.message };
        }
      }),
    );

    res.json({ success: true, toolResults });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

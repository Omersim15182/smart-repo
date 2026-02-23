import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Connect to the real MCP Server
const transport = new StdioClientTransport({
  command: "node",
  args: ["mcpServer.js"], // Starts the other file as a process
});

const mcpClient = new Client(
  { name: "gemini-host", version: "1.0.0" },
  { capabilities: {} },
);
await mcpClient.connect(transport);

// 2. Discover tools from the server automatically
const { tools: mcpTools } = await mcpClient.listTools();

app.post("/mcp/chat", async (req, res) => {
  const { message } = req.body;

  try {
    if (!mcpClient.transport) await mcpClient.connect(transport);
    const { tools: mcpTools } = await mcpClient.listTools();

    const geminiFormattedTools = mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-3.0.0-flash",
      tools: [{ functionDeclarations: geminiFormattedTools }],
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(message);

    while (result.response.functionCalls()?.length > 0) {
      const calls = result.response.functionCalls();
      const functionResponses = [];

      for (const call of calls) {
        console.log(`Executing tool: ${call.name} with args:`, call.args);

        const toolResult = await mcpClient.callTool({
          name: call.name,
          arguments: call.args,
        });

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { content: toolResult.content[0].text },
          },
        });
      }

      result = await chat.sendMessage(functionResponses);
    }

    res.json({ success: true, response: result.response.text() });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () =>
  console.log("🚀 Bridge running at http://localhost:3001/mcp/chat"),
);

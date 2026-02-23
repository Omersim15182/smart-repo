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

    // --- FIX STARTS HERE ---
    // Map MCP "inputSchema" to Gemini "parameters"
    const geminiFormattedTools = mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema, // Gemini needs 'parameters', MCP provides 'inputSchema'
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: [{ functionDeclarations: geminiFormattedTools }],
    });
    // --- FIX ENDS HERE ---

    const chat = model.startChat();
    let result = await chat.sendMessage(message);
    let call = result.response.functionCalls()?.[0];

    if (call) {
      const toolResult = await mcpClient.callTool({
        name: call.name,
        arguments: call.args,
      });

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: { content: toolResult.content[0].text },
          },
        },
      ]);
    }

    res.json({ success: true, response: result.response.text() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () =>
  console.log("🚀 Bridge running at http://localhost:3001/mcp/chat"),
);

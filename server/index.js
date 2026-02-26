import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ override: true }); // This forces .env to win
const app = express();
app.use(express.json());

const rawKey = process.env.GROQ_API_KEY || "";
const cleanKey = rawKey
  .trim()
  .replace(/^<|>$ /g, "")
  .trim();

const groq = new Groq({ apiKey: cleanKey });
console.log("✅ Groq is connected");

// 1. Setup MCP Connection
const transport = new StdioClientTransport({
  command: "node",
  args: ["mcpServer.js"],
});

const mcpClient = new Client(
  { name: "groq-host", version: "1.0.0" },
  { capabilities: {} },
);

// Connect once at startup
await mcpClient.connect(transport);

app.post("/mcp/chat", async (req, res) => {
  console.log("Full Body:", req.body); // Check if this is {} or has data
  const { message } = req.body;
  try {
    // 2. Fetch tools only once per request
    const { tools: mcpTools } = await mcpClient.listTools();
    const formattedTools = mcpTools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));

    let messages = [
      {
        role: "system",
        content: "You are a helpful assistant with access to GitHub tools.",
      },
      { role: "user", content: message },
    ];

    // 3. Start Chat Loop
    let response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Replaced with a valid Groq model
      messages,
      tools: formattedTools,
      tool_choice: "auto",
    });

    let assistantMessage = response.choices[0].message;

    // 4. Fix: Handle tool_calls loop (Groq uses tool_calls, not function_call)
    while (assistantMessage.tool_calls) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`Executing tool: ${name}`);

        const toolResult = await mcpClient.callTool({
          name,
          arguments: args,
        });

        messages.push({
          role: "tool", // Role must be 'tool' for Groq/OpenAI
          tool_call_id: toolCall.id, // Must provide the ID
          content: toolResult.content[0].text,
        });
      }

      // Get next turn from Groq
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
      });
      assistantMessage = response.choices[0].message;
    }

    res.json({ success: true, response: assistantMessage.content });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () =>
  console.log("🚀 Bridge running at http://localhost:3001/mcp/chat"),
);

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./mcp/mcpServer.js"],
});

const mcpClient = new Client({ name: "smart-repo-client", version: "1.0.0" });

export const connectMCP = async () => {
  if (!mcpClient.isConnected) {
    await mcpClient.connect(transport);
  }
  return mcpClient;
};

export const callMcpTool = async (toolName, args) => {
  const client = await connectMCP();
  try {
    const { content } = await client.callTool({
      name: toolName,
      arguments: args,
    });

    const rawText = content[0].text;
    try {
      return JSON.parse(rawText);
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", rawText); // Log raw response
      throw new Error(`Invalid JSON response: ${rawText}`);
    }
  } catch (error) {
    console.error("Error calling MCP tool:", error.message); // Log error details
    throw new Error(`MCP tool call failed: ${error.message}`);
  }
};

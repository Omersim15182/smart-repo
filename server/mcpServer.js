import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. Initialize the Server
const server = new Server(
  {
    name: "github-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: { tools: {} },
  },
);

// 2. Register Tools (The MCP way)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_pipelines",
      description: "Get workflow runs for a GitHub repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
        },
        required: ["owner", "repo"],
      },
    },
  ],
}));

// 3. Handle Tool Execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "list_pipelines") {
    const { owner, repo } = request.params.arguments;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=3`;

    const response = await fetch(url, {
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
        : {},
    });
    const data = await response.json();

    return {
      content: [
        { type: "text", text: JSON.stringify(data.workflow_runs || []) },
      ],
    };
  }
  throw new Error("Tool not found");
});

// 4. Connect using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

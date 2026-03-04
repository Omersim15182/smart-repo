import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import toolSchemas from "./schema/schemaMcp.js";
import githubAPI from "./api/api.js";

// Create server instance
const server = new McpServer({
  name: "github-repo",
  version: "1.0.0",
});

server.registerTool(
  "get_pipeline_status",
  {
    description: "Get GitHub pipeline status for a repository and branch",
    inputSchema: toolSchemas.pipeline.shape,
  },
  async ({ repo, branch, shouldFetchLogs }) => {
    console.error("MCP received:", { repo, branch, shouldFetchLogs });
    console.error(
      "GITHUB_TOKEN:",
      process.env.GITHUB_TOKEN ? "✅ loaded" : "❌ missing",
    );

    const result = await githubAPI.getPipelineStatus(
      repo,
      branch,
      shouldFetchLogs,
    );
    console.error("GitHub result:", result);

    return {
      content: [{ type: "text", text: result }],
    };
  },
);

server.registerTool(
  "create_issue",
  {
    description: "Create a GitHub issue in a repository",
    inputSchema: toolSchemas.createIssue.shape,
  },
  async ({ repo, title, body, labels }) => {
    console.error("MCP received:", { repo, title, body, labels });
    console.error(
      "GITHUB_TOKEN:",
      process.env.GITHUB_TOKEN ? "✅ loaded" : "❌ missing",
    );

    const result = await githubAPI.createIssue(repo, { title, body, labels });
    console.error("GitHub result:", result);

    return {
      content: [{ type: "text", text: result }],
    };
  },
);
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("github MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import toolSchemas from "./schema/schemaMcp.js";
import githubAPI from "./api/api.js";

const server = new McpServer({
  name: "github-repo",
  version: "1.0.0",
});

server.registerTool(
  "get_latest_runs",
  {
    description: "Get the status of the latest pipeline runs for a repository.",
    inputSchema: toolSchemas.getLatestRuns.shape,
  },
  async (args) => {
    const result = await githubAPI.getLatestRuns(
      args.repo,
      args.limit,
      args.branch,
    );
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "get_status_by_commit",
  {
    description:
      "Search for a specific pipeline status using a commit message.",
    inputSchema: toolSchemas.getStatusByCommit.shape,
  },
  async (args) => {
    const result = await githubAPI.getStatusByCommit(args.repo, args.commit);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "get_failure_details",
  {
    description: "Deep dive into a failed pipeline to see specific error logs.",
    inputSchema: toolSchemas.getFailureDetails.shape,
  },
  async (args) => {
    const result = await githubAPI.getFailureDetailsByCommit(
      args.repo,
      args.commit,
    );
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "create_issue",
  {
    description: "Create a GitHub issue in a repository",
    inputSchema: toolSchemas.createIssue.shape,
  },
  async (args) => {
    const result = await githubAPI.createIssue(args.repo, args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
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

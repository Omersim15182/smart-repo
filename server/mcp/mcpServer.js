import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import toolSchemas from "./schema/schemaMcp.js";
import githubAPI from "./api/api.js";

console.error(
  "TOKEN CHECK:",
  process.env.GIT_TOKEN ? "Token exists" : "Token is MISSING",
);

const server = new McpServer({ name: "github-repo", version: "1.0.0" });

const wrap = (fn) => async (args) => {
  const result = await fn(args);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
};

server.registerTool(
  "get_latest_runs",
  {
    description: "Get the status of the latest pipeline runs for a repository.",
    inputSchema: toolSchemas.getLatestRuns.shape,
  },
  wrap((args) => githubAPI.getLatestRuns(args.repo, args.branch, args.limit)),
);

server.registerTool(
  "get_status_by_commit",
  {
    description:
      "Search for a specific pipeline status using a commit message.",
    inputSchema: toolSchemas.getStatusByCommit.shape,
  },
  wrap((args) => githubAPI.getStatusByCommit(args.repo, args.commit)),
);

server.registerTool(
  "get_failure_details",
  {
    description: "Deep dive into a failed pipeline to see specific error logs.",
    inputSchema: toolSchemas.getFailureDetails.shape,
  },
  wrap((args) => githubAPI.getFailureDetailsByCommit(args.repo, args.commit)),
);

server.registerTool(
  "create_issue",
  {
    description: "Create a GitHub issue in a repository",
    inputSchema: toolSchemas.createIssue.shape,
  },
  wrap((args) => githubAPI.createIssue(args.repo, args)),
);

server.registerTool(
  "compare_pipeline_run_times",
  {
    description:
      "Compare test run times of pipelines in GitHub and indicate when test times get slower.",
    inputSchema: toolSchemas.comparePipelineRunTimes.shape,
  },
  wrap((args) =>
    githubAPI.comparePipelineRunTimes(args.repo, args.branch, args.limit),
  ),
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

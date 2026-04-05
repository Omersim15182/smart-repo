import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import toolSchemas from "./schema/schemaMcp.js";
import githubAPI from "./api/api.js";

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
      "Compare test run times of pipelines in GitHub and identify regressions/slower tests.",
    inputSchema: toolSchemas.comparePipelineRunTimes.shape,
  },
  wrap((args) =>
    githubAPI.comparePipelineRunTimes(
      args.repo,
      args.branch,
      args.limit,
      args.targetTestName,
    ),
  ),
);

server.registerTool(
  "get_pull_request_diff",
  {
    description: "Get the raw diff of a Pull Request to analyze code changes.",
    inputSchema: toolSchemas.getPullRequestDiff.shape,
  },
  wrap((args) => githubAPI.getPullRequestDiff(args.repo, args.pullNumber)),
);

server.registerTool(
  "post_pr_comment",
  {
    description:
      "Post a comment on a Pull Request, usually for performance analysis or alerts.",
    inputSchema: toolSchemas.postPrComment.shape,
  },
  wrap((args) =>
    githubAPI.postPrComment(args.repo, args.pullNumber, args.body),
  ),
);

async function main() {
  const transport = new StdioServerTransport();
  if (server.transport) {
    console.error("Server is already connected, skipping connect().");
    await server.close();
  }
  await server.connect(transport);
  console.error("github MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

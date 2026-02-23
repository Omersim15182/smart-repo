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
    {
      name: "get_pipeline_logs",
      description:
        "Get error messages and logs for a specific failed pipeline run",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          run_id: { type: "string" },
        },
        required: ["owner", "repo", "run_id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const headers = {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {}),
  };

  if (name === "list_pipelines") {
    const { owner, repo } = args;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            data.workflow_runs?.map((run) => ({
              id: run.id,
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              created_at: run.created_at,
            })) || [],
          ),
        },
      ],
    };
  }

  if (name === "get_pipeline_logs") {
    const { owner, repo, run_id } = args;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}/jobs`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    const failures = data.jobs
      ?.map((job) => ({
        job_name: job.name,
        failed_steps: job.steps
          .filter((step) => step.conclusion === "failure")
          .map((step) => ({
            name: step.name,
            number: step.number,
            conclusion: step.conclusion,
          })),
      }))
      .filter((j) => j.failed_steps.length > 0);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            failures || { message: "No failed steps found." },
          ),
        },
      ],
    };
  }

  throw new Error("Tool not found");
});

// 4. Connect using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

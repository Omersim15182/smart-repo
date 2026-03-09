const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_pipeline_status",
      description: "Get GitHub pipeline status for a repository and branch",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name, e.g., 'owner/project'",
          },
          branch: {
            type: "string",
            description: "The branch to check for the latest pipeline run",
            default: "main",
          },
          shouldFetchLogs: {
            type: "boolean",
            description:
              "If true, will attempt to retrieve the failure logs if the run failed",
            default: true,
          },
          limit: {
            type: "number",
            description:
              "How many pipeline runs to return, e.g. 'show 5 last runs' → 5. Default is 1.",
            default: 1,
          },
          commit: {
            type: "string",
            description:
              "Filter runs by commit message, e.g. 'test login and register'",
          },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_issue",
      description: "Create a GitHub issue in a repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name, e.g., 'owner/repo'",
          },
          title: {
            type: "string",
            description: "Issue title, e.g., 'Fix: Unit tests failing'",
          },
          body: {
            type: "string",
            description: "Detailed explanation of the problem",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Labels to apply to the issue",
            default: ["bug"],
          },
        },
        required: ["repo", "title"],
      },
    },
  },
];

export default TOOLS;

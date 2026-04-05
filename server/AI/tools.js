const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_latest_runs",
      description:
        "Get the status of the latest pipeline runs for a repository.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name, e.g., 'owner/project'",
          },
          limit: {
            type: "number",
            description: "Number of runs to show. Default is 5.",
            default: 5,
          },
          branch: {
            type: "string",
            description: "Optional branch to filter by.",
          },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_status_by_commit",
      description:
        "Search for a specific pipeline status using a commit message.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name, e.g., 'owner/project'",
          },
          commit: {
            type: "string",
            description: "The commit message to search for.",
          },
        },
        required: ["repo", "commit"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_failure_details",
      description:
        "Deep dive into a failed pipeline to see specific error logs and why it failed.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name, e.g., 'owner/project'",
          },
          commit: {
            type: "string",
            description: "The commit message of the failed run to analyze.",
          },
        },
        required: ["repo", "commit"],
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
          title: { type: "string", description: "Issue title" },
          body: {
            type: "string",
            description: "Detailed explanation of the problem",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            default: ["bug"],
          },
        },
        required: ["repo", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_pipeline_run_times",
      description:
        "Compares pipeline performance including total duration and individual test times from logs to identify specific regressions.",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "The full repository name (e.g., 'owner/project')",
          },
          limit: {
            type: "number",
            description:
              "Number of recent runs to fetch for comparison. Default is 5.",
            default: 5,
          },
          branch: {
            type: "string",
            description:
              "Optional branch name to filter results (e.g., 'main' or 'CI/CD')",
          },
          targetTestName: {
            type: "string",
            description:
              "Optional: A specific test name or substring (e.g., 'getStatusByCommit') to filter the performance history.",
          },
        },
        required: ["repo"],
      },
    },
  },
];

export default TOOLS;

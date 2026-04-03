import { z } from "zod";

class ToolSchemas {
  constructor() {
    // 1. Get a list of the latest runs
    this.getLatestRuns = z.object({
      repo: z
        .string()
        .describe("The full repository name, e.g., 'owner/project'"),
      limit: z
        .number()
        .default(5)
        .describe("Number of pipeline runs to return"),
      branch: z.string().optional().describe("Filter by branch name"),
    });

    // 2. Search for a specific status by commit message
    this.getStatusByCommit = z.object({
      repo: z
        .string()
        .describe("The full repository name, e.g., 'owner/project'"),
      commit: z.string().describe("The commit message to search for"),
    });

    // 3. Deep dive into failure logs for a specific commit
    this.getFailureDetails = z.object({
      repo: z
        .string()
        .describe("The full repository name, e.g., 'owner/project'"),
      commit: z
        .string()
        .describe("The commit message of the failed run to analyze"),
    });

    // Create GitHub Issue (remains the same)
    this.createIssue = z.object({
      repo: z.string().describe("The full repository name, e.g., 'owner/repo'"),
      title: z.string().describe("Issue title"),
      body: z.string().describe("Detailed explanation of the problem"),
      labels: z.array(z.string()).default(["bug"]),
    });
  }
}

const toolSchemas = new ToolSchemas();
export default toolSchemas;

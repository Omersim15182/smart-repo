import { z } from "zod";

class ToolSchemas {
  constructor() {
    this.pipeline = z.object({
      repo: z
        .string()
        .describe("The full repository name, e.g., 'owner/project'"),

      branch: z
        .string()
        .default("main")
        .describe("The branch to check for the latest pipeline run"),

      shouldFetchLogs: z
        .boolean()
        .default(true)
        .describe(
          "If true, will attempt to retrieve the failure logs if the run failed",
        ),

      limit: z
        .number()
        .default(1)
        .describe("Number of pipeline runs to return. Default is 1."),

      commit: z
        .string()
        .optional()
        .describe(
          "Filter runs by commit message, e.g. 'test login and register'",
        ),
    });

    this.createIssue = z.object({
      repo: z.string().describe("The full repository name, e.g., 'owner/repo'"),
      title: z
        .string()
        .describe("Issue title, e.g., 'Fix: Unit tests failing'"),
      body: z.string().describe("Detailed explanation of the problem"),
      labels: z.array(z.string()).default(["bug"]),
    });
  }
}

const toolSchemas = new ToolSchemas();
export default toolSchemas;

import { Octokit } from "octokit";
import Message from "./helpers/messages.js";
import dotenv from "dotenv";
dotenv.config({ override: true });

/**
 * Service class for interacting with GitHub REST API via Octokit.
 * Optimized for smart-repo to handle Pipelines and Issues.
 */
class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Retrieves the status of the latest workflow runs and identifies failed jobs.
   */
  async getPipelineStatus(
    fullRepo,
    branch = null,
    shouldFetchLogs = true,
    limit = 1,
    commit = null,
  ) {
    try {
      const [owner, repo] = fullRepo.split("/");

      const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch: branch || undefined,
        per_page: commit ? 50 : limit,
      });

      if (!data.workflow_runs.length) {
        return `No pipeline runs found for ${fullRepo}${branch ? ` on branch ${branch}` : ""}.`;
      }

      let runs = data.workflow_runs;

      if (commit) {
        runs = runs.filter((r) =>
          r.head_commit.message.toLowerCase().includes(commit.toLowerCase()),
        );

        if (!runs.length) {
          return `No pipeline runs found matching commit: "${commit}"`;
        }
      }

      runs = runs.slice(0, limit);

      const summaries = await Promise.all(
        runs.map(async (run, index) => {
          let summary = Message.runSummary(run, index);

          if (run.conclusion === "failure" && shouldFetchLogs) {
            const { data: jobData } =
              await this.octokit.rest.actions.listJobsForWorkflowRun({
                owner,
                repo,
                run_id: run.id,
              });

            const failureResults = await Promise.all(
              jobData.jobs
                .filter((j) => j.conclusion === "failure")
                .map(async (j) => {
                  const failedStep = j.steps.find(
                    (s) => s.conclusion === "failure",
                  );

                  const logsResponse =
                    await this.octokit.rest.actions.downloadJobLogsForWorkflowRun(
                      {
                        owner,
                        repo,
                        job_id: j.id,
                      },
                    );

                  const relevantLogs = logsResponse.data
                    .split("\n")
                    .filter(
                      (line) =>
                        line.includes("Error") || line.includes("failed"),
                    )
                    .slice(0, 5)
                    .join("\n     ");

                  return Message.jobFailure(j, failedStep, relevantLogs);
                }),
            );

            if (failureResults.length) {
              summary += `\n\nDetected Failures:\n${failureResults.join("\n")}`;
            }
          }

          return summary;
        }),
      );

      return summaries.join("\n");
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return `GitHub API Error: ${message}`;
    }
  }

  /**
   * Creates a new GitHub issue in the specified repository.
   */
  async createIssue(fullRepo, { title, body, labels = ["bug"] }) {
    try {
      const [owner, repo] = fullRepo.split("/");

      const { data } = await this.octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      });

      return `✅ Issue created successfully: ${data.html_url}`;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return `Failed to create issue: ${message}`;
    }
  }
}

const githubAPI = new GitHubService();
export default githubAPI;

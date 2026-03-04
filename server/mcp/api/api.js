import axios from "axios";
import dotenv from "dotenv";
dotenv.config({ override: true });
/**
 * Service class for interacting with GitHub REST API via Axios.
 * Handles Pipeline (Actions) status and Issue management.
 */
class GitHubService {
  /**
   */
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    this.client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      return config;
    });
  }

  /**
   * Retrieves the status of the latest workflow run and identifies failed jobs.
   */
  async getPipelineStatus(fullRepo, branch = null, shouldFetchLogs = true) {
    try {
      const [owner, repo] = fullRepo.split("/");

      const { data } = await this.client.get(
        `/repos/${owner}/${repo}/actions/runs`,
        { params: { per_page: 1, ...(branch && { branch }) } },
      );

      if (!data.workflow_runs.length) {
        return `No pipeline runs found for ${fullRepo}${branch ? ` on branch ${branch}` : ""}.`;
      }

      const run = data.workflow_runs[0];
      let summary = [
        `📍 Pipeline: ${run.name}`,
        `🏁 Status: ${run.status}`,
        `✅ Conclusion: ${run.conclusion || "Running"}`,
        `🌿 Branch: ${run.head_branch}`,
        `👤 Triggered by: ${run.triggering_actor.login}`,
        `🕐 Started at: ${new Date(run.run_started_at).toLocaleString()}`,
        `📝 Commit: ${run.head_commit.message.split("\n")[0]}`,
        `🔑 Commit SHA: ${run.head_sha.substring(0, 7)}`,
      ].join("\n");
      if (run.conclusion === "failure" && shouldFetchLogs) {
        const { data: jobData } = await this.client.get(
          `/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`,
        );
        const failures = jobData.jobs
          .filter((j) => j.conclusion === "failure")
          .map(
            (j) =>
              `  - ❌ Job "${j.name}" failed (Step: ${j.steps.find((s) => s.conclusion === "failure")?.name || "unknown"})`,
          )
          .join("\n");

        summary += `\n\nDetected Failures:\n${failures}`;
      }

      return summary;
    } catch (error) {
      return `GitHub API Error: ${error.response?.data?.message || error.message}`;
    }
  }

  /**
   * Creates a new GitHub issue in the specified repository.
   */
  async createIssue(fullRepo, { title, body, labels = ["bug"] }) {
    try {
      const [owner, repo] = fullRepo.split("/");
      const { data } = await this.client.post(
        `/repos/${owner}/${repo}/issues`,
        {
          title,
          body,
          labels,
        },
      );
      return `✅ Issue created successfully: ${data.html_url}`;
    } catch (error) {
      return `Failed to create issue: ${error.response?.data?.message || error.message}`;
    }
  }
}

const githubAPI = new GitHubService();
export default githubAPI;

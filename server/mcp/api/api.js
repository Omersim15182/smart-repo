import { Octokit } from "octokit";
import dotenv from "dotenv";
import message from "./helpers/messages.js";
dotenv.config({ override: true });

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GIT_TOKEN,
    });
  }

  _parseRepo(fullRepo) {
    const [owner, repo] = fullRepo.split("/");
    return { owner, repo };
  }

  async getLatestRuns(fullRepo, branch = null, limit = 5) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch: branch || undefined,
      per_page: limit,
    });

    return data.workflow_runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      commit: run.head_commit.message,
      author: run.head_commit.author.name,
      url: run.html_url,
      created_at: run.created_at,
    }));
  }

  async getStatusByCommit(fullRepo, commitMessage) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 50,
    });

    const run = data.workflow_runs.find((r) =>
      r.head_commit.message.toLowerCase().includes(commitMessage.toLowerCase()),
    );

    if (!run) return { error: "Commit not found" };

    return {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      commit: run.head_commit.message,
      url: run.html_url,
    };
  }

  async getFailureDetailsByCommit(fullRepo, commitMessage) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data: runData } =
      await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 50,
      });

    const run = runData.workflow_runs.find((r) =>
      r.head_commit.message.toLowerCase().includes(commitMessage.toLowerCase()),
    );

    if (!run || run.conclusion !== "failure")
      return { message: "No failed run found for this commit" };

    const { data: jobData } =
      await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: run.id,
      });

    const failures = await Promise.all(
      jobData.jobs
        .filter((j) => j.conclusion === "failure")
        .map(async (job) => {
          const logs = await this._getRelevantLogs(owner, repo, job.id);
          return {
            jobName: job.name,
            failedStep: job.steps.find((s) => s.conclusion === "failure")?.name,
            logs: logs,
          };
        }),
    );

    return { runId: run.id, failures };
  }

  async _getRelevantLogs(owner, repo, jobId) {
    try {
      const { data } =
        await this.octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: jobId,
        });

      const cleanLogs = message.stripAnsi(data);
      return cleanLogs
        .split("\n")
        .filter(
          (line) =>
            line.toLowerCase().includes("error") ||
            line.toLowerCase().includes("failed") ||
            line.toLowerCase().includes("cypresserror"),
        )
        .map((line) => line.trim())
        .slice(0, 10);
    } catch {
      return ["Logs unavailable"];
    }
  }

  async createIssue(fullRepo, { title, body, labels }) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data } = await this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    return { url: data.html_url, id: data.number, status: "created" };
  }
}

const githubAPI = new GitHubService();
export default githubAPI;

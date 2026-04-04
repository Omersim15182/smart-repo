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

  async getTestBreakdown(owner, repo, runId) {
    try {
      const { data: jobs } =
        await this.octokit.rest.actions.listJobsForWorkflowRun({
          owner,
          repo,
          run_id: runId,
        });

      if (!jobs.jobs || jobs.jobs.length === 0) return [];

      const testJob =
        jobs.jobs.find(
          (j) =>
            j.name.toLowerCase().includes("test") ||
            j.name.toLowerCase().includes("jest"),
        ) || jobs.jobs[0];

      const response =
        await this.octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: testJob.id,
        });
      const logText = response.data.toString();
      const regex = /(?:✓|PASS|test|[\s])\s+(.*?)\s+\((\d+)\s*ms\)/g;
      const results = [];
      let match;

      while ((match = regex.exec(logText)) !== null) {
        const name = match[1].trim();
        const duration = parseInt(match[2], 10);

        if (name.length > 3 && name.length < 100) {
          results.push({ name, duration });
        }
      }

      console.error(
        `DEBUG - Found ${results.length} tests in log for Run ${runId} , ${results
          .map((t) => t.name)
          .slice(0, 5)
          .join(", ")}...  `,
      );
      return results;
    } catch (e) {
      console.error(`Error in getTestBreakdown for ${runId}:`, e.message);
      return [];
    }
  }

  async comparePipelineRunTimes(
    fullRepo,
    branch = null,
    limit = 5,
    targetTestName = null,
  ) {
    const { owner, repo } = this._parseRepo(fullRepo);

    const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch: branch || undefined,
      per_page: limit,
    });

    const runHistory = await Promise.all(
      data.workflow_runs.map(async (run) => ({
        id: run.id,
        display: `#${run.run_number} (${run.head_commit?.message.substring(0, 20)}...)`,
        timestamp: run.created_at,
        tests: await this.getTestBreakdown(owner, repo, run.id),
      })),
    );

    const allTestNames = new Set();
    runHistory.forEach((run) =>
      run.tests.forEach((t) => allTestNames.add(t.name)),
    );

    const analysis = [];

    const testsToAnalyze = targetTestName
      ? Array.from(allTestNames).filter((name) => name.includes(targetTestName))
      : Array.from(allTestNames);

    for (const testName of testsToAnalyze) {
      const sequence = runHistory.map((run) => {
        const found = run.tests.find((t) => t.name === testName);
        return {
          runDisplay: run.display,
          duration: found ? found.duration : null,
        };
      });

      const validDurations = sequence
        .map((s) => s.duration)
        .filter((d) => d !== null);
      const avg =
        validDurations.reduce((a, b) => a + b, 0) / validDurations.length;
      const latest = validDurations[0];
      const trend = latest > avg ? "Slower" : "Stable/Faster";

      analysis.push({
        testName,
        history: sequence,
        averageMs: Math.round(avg),
        latestMs: latest,
        status: trend,
        regression: latest > avg ? latest - avg : 0,
      });
    }

    return {
      repo: fullRepo,
      totalRunsAnalyzed: runHistory.length,
      testResults: analysis.sort((a, b) => b.regression - a.regression),
    };
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

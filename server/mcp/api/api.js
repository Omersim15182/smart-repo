import dotenv from "dotenv";
import message from "./helpers/messages.js";
import { octokit } from "./gitInstance.js";
dotenv.config({ override: true, quiet: true });

class GitHubService {
  _parseRepo(fullRepo) {
    const [owner, repo] = fullRepo.split("/");
    return { owner, repo };
  }

  async getTestBreakdown(owner, repo, runId) {
    try {
      const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
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

      const response = await octokit.rest.actions.downloadJobLogsForWorkflowRun(
        {
          owner,
          repo,
          job_id: testJob.id,
        },
      );

      return message.parseTestLogs(response.data.toString());
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

    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      branch: branch || undefined,
      per_page: limit,
    });

    const runHistory = await Promise.all(
      data.workflow_runs.map(async (run) => ({
        display: `#${run.run_number} (${run.head_commit?.message.slice(0, 20)}...)`,
        tests: await this.getTestBreakdown(owner, repo, run.id),
      })),
    );

    const allTestNames = [
      ...new Set(runHistory.flatMap((r) => r.tests.map((t) => t.name))),
    ].filter((name) => !targetTestName || name.includes(targetTestName));

    const testResults = allTestNames
      .map((testName) => {
        const history = runHistory.map((run) => ({
          runDisplay: run.display,
          duration:
            run.tests.find((t) => t.name === testName)?.duration || null,
        }));

        const validDurations = history
          .map((h) => h.duration)
          .filter((d) => d !== null);
        const avg =
          validDurations.reduce((a, b) => a + b, 0) /
          (validDurations.length || 1);
        const latest = validDurations[0] || 0;
        const isSlower = latest > avg;

        return {
          testName,
          history,
          averageMs: Math.round(avg),
          latestMs: latest,
          status: isSlower ? "Slower" : "Stable/Faster",
          regression: isSlower ? Math.round(latest - avg) : 0,
        };
      })
      .sort((a, b) => b.regression - a.regression);

    return {
      repo: fullRepo,
      totalRunsAnalyzed: runHistory.length,
      testResults,
    };
  }

  /**
   * Fetches the raw diff of a Pull Request using the rest client.
   */
  async getPullRequestDiff(fullRepo, pullNumber) {
    try {
      const { owner, repo } = this._parseRepo(fullRepo);

      const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
          format: "diff",
        },
      });

      return data;
    } catch (error) {
      console.error(
        `[GitHub API] Error fetching diff for PR #${pullNumber}:`,
        error.message,
      );
      throw new Error(`Failed to fetch PR diff: ${error.message}`);
    }
  }

  /**
   * Posts a comment to a Pull Request or Issue using the rest client.
   */
  async postPrComment(fullRepo, pullNumber, body) {
    try {
      const { owner, repo } = this._parseRepo(fullRepo);

      const { data } = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body,
      });

      return {
        success: true,
        commentId: data.id,
        url: data.html_url,
      };
    } catch (error) {
      console.error(
        `[GitHub API] Error posting comment to PR #${pullNumber}:`,
        error.message,
      );
      throw new Error(`Failed to post PR comment: ${error.message}`);
    }
  }

  async getLatestRuns(fullRepo, branch = null, limit = 5) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
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
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
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
      await octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 50,
      });

    const run = runData.workflow_runs.find((r) =>
      r.head_commit.message.toLowerCase().includes(commitMessage.toLowerCase()),
    );

    if (!run || run.conclusion !== "failure")
      return { message: "No failed run found for this commit" };

    const { data: jobData } = await octokit.rest.actions.listJobsForWorkflowRun(
      {
        owner,
        repo,
        run_id: run.id,
      },
    );

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
      const { data } = await octokit.rest.actions.downloadJobLogsForWorkflowRun(
        {
          owner,
          repo,
          job_id: jobId,
        },
      );

      return message.filterErrorLogs(data);
    } catch {
      return ["Logs unavailable"];
    }
  }

  async createIssue(fullRepo, { title, body, labels }) {
    const { owner, repo } = this._parseRepo(fullRepo);
    const { data } = await octokit.rest.issues.create({
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

import githubAPI from "../mcp/api/api";
import githubFixtures from "./fixtures/github.fixtures.json";
import pipelineFixtures from "./fixtures/pipeline.fixtures.json";
import { octokit } from "../mcp/api/gitInstance";
import { expect, jest } from "@jest/globals";

// ─── Functional Tests ────────────────────────────────────────────────────────

describe("GitHub API Functional Tests", () => {
  // FIXED: Changed 'fixtures' to 'githubFixtures'
  const repo = githubFixtures.REPOS.cypress;

  test("getLatestRuns returns an array of pipeline objects", async () => {
    // Ensure order matches your API: (repo, branch, limit)
    const result = await githubAPI.getLatestRuns(repo, "CI/CD", 3);

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("status");
      expect(result[0]).toHaveProperty("conclusion");
      expect(result[0].branch).toBe("CI/CD");
    }
  });

  test("getStatusByCommit returns correct run details for a specific commit", async () => {
    const commitMsg = "update for run pipline test";

    let data = [];
    for (let i = 0; i < 2000000; i++) {
        data.push(Math.sqrt(i) * Math.sin(i));
    }
    // -------------------------------------------

    const result = await githubAPI.getStatusByCommit(repo, commitMsg);

    if (!result.error) {
      expect(result).toHaveProperty("id");
      expect(result.commit).toContain(commitMsg);
      expect(result).toHaveProperty("url");
    }
});

  // test("getStatusByCommit returns correct run details for a specific commit", async () => {
  //   const commitMsg = "update for run pipline test";
  //   const result = await githubAPI.getStatusByCommit(repo, commitMsg);

  //   if (!result.error) {
  //     expect(result).toHaveProperty("id");
  //     expect(result.commit).toContain(commitMsg);
  //     expect(result).toHaveProperty("url");
  //   }
  // });

  test("getFailureDetailsByCommit returns clean logs and failed steps", async () => {
    const commitMsg = "add env for pipline";
    const result = await githubAPI.getFailureDetailsByCommit(repo, commitMsg);

    if (result.failures) {
      expect(result).toHaveProperty("runId");
      expect(Array.isArray(result.failures)).toBe(true);

      const firstFailure = result.failures[0];
      expect(firstFailure).toHaveProperty("jobName");
      expect(firstFailure).toHaveProperty("failedStep");
    }
  });

  test("createIssue returns a valid issue object", async () => {
    const issueData = {
      title: "Test Issue from Jest",
      body: "Testing the automation flow",
      labels: ["bug"],
    };

    const result = await githubAPI.createIssue(repo, issueData);

    expect(result.status).toBe("created");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("github.com");
  });
});

// ─── Unit Tests - Pipeline Comparison ───────────────────────────────────────

test("should compare 'test X' across pipelines logs", async () => {
  const { mockRuns, logsByRunId } = pipelineFixtures;

  const m = jest
    .spyOn(octokit.rest.actions, "listWorkflowRunsForRepo")
    .mockResolvedValue({ data: { workflow_runs: mockRuns } });

  jest
    .spyOn(octokit.rest.actions, "listJobsForWorkflowRun")
    .mockImplementation(async ({ run_id }) => {
      return {
        data: {
          jobs: [{ id: run_id, name: "run-tests-job" }],
        },
      };
    });

  jest
    .spyOn(octokit.rest.actions, "downloadJobLogsForWorkflowRun")
    .mockImplementation(async ({ job_id }) => {
      return { data: logsByRunId[job_id] || "" };
    });

  // Execute Service
  const { testResults, totalRunsAnalyzed } =
    await githubAPI.comparePipelineRunTimes("owner/repo", "main", 3, "test X");

  const testX = testResults?.find((r) => r.testName.includes("test X"));

  // Assertions
  expect(totalRunsAnalyzed).toBe(5);
  expect(testX).toBeDefined();
  expect(testX.history[0].duration).toBe(600);
  expect(testX.history[4].duration).toBe(400);
  expect(testX.averageMs).toBe(500);
  expect(testX.status).toBe("Slower");
  expect(testX.regression).toBe(100);
});

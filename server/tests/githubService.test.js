import githubAPI from "../mcp/api/api";
import githubFixtures from "./fixtures/github.fixtures.json";
import pipelineFixtures from "./fixtures/pipeline.fixtures.json";
import { jest } from "@jest/globals";

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
    const result = await githubAPI.getStatusByCommit(repo, commitMsg);

    if (!result.error) {
      expect(result).toHaveProperty("id");
      expect(result.commit).toContain(commitMsg);
      expect(result).toHaveProperty("url");
    }
  });

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

describe("GitHub API - comparePipelineRunTimes", () => {
  const { mockRuns } = pipelineFixtures;

  beforeEach(() => {
    jest
      .spyOn(githubAPI.octokit.rest.actions, "listWorkflowRunsForRepo")
      .mockResolvedValue({ data: { workflow_runs: mockRuns } });
  });

  afterEach(() => jest.restoreAllMocks());

  test("identifies slower runs based on fixtures", async () => {
    const result = await githubAPI.comparePipelineRunTimes(
      "omersim15182/smart-repo",
      "CI/CD",
    );
    console.log("res :", result.slowerRuns);

    expect(result.slowerRuns).toHaveLength(3);

    expect(result.slowerRuns[0].difference).toBe(300000); // Omer's 5 min jump
    expect(result.slowerRuns[2].difference).toBe(900000); // Dana's 15 min jump
  });

  test("calculates correct duration and maps fields correctly", async () => {
    const result = await githubAPI.comparePipelineRunTimes(
      "omersim15182/smart-repo",
      "main",
    );

    expect(result.runTimes).toHaveLength(5);
    expect(result.runTimes[4].duration).toBe(1500000);
    expect(result.runTimes[3]).toMatchObject({
      id: 4,
      branch: "main",
      author: "Dana",
    });
  });
});

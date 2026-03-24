import githubAPI from "../mcp/api/api";
import { jest } from "@jest/globals";

describe("GitHubService Unit Tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** * TEST 1: No workflow runs found.
   * Checks if the service correctly handles an empty response from GitHub.
   **/
  test("should return a message when no workflow runs are found", async () => {
    const mockList = jest.spyOn(
      githubAPI.octokit.rest.actions,
      "listWorkflowRunsForRepo",
    );
    mockList.mockResolvedValue({ data: { workflow_runs: [] } });

    const result = await githubAPI.getPipelineStatus("owner/repo");

    expect(result).toContain("No pipeline runs found");
  });

  /** * TEST 2: Failed workflow run (Full Mocking Chain).
   * Verifies the service processes both the run and the failed jobs/steps.
   **/
  test("should process a failed workflow run correctly", async () => {
    const mockList = jest.spyOn(
      githubAPI.octokit.rest.actions,
      "listWorkflowRunsForRepo",
    );
    const mockJobs = jest.spyOn(
      githubAPI.octokit.rest.actions,
      "listJobsForWorkflowRun",
    );

    mockList.mockResolvedValue({
      data: {
        workflow_runs: [
          {
            id: 998877,
            name: "Unit Tests",
            status: "completed",
            conclusion: "failure",
            head_branch: "main",
            run_started_at: "2026-03-24T10:00:00Z",
            triggering_actor: { login: "Omersim15182" },
            head_commit: { message: "feat: add login logic" },
            head_sha: "7abc123",
          },
        ],
      },
    });

    mockJobs.mockResolvedValue({
      data: {
        jobs: [
          {
            name: "build-and-test",
            conclusion: "failure",
            steps: [
              { name: "Install Deps", conclusion: "success" },
              { name: "Run Tests", conclusion: "failure" },
            ],
          },
        ],
      },
    });

    const result = await githubAPI.getPipelineStatus("owner/repo");

    expect(result).toContain("Conclusion: failure");
    expect(result).toContain("Triggered by: Omersim15182");
    expect(result).toContain("Commit: feat: add login logic");
    expect(result).toContain(
      '❌ Job "build-and-test" failed (Step: Run Tests)',
    );
  });
});

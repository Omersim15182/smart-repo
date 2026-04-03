import githubAPI from "../mcp/api/api";
import fixtures from "./fixtures/github.fixtures.json";

describe("GitHub API Functional Tests", () => {
  const repo = fixtures.REPOS.cypress; 
  test("getLatestRuns returns an array of pipeline objects", async () => {
    const result = await githubAPI.getLatestRuns(repo, 3, "CI/CD");

    console.log("Latest Runs Result:", result);

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

    console.log("Status by Commit Result:", result);

    if (!result.error) {
      expect(result).toHaveProperty("id");
      expect(result.commit).toContain(commitMsg);
      expect(result).toHaveProperty("url");
    }
  });

  test("getFailureDetailsByCommit returns clean logs and failed steps", async () => {
    const commitMsg = "add env for pipline";
    const result = await githubAPI.getFailureDetailsByCommit(repo, commitMsg);

    console.log("Failure Details Result:", result);

    if (result.failures) {
      expect(result).toHaveProperty("runId");
      expect(Array.isArray(result.failures)).toBe(true);

      const firstFailure = result.failures[0];
      expect(firstFailure).toHaveProperty("jobName");
      expect(firstFailure).toHaveProperty("failedStep");

      if (firstFailure.logs.length > 0) {
        expect(firstFailure.logs[0]).not.toMatch(/\[\d+m/); 
      }
    }
  });

  test("createIssue returns a valid issue object", async () => {
    const issueData = {
      title: "Test Issue from Jest",
      body: "Testing the automation flow",
      labels: ["bug"],
    };

    const result = await githubAPI.createIssue(repo, issueData);

    console.log("Create Issue Result:", result);

    expect(result.status).toBe("created");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("github.com");
  });
});

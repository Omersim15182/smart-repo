import githubAPI from "../mcp/api/api";
import fixtures from "./fixtures/github.fixtures.json";

describe("GitHub API test", () => {
  test("creates an issue and returns a GitHub URL", async () => {
    const result = await githubAPI.createIssue(fixtures.REPOS.cypress, {
      ...fixtures.ISSUES.basic,
    });

    console.log(" Result:", result);
    expect(result).toContain("github.com");
    expect(result).toContain("Issue created successfully");
  });

  test("fails gracefully when repo does not exist", async () => {
    const result = await githubAPI.createIssue(fixtures.REPOS.errorRepo, {
      ...fixtures.ISSUES.basic,
    });
    console.log("Result:", result);
    expect(result).toContain("Failed to create issue");
  });

  test("returns pipeline status for a valid repo", async () => {
    const { fullRepoName, branch, shouldFetchLogs, limit, commit } =
      fixtures.PIPELINES.basic;

    const result = await githubAPI.getPipelineStatus(
      fullRepoName,
      branch,
      shouldFetchLogs,
      limit,
      commit,
    );
    console.log("Result:", result);
    expect(result).toContain("Pipeline");
    expect(result).toContain("Status");
  });
});

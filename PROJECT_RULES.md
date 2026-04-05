# 🛠 Smart Repo: Development Standards

## 🏗 Architecture & Stack

- **Environment:** Node.js (ESM). Use forward slashes `/` for all paths.
- **Core:** Octokit (GitHub API), Jest (Testing), MCP (Model Context Protocol).
- **Structure:** Modular, DRY principles. Logic in `src/services/`, tests in `tests/`.

## 💻 Coding Standards

- **Function Limit:** No function should exceed **40 lines**. If it does, refactor into smaller utility functions.
- **Naming:** Use descriptive, full-word variable names (e.g., `validDurations` instead of `v`).
- **Safety:** Use Optional Chaining (`?.`) and Nullish Coalescing (`||`) for all external API data.
- **Error Handling:** Always include `try-catch` blocks or error boundaries in service methods.

## 🤖 GitHub & MCP Integration

- **GitHub API:** - When mocking `listJobsForWorkflowRun`, **ALWAYS** include a `name` property to prevent `toLowerCase()` crashes.
  - Analysis returns must follow: `{ repo, totalRunsAnalyzed, testResults: [] }`.
- **MCP (Model Context Protocol):**
  - All MCP tools must have clear input schemas.
  - Ensure self-healing logic; if an MCP tool fails, return a graceful error object for the agent.

## 🧪 Testing (Jest)

- **The Shuffle Rule:** Log fixtures (`logsByRunId`) **must** have tests in different orders per run. The parser must find tests by name string, not index.
- **Regression Logic:**
  - `averageMs`: Mean of historical durations.
  - `regression`: `Latest - Average` (0 if latest is faster).
  - `status`: `"Slower"` or `"Stable/Faster"`.

- **Commits:** Conventional commits only (`feat:`, `fix:`, `test:`, `refactor:`).
- **Verification:** Run `npm test` before pushing to verify regression logic integrity.

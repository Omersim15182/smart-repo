class Message {
  /** Builds the summary block for a single run */
  static runSummary(run, index) {
    return [
      `\n--- Run ${index + 1} ---`,
      `📍 Pipeline:   ${run.name}`,
      `🏁 Status:     ${run.status}`,
      `✅ Conclusion: ${run.conclusion || "Running"}`,
      `🌿 Branch:     ${run.head_branch}`,
      `👤 Triggered:  ${run.triggering_actor.login}`,
      `🕐 Started:    ${new Date(run.run_started_at).toLocaleString()}`,
      `📝 Commit:     ${run.head_commit.message.split("\n")[0]}`,
      `🔑 SHA:        ${run.head_sha.substring(0, 7)}`,
    ].join("\n");
  }

  /** Builds the failure block for a single failed job */
  static jobFailure(j, failedStep, relevantLogs) {
    return [
      `  - ❌ Job "${j.name}" failed`,
      `     Step:  ${failedStep?.name || "unknown"}`,
      `     Error:\n     ${relevantLogs || "No error details found"}`,
    ].join("\n");
  }

  static stripAnsi(text) {
    const ansiRegex =
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-z]/g;
    return text.replace(ansiRegex, "");
  }

  /** logic from original GitHubService for parsing tests */
  static parseTestLogs(logText) {
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
    return results;
  }

  /** logic from original GitHubService for filtering errors */
  static filterErrorLogs(data) {
    const cleanLogs = this.stripAnsi(data.toString());
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
  }
}

export default Message;

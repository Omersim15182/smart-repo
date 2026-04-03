import groqService from "../AI/groq.js";
import { callMcpTool } from "../mcp/mcpClient.js";

export const handleAgentMessage = async (message) => {
  const { type, content, toolCalls } = await groqService.getToolCalls(message);

  if (type === "text") {
    return { success: true, data: content };
  }

  const toolResults = await Promise.all(
    toolCalls.map(async ({ id, toolName, args }) => {
      try {
        const result = await callMcpTool(toolName, args);
        return { id, toolName, args, result, error: null };
      } catch (err) {
        return { id, toolName, args, result: null, error: err.message };
      }
    }),
  );

  return { success: true, toolResults };
};

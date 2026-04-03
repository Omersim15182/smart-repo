import groqService from "../AI/groq.js";
import { callMcpTool } from "../mcp/mcpClient.js";

export const handleAgentMessage = async (message) => {
  console.log("Incoming message:", message); // Log incoming message

  const { type, content, toolCalls } = await groqService.getToolCalls(message);
  console.log("GroqService response:", { type, content, toolCalls }); // Log GroqService response

  if (type === "text") {
    return { success: true, data: content };
  }

  const toolResults = await Promise.all(
    toolCalls.map(async ({ id, toolName, args }) => {
      try {
        console.log("Calling tool:", { id, toolName, args }); // Log tool call details
        const result = await callMcpTool(toolName, args);
        console.log("Tool result:", { id, toolName, result }); // Log tool result
        return { id, toolName, args, result, error: null };
      } catch (err) {
        console.error("Tool error:", {
          id,
          toolName,
          args,
          error: err.message,
        }); // Log tool error
        return { id, toolName, args, result: null, error: err.message };
      }
    }),
  );

  return { success: true, toolResults };
};

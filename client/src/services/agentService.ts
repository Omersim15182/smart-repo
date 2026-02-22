import type { ChatMessage } from "../App";

const API_BASE_URL = "http://localhost:3000/api";

export async function sendMessageToAgent(
  userMessage: string,
): Promise<ChatMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform API response into ChatMessage format
    const agentMessage: ChatMessage = {
      id: `${crypto.randomUUID()}-agent`,
      role: "agent",
      content: data.message || data.content || "Processing your request...",
      steps: data.steps || [],
      previewCode: data.previewCode,
    };

    return agentMessage;
  } catch (error) {
    console.error("Failed to get agent response:", error);

    // Return error message if API call fails
    return {
      id: `${crypto.randomUUID()}-agent`,
      role: "agent",
      content:
        "Sorry, I couldn't reach the agent. Please make sure the server is running.",
      steps: [],
    };
  }
}

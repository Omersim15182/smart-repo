import Groq from "groq-sdk";
import dotenv from "dotenv";
import TOOLS from "./tools.js";

dotenv.config({ override: true, quiet: true });

const SYSTEM_PROMPT = `
You are a GitHub assistant. Use the available tools to fulfill user requests.
You can call multiple tools in parallel if the user's message requires it.
Always extract repo in "owner/repo" format.
If the user mentions a number of runs/pipelines (e.g. "last 5", "show 3"), extract it as the limit parameter.
`;

class GroqService {
  constructor() {
    const rawKey = process.env.GROQ_API_KEY || "";
    const cleanKey = rawKey.trim().replace(/^<|>$/g, "").trim();
    this.groq = new Groq({ apiKey: cleanKey });
  }

  async getToolCalls(message) {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      temperature: 0,
      tools: TOOLS,
      tool_choice: "auto",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const choice = response.choices[0];
    console.log("choice:", choice.message.tool_calls);
    console.log("text:", response.choices[0].message.content);

    if (choice.finish_reason !== "tool_calls") {
      return { type: "text", content: choice.message.content, toolCalls: [] };
    }

    const toolCalls = choice.message.tool_calls.map((tc) => ({
      id: tc.id,
      toolName: tc.function.name,
      args: JSON.parse(tc.function.arguments),
    }));

    return { type: "tool_calls", toolCalls };
  }
}

const groqService = new GroqService();
export default groqService;

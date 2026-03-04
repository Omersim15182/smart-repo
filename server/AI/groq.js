import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config({ override: true });
class GroqService {
  constructor() {
    const rawKey = process.env.GROQ_API_KEY || "";
    const cleanKey = rawKey.trim().replace(/^<|>$/g, "").trim();
    console.log("cleankey", cleanKey);

    this.groq = new Groq({ apiKey: cleanKey });
  }

  safeParseJSON(content) {
    const cleaned = content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }

  async extractIntent(message) {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 10,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are an intent classifier. Return ONLY one word: "pipeline" or "issue".`,
        },
        {
          role: "user",
          content: `Classify this message: "${message}"`,
        },
      ],
    });

    return response.choices[0].message.content.trim().toLowerCase();
  }

  async extractPipelineParams(message) {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a precise data extractor. Return ONLY raw JSON.",
        },
        {
          role: "user",
          content: `Extract GitHub pipeline parameters from this message. 
          - repo: always format as "owner/repo" (e.g if user says "owner omersim15182 repo cypress-web-automation" return "omersim15182/cypress-web-automation")
          - branch: extract branch name if mentioned in any format like "branch main", "on main", "in branch CI/CD", "branch called feature/login" — if not mentioned set to null
          - shouldFetchLogs: boolean, default true
          
Return ONLY raw JSON. Message: "${message}"`,
        },
      ],
    });

    return this.safeParseJSON(response.choices[0].message.content);
  }

  async extractIssueParams(message) {
    const response = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "Extract issue details. Return ONLY JSON with: repo (format: 'owner/repo'), title, body, labels (array).",
        },
        {
          role: "user",
          content: `Extract the GitHub issue parameters from this message: "${message}"`,
        },
      ],
    });

    return this.safeParseJSON(response.choices[0].message.content);
  }
}

const groqService = new GroqService();
export default groqService;

import { useState } from "react";
import { Layout } from "./components/layout/Layout";
import { ChatWindow } from "./components/chat/ChatWindow";

export type AgentStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done";
};

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  steps?: AgentStep[];
  previewCode?: string;
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const baseId = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id: baseId,
      role: "user",
      content: text,
    };

    const agentMessage: ChatMessage = {
      id: `${baseId}-agent`,
      role: "agent",
      content: "Analyzing your repository structure...",
      steps: [
        { id: "1", label: "Accessing MCP File System", status: "done" },
        { id: "2", label: "Scanning for security patterns", status: "running" },
        { id: "3", label: "Generating report", status: "pending" },
      ],
      previewCode: `// Security Scan Results\n// Found 0 critical vulnerabilities in src/auth.ts`,
    };

    setMessages((prev) => [...prev, newMessage, agentMessage]);
    setSelectedPreview(agentMessage.previewCode ?? null);
  };

  const handleQuickAction = (action: "scan" | "readme" | "refactor") => {
    const text =
      action === "scan"
        ? "Scan repo"
        : action === "readme"
          ? "Gen README"
          : "Refactor";
    handleSend(text);
  };

  return (
    // top-level container; avoid long Tailwind strings here
    <div className="app-root h-full">
      <Layout
        messages={messages}
        onQuickAction={handleQuickAction}
        onSend={handleSend}
        selectedPreview={selectedPreview}
        onSelectPreview={(code) => setSelectedPreview(code ?? null)}
      >
        <ChatWindow
          messages={messages}
          onSend={handleSend}
          onQuickAction={handleQuickAction}
          onSelectPreview={(code) => setSelectedPreview(code ?? null)}
        />
      </Layout>
    </div>
  );
}

export default App;

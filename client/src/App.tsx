import { useState } from "react";
import { Layout } from "./components/layout/Layout";
import { ChatWindow } from "./components/chat/ChatWindow";
import { sendMessageToAgent } from "./services/agentService";

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

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const baseId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: baseId,
      role: "user",
      content: text,
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);

    // Add loading agent message
    const loadingMessage: ChatMessage = {
      id: `${baseId}-agent`,
      role: "agent",
      content: "Processing your request...",
      steps: [{ id: "1", label: "Analyzing your request", status: "running" }],
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // Get response from API
    const agentMessage = await sendMessageToAgent(text);

    // Replace loading message with actual response
    setMessages((prev) =>
      prev.map((msg) => (msg.id === loadingMessage.id ? agentMessage : msg)),
    );

    if (agentMessage.previewCode) {
      setSelectedPreview(agentMessage.previewCode);
    }
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
        onSend={handleSend}
        onSelectPreview={(code) => setSelectedPreview(code ?? null)}
        selectedPreview={selectedPreview}
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

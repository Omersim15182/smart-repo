// src/components/ChatWindow.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import type { ChatMessage, AgentStep } from "../../App";

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onQuickAction: (action: "scan" | "readme" | "refactor") => void;
  onSelectPreview: (code?: string) => void;
};

export function ChatWindow({ messages, onSend, onSelectPreview }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-messages-wrapper">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty-placeholder">
              Start by asking the MCP AI Agent to scan your repo, refactor a
              file, or generate documentation.
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSelectPreview={onSelectPreview}
            />
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a command to the agent…"
            className="chat-textarea"
            rows={1}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

type MessageBubbleProps = {
  message: ChatMessage;
  onSelectPreview: (code?: string) => void;
};

function MessageBubble({ message, onSelectPreview }: MessageBubbleProps) {
  const isAgent = message.role === "agent";

  return (
    <div className="message-container">
      <div
        className={`message-flex ${isAgent ? "justify-start" : "justify-end"}`}
      >
        <div
          className={`message-bubble ${isAgent ? "agent-bubble" : "user-bubble"}`}
        >
          <div className="bubble-header">{isAgent ? "Agent" : "You"}</div>
          <div className="bubble-content">{message.content}</div>
        </div>
      </div>

      {/* Thinking process */}
      {isAgent && message.steps && message.steps.length > 0 && (
        <AgentSteps steps={message.steps} onSelectPreview={onSelectPreview} />
      )}
    </div>
  );
}

type AgentStepsProps = {
  steps: AgentStep[];
  onSelectPreview: (code?: string) => void;
};

function AgentSteps({ steps, onSelectPreview }: AgentStepsProps) {
  return (
    <div className="agent-steps-container">
      <div className="agent-steps-header">
        <span className="spinner">
          <span className="spinner-ping" />
          <span className="spinner-dot" />
        </span>
        Thinking Process
      </div>

      <div className="agent-steps-body">
        {steps.map((step, idx) => (
          <StepRow
            key={step.id}
            step={step}
            index={idx}
            onSelectPreview={onSelectPreview}
          />
        ))}
      </div>
    </div>
  );
}

type StepRowProps = {
  step: AgentStep;
  index: number;
  onSelectPreview: (code?: string) => void;
};

function StepRow({ step, index, onSelectPreview }: StepRowProps) {
  const badge =
    step.status === "done" ? (
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
    ) : step.status === "running" ? (
      <span className="relative h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-emerald-400/60 opacity-75 animate-ping" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
    ) : (
      <span className="h-1.5 w-1.5 rounded-full border border-slate-600" />
    );

  return (
    <button
      type="button"
      className="step-row"
      onClick={() => onSelectPreview()}
    >
      <div className="step-number-container">
        <div className="step-number">{index + 1}</div>
      </div>
      <div className="step-content">
        <div className="step-badge-label">
          {badge}
          <span className="step-label">{step.label}</span>
        </div>
      </div>
    </button>
  );
}

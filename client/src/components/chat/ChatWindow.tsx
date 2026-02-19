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

export function ChatWindow({
  messages,
  onSend,
  onSelectPreview,
}: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4 custom-scroll">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-xs text-slate-500">
            Start by asking the MCP AI Agent to scan your repo, refactor a file,
            or generate documentation.
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

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-800 bg-slate-950/80 px-4 py-3"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 flex items-end gap-2 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a command to the agent…"
            className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus-visible:ring-0"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40"
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
    <div className="flex flex-col gap-1 group">
      <div
        className={`flex ${
          isAgent ? "justify-start" : "justify-end"
        } text-sm`}
      >
        <div
          className={`max-w-[78%] rounded-2xl border px-3 py-2.5 shadow-sm transition-transform duration-150 ${
            isAgent
              ? "border-slate-800 bg-slate-900/80 text-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.9)]"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-50"
          }`}
        >
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-1">
            {isAgent ? "Agent" : "You"}
          </div>
          <div className="leading-relaxed text-[13px] whitespace-pre-wrap">
            {message.content}
          </div>
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
    <div className="ml-2 mt-1.5">
      <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
        <span className="relative h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400/70 opacity-70 animate-ping" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Thinking Process
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-300 space-y-1.5">
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
      className="flex w-full items-center gap-2 text-left group/step"
      onClick={() => onSelectPreview()}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-4 w-4 rounded-full bg-slate-900/90 border border-slate-700 text-[9px] text-slate-400 group-hover/step:border-emerald-500 group-hover/step:text-emerald-300 transition-colors">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {badge}
          <span className="text-[11px] text-slate-300 group-hover/step:text-slate-50 transition-colors">
            {step.label}
          </span>
        </div>
      </div>
    </button>
  );
}
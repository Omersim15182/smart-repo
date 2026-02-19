// src/components/Layout.tsx
import type { ReactNode } from "react";
import {
  FolderTree,
  FileCode2,
  ChevronRight,
  ChevronDown,
  Code2,
  Wand2,
  Bug,
  BookOpen,
  Braces,
} from "lucide-react";
import type { ChatMessage } from "../../App";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

const mockTree: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",
    children: [
      { id: "src/index.tsx", name: "index.tsx", type: "file" },
      {
        id: "src/agents",
        name: "agents",
        type: "folder",
        children: [
          { id: "src/agents/mcpAgent.ts", name: "mcpAgent.ts", type: "file" },
        ],
      },
      { id: "src/auth.ts", name: "auth.ts", type: "file" },
    ],
  },
  {
    id: "README.md",
    name: "README.md",
    type: "file",
  },
];

type LayoutProps = {
  children: ReactNode;
  messages: ChatMessage[];
  onQuickAction: (action: "scan" | "readme" | "refactor") => void;
  onSend: (text: string) => void;
  selectedPreview: string | null;
  onSelectPreview: (code?: string) => void;
};

export function Layout({
  children,
  onQuickAction,
  selectedPreview,
}: LayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Ambient background gradients */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(15,23,42,0.9),_rgba(15,23,42,1))]" />
      </div>

      {/* Main dashboard chrome */}
      <div className="relative mx-auto flex h-screen max-w-[1480px] px-4 py-4">
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-[0_42px_120px_rgba(0,0,0,0.85)] backdrop-blur-xl flex">
          {/* Sidebar */}
          <aside className="w-72 border-r border-slate-800/80 bg-slate-950/75 flex flex-col">
            <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-800/80 bg-slate-950/80">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.45)]">
                <Code2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  MCP AI Agent
                </span>
                <span className="text-[11px] text-slate-500">Repository View</span>
              </div>
            </div>

            <div className="px-3 py-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500 border-b border-slate-800/80 bg-slate-950/80">
              <span className="inline-flex items-center gap-1.5">
                <FolderTree className="h-3 w-3" />
                File Explorer
              </span>
              <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                MCP
              </span>
            </div>

            <div className="flex-1 overflow-auto px-2 pb-4 custom-scroll">
              <FileTree nodes={mockTree} />
            </div>
          </aside>

          {/* Main + Right Panel */}
          <main className="flex-1 flex bg-slate-950/60">
            <section className="flex-1 flex flex-col border-r border-slate-800/80 bg-slate-950/60">
              {/* Top bar */}
              <header className="h-14 border-b border-slate-800/80 flex items-center justify-between px-4 bg-slate-950/80">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-slate-100 text-sm font-medium">
                    <Wand2 className="h-4 w-4 text-emerald-400" />
                    Agent Console
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="h-[1px] w-6 bg-slate-700" />
                    <span>MCP‑powered repository assistant</span>
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-2.5 py-0.5 text-[11px] text-slate-400">
                  <span className="relative h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/70 opacity-70 animate-ping" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </div>
              </header>

              {/* Quick Actions */}
              <QuickActionsBar onQuickAction={onQuickAction} />

              {/* Chat Area */}
              <div className="flex-1 overflow-hidden">{children}</div>
            </section>

            {/* Right Panel */}
            <aside className="w-[26rem] bg-slate-950/70 border-l border-slate-800/80 flex flex-col">
              <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-4 bg-slate-950/80">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <FileCode2 className="h-4 w-4 text-emerald-400" />
                    <span className="uppercase tracking-[0.16em] text-[11px]">
                      Action Preview
                    </span>
                  </span>
                </div>
                <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                  Read‑only
                </span>
              </div>

              <div className="flex-1 overflow-auto p-4 custom-scroll">
                {selectedPreview ? (
                  <pre className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-3 text-xs text-slate-100 font-mono leading-relaxed shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
                    {selectedPreview}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Agent-generated documentation, diffs, and fixes will appear
                    here as the assistant works.
                  </div>
                )}
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}

function FileTree({ nodes }: { nodes: FileNode[] }) {
  return (
    <div className="space-y-0.5 text-xs text-slate-300">
      {nodes.map((node) => (
        <FileNodeRow key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

import { useState } from "react";

function FileNodeRow({ node, depth }: { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(node.type === "folder");

  const paddingLeft = 4 + depth * 12;

  const icon =
    node.type === "folder" ? (
      open ? (
        <ChevronDown className="h-3 w-3 text-slate-500" />
      ) : (
        <ChevronRight className="h-3 w-3 text-slate-500" />
      )
    ) : (
      <FileCode2 className="h-3 w-3 text-slate-500" />
    );

  return (
    <div>
      <button
        type="button"
        className="group flex items-center w-full rounded-md px-1 py-1.5 hover:bg-slate-900/70 transition-colors"
        style={{ paddingLeft }}
        onClick={() => node.type === "folder" && setOpen((o) => !o)}
      >
        <span className="mr-1.5 flex items-center justify-center">{icon}</span>
        <span
          className={`truncate ${
            node.type === "folder"
              ? "font-medium text-slate-200"
              : "text-slate-300"
          } group-hover:text-slate-50`}
        >
          {node.name}
        </span>
      </button>
      {node.children && open && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <FileNodeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

type QuickActionsBarProps = {
  onQuickAction: (action: "scan" | "readme" | "refactor") => void;
};

function QuickActionsBar({ onQuickAction }: QuickActionsBarProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-950/70 px-3 py-2 flex items-center gap-2 text-xs">
      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mr-2">
        Quick Actions
      </span>
      <button
        onClick={() => onQuickAction("scan")}
        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 transition-colors"
      >
        <Bug className="h-3 w-3 text-emerald-400" />
        Scan for Bugs
      </button>
      <button
        onClick={() => onQuickAction("readme")}
        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 transition-colors"
      >
        <BookOpen className="h-3 w-3 text-emerald-400" />
        Generate README
      </button>
      <button
        onClick={() => onQuickAction("refactor")}
        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 transition-colors"
      >
        <Braces className="h-3 w-3 text-emerald-400" />
        Refactor Code
      </button>
    </div>
  );
}
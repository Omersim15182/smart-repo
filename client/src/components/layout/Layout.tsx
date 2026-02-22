// src/components/Layout.tsx
import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronRight,
  ChevronDown,
  Code2,
  Wand2,
  FileCode2,
} from "lucide-react";
import type { ChatMessage } from "../../App";

type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
};

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
    <div className="layout-root">
      {/* Ambient background gradients */}
      <div className="layout-background" />

      {/* Main dashboard chrome */}
      <div className="layout-container">
        <div className=\"layout-main-box\">
          {/* Sidebar */}
          <aside className=\"layout-sidebar\">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Code2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="sidebar-text-primary">
                MCP AI Agent
              </span>
              <span className="sidebar-text-secondary">
                Repository View
              </span>
            </div>
          </div>

          <div className="sidebar-badge">
            <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
              MCP
            </span>
          </div>

          <div className="sidebar-content" />
        </aside>

        {/* Main + Right Panel */}
        <main className="layout-main">
          <section className="layout-section">
            {/* Top bar */}
            <header className="layout-header">
              <div className="header-left">
                <span className="header-title">
                  <Wand2 className="h-4 w-4 text-emerald-400" />
                  Agent Console
                </span>
                <span className="header-divider">
                  <span className="h-[1px] w-6 bg-slate-700" />
                  <span>MCP‑powered repository assistant</span>
                </span>
              </div>
              <div className="header-status">
                <span className="relative h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/70 opacity-70 animate-ping" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </div>
            </header>
            <div className="layout-content">{children}</div>
          </section>

          {/* Right panel */}
          <aside className="layout-right-panel" />
        </main>
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
        className="file-node-button"
        style={{ paddingLeft }}
        onClick={() => node.type === "folder" && setOpen((o) => !o)}
      >
        <span className="mr-1.5 flex items-center justify-center">{icon}</span>
        <span
          className={`truncate ${
            node.type === "folder"
              ? "font-medium text-slate-200"
              : "text-slate-300"
          } hover:text-slate-50`}
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

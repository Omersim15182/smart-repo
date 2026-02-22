// src/components/Layout.tsx
import type { ReactNode } from "react";
import { Code2, Wand2 } from "lucide-react";
import type { ChatMessage } from "../../App";

type LayoutProps = {
  children: ReactNode;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  selectedPreview: string | null;
  onSelectPreview: (code?: string) => void;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-root">
      {/* Ambient background gradients */}
      <div className="layout-background" />

      {/* Main dashboard chrome */}
      <div className="layout-container">
        <div className="layout-main-box">
          {/* Sidebar */}
          <aside className="layout-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <Code2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="sidebar-text-primary">MCP AI Agent</span>
                <span className="sidebar-text-secondary">Repository View</span>
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
    </div>
  );
}

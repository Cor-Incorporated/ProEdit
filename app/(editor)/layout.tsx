import { ReactNode } from "react";

/**
 * Editor layout
 * Provides the main editor interface structure
 */
export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Editor toolbar */}
      <header className="editor-toolbar h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">ProEdit</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* User menu and actions will go here */}
        </div>
      </header>

      {/* Main editor content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

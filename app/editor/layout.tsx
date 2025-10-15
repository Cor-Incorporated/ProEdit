import { ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, LogOut, User } from "lucide-react";
import { getUser } from "@/app/actions/auth";
import { signOut } from "@/app/actions/auth";

/**
 * Editor layout
 * Provides the main editor interface structure with authentication and navigation
 */
export default async function EditorLayout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Editor toolbar */}
      <header className="editor-toolbar h-14 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/editor" className="text-lg font-semibold hover:text-primary transition-colors">
            ProEdit
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/editor">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">サインイン中</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut}>
                    <button type="submit" className="w-full flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      サインアウト
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main editor content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

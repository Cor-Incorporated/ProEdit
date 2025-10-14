import { ReactNode } from "react";

/**
 * Authentication layout
 * Used for login and callback pages
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">{children}</div>
    </div>
  );
}

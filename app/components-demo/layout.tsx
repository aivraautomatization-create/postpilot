import { redirect } from "next/navigation";

/**
 * Gate: component demos are dev-only.
 * In production, redirect to dashboard to avoid shipping unnecessary routes + assets.
 */
export default function ComponentsDemoLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

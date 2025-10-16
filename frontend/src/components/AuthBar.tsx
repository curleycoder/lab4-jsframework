// /frontend/src/components/AuthBar.tsx
import * as React from "react";

type User = { email?: string; sub?: string } | null;

export function AuthBar() {
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState(true);

  const loadUser = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", { credentials: "include" }); // ✅ include cookies
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUser();
    const onFocus = () => loadUser();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadUser]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">Checking session…</div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {user ? (
        <>
          <span className="text-muted-foreground">
            {user.email ?? user.sub}
          </span>
          <a
            className="rounded bg-primary px-3 py-1 text-primary-foreground"
            href="/api/auth/logout"
          >
            Logout
          </a>
        </>
      ) : (
        <a
          className="rounded bg-primary px-3 py-1 text-primary-foreground"
          href="/api/auth/login"
        >
          Login
        </a>
      )}
    </div>
  );
}

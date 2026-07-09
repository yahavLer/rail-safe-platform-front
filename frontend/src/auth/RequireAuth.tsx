import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { session } from "./session";

export function RequireAuth() {
  const location = useLocation();
  const user = session.getUser();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children: ReactElement }) {
  const user = session.getUser();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

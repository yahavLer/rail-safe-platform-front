import { Navigate } from "react-router-dom";

const ORG_ID_KEY = "railsafe.orgId";
const SESSION_KEY = "railsafe.session";

export default function Bootstrap() {
  const orgId = localStorage.getItem(ORG_ID_KEY);
  const session = localStorage.getItem(SESSION_KEY);

  if (!orgId) return <Navigate to="/signup/org" replace />;
  if (!session) return <Navigate to="/login" replace />;

  return <Navigate to="/" replace />;
}

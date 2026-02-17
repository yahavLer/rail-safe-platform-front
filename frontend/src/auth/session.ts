import type { UserBoundary } from "@/api/types";

export const SESSION_KEY = "railsafe.session";
export const ORG_ID_KEY = "railsafe.orgId";

export const session = {
  setUser(user: UserBoundary) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  getUser(): UserBoundary | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserBoundary) : null;
  },
  clearUser() {
    localStorage.removeItem(SESSION_KEY);
  },

  setOrgId(orgId: string) {
    localStorage.setItem(ORG_ID_KEY, orgId);
  },
  getOrgId() {
    return localStorage.getItem(ORG_ID_KEY) || "";
  },
  clearOrgId() {
    localStorage.removeItem(ORG_ID_KEY);
  },
};

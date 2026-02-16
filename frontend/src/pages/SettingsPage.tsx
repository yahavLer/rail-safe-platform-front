// src/pages/SettingsPage.tsx
import { useEffect, useState } from "react";
import { Settings, Copy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SETTINGS_KEY = "railsafe.ui.settings.v1";
const SESSION_KEY = "railsafe.session";

type UiSettings = {
  showDevLinks: boolean;
};

function loadSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { showDevLinks: false };
    return { showDevLinks: false, ...JSON.parse(raw) };
  } catch {
    return { showDevLinks: false };
  }
}

function saveSettings(s: UiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UiSettings>(() => loadSettings());
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const env = {
    VITE_API_BASE_URL: (import.meta as any)?.env?.VITE_API_BASE_URL,
    VITE_USER_API: (import.meta as any)?.env?.VITE_USER_API,
    VITE_ORG_API: (import.meta as any)?.env?.VITE_ORG_API,
    VITE_RISK_API: (import.meta as any)?.env?.VITE_RISK_API,
    VITE_TASK_API: (import.meta as any)?.env?.VITE_TASK_API,
    VITE_IMAGE_API: (import.meta as any)?.env?.VITE_IMAGE_API,
    VITE_ORG_ID: (import.meta as any)?.env?.VITE_ORG_ID,
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">הגדרות</h1>
        </div>
        <p className="mt-1 text-muted-foreground">הגדרות ממשק ותצוגת מידע מערכתית</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>הגדרות ממשק</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">הצגת קישורי Dev בסרגל</div>
            <div className="text-sm text-muted-foreground">
              מאפשר להציג עמודים זמניים/בדיקות (אם קיימים).
            </div>
          </div>
          <Switch
            checked={settings.showDevLinks}
            onCheckedChange={(v) => setSettings((p) => ({ ...p, showDevLinks: v }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מידע סשן</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {session ? (
            <>
              <div>
                <span className="text-muted-foreground">משתמש: </span>
                <span className="font-medium">{session.firstName} {session.lastName}</span>{" "}
                <Badge variant="outline">{session.role ?? "UNKNOWN"}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">OrgId: </span>
                <span className="font-mono text-sm">{session.orgId ?? "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{session.email ?? "-"}</span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">אין סשן בלוקאל סטורג׳.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Object.entries(env).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 border-b pb-2">
              <div className="font-mono">{k}</div>
              <div className="flex items-center gap-2">
                <div className="max-w-[520px] truncate text-muted-foreground">{String(v ?? "")}</div>
                <Button size="icon" variant="ghost" onClick={() => copy(String(v ?? ""))}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

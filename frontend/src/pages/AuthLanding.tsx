import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Train } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Train className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">RiskBox AI</h1>
            <p className="mt-2 text-muted-foreground">כניסה מאובטחת למערכת ניהול הסיכונים</p>
          </div>
        </div>

        <div className="card-elevated space-y-3 p-6">
          <Button className="h-12 w-full justify-center gap-2" onClick={() => navigate("/login")}>
            <LogIn className="h-5 w-5" />
            התחברות
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full justify-center gap-2"
            onClick={() => navigate("/signup/org")}
          >
            <UserPlus className="h-5 w-5" />
            הרשמה
          </Button>
        </div>
      </div>
    </main>
  );
}

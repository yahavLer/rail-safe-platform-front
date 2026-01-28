import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Settings, ArrowRight } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import FrequencyLevelsTab from "./FrequencyLevelsTab";
import SeverityLevelsTab from "./SeverityLevelsTab";
import CategoriesTab from "./CategoriesTab";

import type { UserBoundary } from "@/api/types";

const SESSION_KEY = "railsafe.session";
const ORG_ID_KEY = "railsafe.orgId";

export default function RiskDefinitions() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserBoundary | null>(null);
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    // Check authentication and role
    const sessionStr = localStorage.getItem(SESSION_KEY);
    const savedOrgId = localStorage.getItem(ORG_ID_KEY);

    if (!sessionStr || !savedOrgId) {
      toast.error("אנא התחבר למערכת");
      navigate("/login");
      return;
    }

    try {
      const user: UserBoundary = JSON.parse(sessionStr);
      
      if (user.role !== "CHIEF_RISK_MANAGER") {
        toast.error("אין לך הרשאה לצפות בדף זה");
        navigate("/");
        return;
      }

      setCurrentUser(user);
      setOrgId(savedOrgId);
    } catch (e) {
      toast.error("שגיאה בטעינת פרטי משתמש");
      navigate("/login");
    }
  }, [navigate]);

  const handleContinueToDashboard = () => {
    navigate("/");
  };

  if (!currentUser || !orgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">הגדרות מערכת סיכונים</h1>
          </div>
          <p className="text-muted-foreground">
            הגדר את פרמטרי החומרה, התדירות וקטגוריות הסיכונים עבור הארגון
          </p>
        </div>
        
        <Button onClick={handleContinueToDashboard} variant="outline" size="lg">
          המשך לדשבורד
          <ArrowRight className="mr-2 h-4 w-4" />
        </Button>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>ברוך הבא, {currentUser.firstName || currentUser.email}!</CardTitle>
          <CardDescription>
            כמנהל סיכונים ראשי, עליך להגדיר את פרמטרי הסיכונים הבסיסיים לפני שמשתמשים אחרים יוכלו להתחיל לעבוד במערכת.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="frequency" dir="rtl" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="frequency">רמות תדירות</TabsTrigger>
          <TabsTrigger value="severity">רמות חומרה</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות סיכון</TabsTrigger>
        </TabsList>

        <TabsContent value="frequency" className="mt-6">
          <FrequencyLevelsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="severity" className="mt-6">
          <SeverityLevelsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
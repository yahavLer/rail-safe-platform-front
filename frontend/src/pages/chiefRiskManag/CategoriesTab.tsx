import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertCircle, GripVertical } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { organizationService } from "@/api/services/organizationService";
import type { CategoryBoundary } from "@/api/types";

interface Props {
  orgId: string;
}

export default function CategoriesTab({ orgId }: Props) {
  const [categories, setCategories] = useState<CategoryBoundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryBoundary | null>(null);

  useEffect(() => {
    loadCategories();
  }, [orgId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const list = await organizationService.listCategories(orgId);
      setCategories(list.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (e: any) {
      toast.error("שגיאה בטעינת קטגוריות", {
        description: e?.response?.data?.message || e?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (code: string, name: string) => {
    try {
      const displayOrder = categories.length + 1;
      await organizationService.createCategory(orgId, { code, name, displayOrder });
      toast.success("הקטגוריה נוספה בהצלחה");
      setShowCreateDialog(false);
      loadCategories();
    } catch (e: any) {
      toast.error("שגיאה ביצירת קטגוריה", {
        description: e?.response?.data?.message || e?.message,
      });
    }
  };

  const handleUpdate = async (categoryId: string, name: string) => {
    try {
      await organizationService.updateCategory(orgId, categoryId, { name });
      toast.success("הקטגוריה עודכנה בהצלחה");
      setEditingCategory(null);
      loadCategories();
    } catch (e: any) {
      toast.error("שגיאה בעדכון קטגוריה", {
        description: e?.response?.data?.message || e?.message,
      });
    }
  };

  const handleToggleActive = async (category: CategoryBoundary) => {
    try {
      await organizationService.updateCategory(orgId, category.id, { active: !category.active });
      toast.success(category.active ? "הקטגוריה הושבתה" : "הקטגוריה הופעלה");
      loadCategories();
    } catch (e: any) {
      toast.error("שגיאה בעדכון סטטוס קטגוריה", {
        description: e?.response?.data?.message || e?.message,
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו?")) return;

    try {
      await organizationService.deleteCategory(orgId, categoryId);
      toast.success("הקטגוריה נמחקה בהצלחה");
      loadCategories();
    } catch (e: any) {
      toast.error("שגיאה במחיקת קטגוריה", {
        description: e?.response?.data?.message || e?.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          קטגוריות הסיכון משמשות לסיווג וארגון סיכונים במערכת. ניתן להגדיר קטגוריות בהתאם לתחומי פעילות הארגון
          (כגון חשמל, מים, תחבורה וכו').
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>קטגוריות סיכון</CardTitle>
              <CardDescription>נהל את קטגוריות הסיכונים של הארגון</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  הוסף קטגוריה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CreateCategoryDialog onSubmit={handleCreate} onCancel={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>לא הוגדרו קטגוריות עדיין</p>
              <p className="text-sm mt-2">לחץ על "הוסף קטגוריה" כדי להתחיל</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>קוד</TableHead>
                  <TableHead>שם הקטגוריה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.active ? "default" : "secondary"}>
                        {category.active ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.active ? "השבת" : "הפעל"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <EditCategoryDialog
              category={editingCategory}
              onSubmit={(name) => handleUpdate(editingCategory.id, name)}
              onCancel={() => setEditingCategory(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Create Category Dialog
function CreateCategoryDialog({ onSubmit, onCancel }: { onSubmit: (code: string, name: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!code.trim() || !name.trim()) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    onSubmit(code.trim(), name.trim());
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>הוסף קטגוריית סיכון</DialogTitle>
        <DialogDescription>הגדר קטגוריה חדשה לסיווג סיכונים במערכת</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="code">קוד קטגוריה</Label>
          <Input
            id="code"
            placeholder='לדוגמה: "GH1"'
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            קוד ייחודי לזיהוי הקטגוריה (באנגלית, עד 10 תווים)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">שם הקטגוריה</Label>
          <Input
            id="name"
            placeholder='לדוגמה: "חשמל"'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button onClick={handleSubmit}>צור קטגוריה</Button>
      </DialogFooter>
    </>
  );
}

// Edit Category Dialog
function EditCategoryDialog({
  category,
  onSubmit,
  onCancel,
}: {
  category: CategoryBoundary;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("יש למלא שם קטגוריה");
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>ערוך קטגוריה</DialogTitle>
        <DialogDescription>
          עדכן את שם הקטגוריה <Badge variant="outline" className="mx-1">{category.code}</Badge>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">שם הקטגוריה</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button onClick={handleSubmit}>עדכן</Button>
      </DialogFooter>
    </>
  );
}
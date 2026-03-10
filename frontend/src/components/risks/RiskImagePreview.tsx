import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RiskImagePreview({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return <span className="text-xs text-muted-foreground">אין תמונה</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={imageUrl}
        alt="תמונת סיכון"
        className="h-14 w-20 rounded-md border object-cover"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
      >
        <ImageIcon className="ml-2 h-4 w-4" />
        צפייה
      </Button>
    </div>
  );
}
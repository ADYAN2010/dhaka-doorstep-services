import { ImageIcon } from "lucide-react";
import { ImageUploader } from "./image-uploader";
import { useAppearance } from "@/components/appearance-provider";

export function BannerImageManager() {
  const { settings, update } = useAppearance();
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <ImageIcon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Hero banner image</div>
          <div className="text-xs text-muted-foreground">
            Optional background image behind the homepage hero search. Leave empty to use the
            brand gradient.
          </div>
        </div>
      </div>
      <ImageUploader
        label="Hero background"
        description="16:6 ratio · ≤4MB · darken filter applied automatically"
        value={settings.heroImageUrl}
        onChange={(url) => update({ heroImageUrl: url })}
        aspect="wide"
        maxMb={4}
      />
    </div>
  );
}

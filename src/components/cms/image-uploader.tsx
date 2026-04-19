import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide" | "logo";
  /** Max file size in MB. Defaults to 2MB for logos and 4MB for banners. */
  maxMb?: number;
};

/**
 * Lightweight image uploader that converts the picked file into a
 * data URL so the appearance preview can update instantly. For real
 * persistence the URL field also accepts a remote https URL.
 */
export function ImageUploader({
  label,
  description,
  value,
  onChange,
  aspect = "square",
  maxMb,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = maxMb ?? (aspect === "logo" ? 2 : 4);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > limit * 1024 * 1024) {
      toast.error(`Image is too large. Max ${limit}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      toast.success(`${label} updated`);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
        {value && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Remove
          </Button>
        )}
      </div>

      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50",
          aspect === "square" && "h-32 w-32",
          aspect === "logo" && "h-20 w-full max-w-[240px]",
          aspect === "wide" && "aspect-[16/6] w-full",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
            <span>Drop image or click upload</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="h-8 text-xs"
        >
          <Upload className="h-3 w-3" /> Upload
        </Button>
        <Input
          type="url"
          placeholder="or paste image URL"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

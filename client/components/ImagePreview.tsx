import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  onChangeImage: () => void;
  onFileSelected?: (file: File) => void;
}

export default function ImagePreview({
  src,
  alt = "Uploaded image preview",
  onChangeImage,
  onFileSelected,
}: ImagePreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelected) {
      onFileSelected(file);
    }
  };

  return (
    <div className="relative w-full h-full group">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-xl transition-all duration-300 group-hover:brightness-90"
      />

      {/* Overlay Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
        {onFileSelected && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full shadow-lg border-none bg-white text-foreground hover:bg-white/90"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Change
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="destructive"
          onClick={onChangeImage}
          className="rounded-full shadow-lg border-none"
        >
          <X className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";

interface VideoPreviewProps {
  src: string;
  alt?: string;
  onChangeVideo: () => void;
}

export default function VideoPreview({
  src,
  alt = "Uploaded b-roll video preview",
  onChangeVideo,
}: VideoPreviewProps) {
  return (
    <div className="relative w-full max-w-[420px]">
      <video
        src={src}
        controls
        className="w-full h-auto rounded-xl shadow-md ring-1 ring-border object-contain bg-muted max-h-[600px]"
        aria-label={alt}
      >
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
        <div className="pointer-events-auto">
          <Button size="sm" variant="secondary" onClick={onChangeVideo}>
            Change Video
          </Button>
        </div>
      </div>
    </div>
  );
}


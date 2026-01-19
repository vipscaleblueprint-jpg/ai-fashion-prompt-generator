import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Merge, Sparkles, Loader2 } from "lucide-react";

interface PromptCardProps {
  title: string;
  prompt: string;
  isLoading?: boolean;
  onCombine?: () => void;
  showCombineButton?: boolean;
  onRandomize?: () => void;
  showRandomizeButton?: boolean;
  isRandomizing?: boolean;
}

export default function PromptCard({
  title,
  prompt = "",
  isLoading,
  onCombine,
  showCombineButton,
  onRandomize,
  showRandomizeButton,
  isRandomizing
}: PromptCardProps) {
  const chars = prompt ? prompt.length : 0;
  const handleCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm h-full">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {showCombineButton && onCombine && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onCombine}
              aria-label={`Combine ${title}`}
              disabled={isLoading || !prompt}
            >
              <Merge className="mr-2 h-4 w-4" /> Combine
            </Button>
          )}
          {showRandomizeButton && onRandomize && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRandomize}
              disabled={isLoading || isRandomizing || !prompt}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
            >
              {isRandomizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Randomize
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            aria-label={`Copy ${title}`}
            disabled={isLoading || !prompt}
          >
            <Copy className="mr-2" /> Copy
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-32 w-full animate-pulse space-y-2 p-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
      ) : (
        <Textarea
          value={prompt}
          readOnly
          className="min-h-32 text-sm leading-relaxed"
        />
      )}

      <div className="text-xs text-foreground/60">
        {isLoading ? "Analyzing..." : `${chars} characters`}
      </div>
    </div>
  );
}

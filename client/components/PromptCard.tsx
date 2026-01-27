import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Merge, Sparkles, Loader2, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  title: string;
  prompt: string;
  isLoading?: boolean;
  onCombine?: () => void;
  showCombineButton?: boolean;
  onRandomize?: () => void;
  showRandomizeButton?: boolean;
  isRandomizing?: boolean;
  isMaster?: boolean;
}

export default function PromptCard({
  title,
  prompt = "",
  isLoading,
  onCombine,
  showCombineButton,
  onRandomize,
  showRandomizeButton,
  isRandomizing,
  isMaster = false
}: PromptCardProps) {
  const chars = prompt ? prompt.length : 0;

  const handleCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  };

  const isAnalysis = title.toLowerCase().includes("analysis");

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border transition-all duration-300 group h-full overflow-hidden",
        isMaster
          ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
          : "border-border/50 bg-white/60 backdrop-blur-sm hover:border-primary/30 hover:shadow-md",
        isLoading && "animate-pulse"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between gap-2 px-5 py-4 border-b",
        isMaster ? "border-primary/20 bg-primary/10" : "border-border/50 bg-gray-50/50"
      )}>
        <div className="flex items-center gap-2">
          {isAnalysis && <Calculator className="w-4 h-4 text-blue-500" />}
          {isMaster && <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />}
          {!isAnalysis && !isMaster && <Sparkles className="w-4 h-4 text-purple-500" />}
          <h3 className={cn(
            "font-bold text-sm uppercase tracking-wider",
            isMaster ? "text-primary" : "text-foreground/80"
          )}>
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {showCombineButton && onCombine && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCombine}
              disabled={isLoading || !prompt}
              className="h-8 text-xs font-semibold hover:bg-primary/20 text-primary transition-colors"
            >
              <Merge className="mr-1.5 h-3.5 w-3.5" /> Combine
            </Button>
          )}
          {showRandomizeButton && onRandomize && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRandomize}
              disabled={isLoading || isRandomizing || !prompt}
              className="h-8 text-xs font-semibold bg-purple-100/50 text-purple-700 hover:bg-purple-200/50 border border-purple-200/50"
            >
              {isRandomizing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              Randomize
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={isLoading || !prompt}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 transition-colors"
            title="Copy Prompt"
          >
            <Copy className="h-4 w-4 text-foreground/60" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-grow flex flex-col gap-3">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-3 bg-gray-200/60 rounded-full w-full"></div>
            <div className="h-3 bg-gray-200/60 rounded-full w-5/6"></div>
            <div className="h-3 bg-gray-200/60 rounded-full w-4/6"></div>
            <div className="h-3 bg-gray-200/60 rounded-full w-full"></div>
          </div>
        ) : (
          <Textarea
            value={prompt}
            readOnly
            placeholder="Analysis text will appear here..."
            className={cn(
              "min-h-[140px] text-sm leading-relaxed border-none bg-transparent focus-visible:ring-0 p-0 resize-none scrollbar-hide font-medium text-foreground/90",
              !prompt && "italic text-foreground/40"
            )}
          />
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            {isLoading ? "Analyzing Source..." : `${chars} Characters`}
          </div>
          {!isLoading && prompt && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          )}
        </div>
      </div>
    </div>
  );
}

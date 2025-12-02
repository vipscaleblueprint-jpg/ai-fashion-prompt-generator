import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import VideoUploadZone from "@/components/VideoUploadZone";
import VideoPreview from "@/components/VideoPreview";
import ResultsSection from "@/components/ResultsSection";
import { handleBrollVideoSubmission } from "@/lib/broll-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function BrollToPrompt() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileSelected = (f: File) => {
    setFile(f);
    setPrompts(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const resetAll = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPrompts(null);
    setError(null);
    setStatus("Idle");
  };

  const startProgressMessages = () => {
    const messages = [
      "Analyzing your b-roll video...",
      "Generating professional prompt...",
    ];
    let i = 0;
    setStatus(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setStatus(messages[i]);
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    const stop = startProgressMessages();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const out = await handleBrollVideoSubmission(file, {
        signal: controller.signal,
      });
      // Only use the first prompt (1 variation)
      const singlePrompt = out.length > 0 ? [out[0]] : [];
      setPrompts(singlePrompt);
      // Persist to history with the original file
      try {
        await addHistoryEntry({ file, prompts: singlePrompt });
      } catch {}
      toast.success("Prompts generated successfully");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Request canceled");
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError("Analysis failed. Please try a different video.");
      }
    } finally {
      stop();
      setIsLoading(false);
      setStatus("Idle");
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="container mx-auto py-10">
      <section className="mb-10">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            AI B-Roll to Prompt Generator
          </h1>
          <p className="text-foreground/80 text-lg">
            Transform your b-roll videos into professional photography prompts
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          {!file ? (
            <VideoUploadZone onFileSelected={onFileSelected} />
          ) : (
            <VideoPreview src={previewUrl!} onChangeVideo={resetAll} />
          )}
        </div>

        <div className="space-y-6">
          {!prompts && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Get Started
              </h2>
              <p className="text-sm text-foreground/70 mb-4">
                Upload a MP4, MOV, WebM, or AVI video up to 100MB. Then click Generate
                to receive a detailed b-roll photography prompt.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!file || isLoading}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    "Generate Prompts"
                  )}
                </Button>
                {isLoading && (
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2" /> Cancel
                  </Button>
                )}
                {file && !isLoading && (
                  <Button variant="ghost" onClick={resetAll}>
                    Try Another Video
                  </Button>
                )}
              </div>
              <div className="mt-4 text-sm text-foreground/70">
                <p>Estimated time: This usually takes 30-60 seconds</p>
                {isLoading && <p className="mt-1 text-primary">{status}</p>}
                {error && <p className="mt-2 text-destructive">{error}</p>}
              </div>
            </div>
          )}

          {prompts && <ResultsSection prompts={prompts} />}
        </div>
      </div>
    </div>
  );
}


import PromptCard from "./PromptCard";
import { Button } from "@/components/ui/button";

interface ResultsSectionProps {
  prompts: string[] | null;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsSection({ prompts }: ResultsSectionProps) {
  const hasPrompts = prompts && prompts.length > 0;

  const handleDownloadText = () => {
    if (!hasPrompts) return;
    const text = prompts
      .map((p) => p)
      .join("\n\n---\n\n");
    download("fashion-prompt.txt", text, "text/plain;charset=utf-8");
  };

  const handleDownloadJson = () => {
    if (!hasPrompts) return;
    const json = JSON.stringify(
      { input: prompts.map((p) => ({ prompt: p })) },
      null,
      2,
    );
    download("fashion-prompts.json", json, "application/json;charset=utf-8");
  };

  return (
    <section className="space-y-4">
      {hasPrompts && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              Your Fashion Photography Prompt{prompts.length > 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownloadText}>
                Download as Text
              </Button>
              <Button onClick={handleDownloadJson}>Download Prompt</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {prompts.map((p, i) => (
              <PromptCard key={i} title={prompts.length > 1 ? `Variation ${i + 1}` : "Generated Prompt"} prompt={p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

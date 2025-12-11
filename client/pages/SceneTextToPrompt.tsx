import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ResultsSection from "@/components/ResultsSection";
import { handleSceneTextSubmission } from "@/lib/scene-text-webhook";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function SceneTextToPrompt() {
    const [sceneText, setSceneText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [prompts, setPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const startProgressMessages = () => {
        const messages = [
            "Analyzing your text...",
            "Generating detailed scene...",
            "Finalizing prompt...",
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
        if (!sceneText.trim()) return;
        setIsLoading(true);
        setError(null);
        const stop = startProgressMessages();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const out = await handleSceneTextSubmission(sceneText, {
                signal: controller.signal,
            });
            // Only use the first prompt (1 variation)
            const singlePrompt = out.length > 0 ? [out[0]] : [];
            setPrompts(singlePrompt);
            toast.success("Prompts generated successfully");
        } catch (e: any) {
            if (e?.name === "AbortError") {
                setError("Request canceled");
            } else if (e?.message) {
                setError(e.message);
            } else {
                setError("Generation failed. Please try again.");
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
                        AI Scene Text to Prompt Generator
                    </h1>
                    <p className="text-foreground/80 text-lg">
                        Transform your text description into professional prompts
                    </p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            Describe your scene
                        </h2>
                        <textarea
                            className="w-full min-h-[300px] p-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            placeholder="E.g., A futuristic cyberpunk city street at night with neon signs reflecting in rain puddles..."
                            value={sceneText}
                            onChange={(e) => setSceneText(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {!prompts && (
                        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                Get Started
                            </h2>
                            <p className="text-sm text-foreground/70 mb-4">
                                Enter your scene description above. Then click Generate
                                to receive a detailed scene text prompt.
                            </p>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!sceneText.trim() || isLoading}
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
                                {sceneText && !isLoading && (
                                    <Button variant="ghost" onClick={() => setSceneText("")}>
                                        Clear Text
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

                    {prompts && (
                        <>
                            <ResultsSection prompts={prompts} />
                            <div className="flex justify-center mt-6">
                                <Button variant="outline" onClick={() => {
                                    setPrompts(null);
                                    setStatus("Idle");
                                    setSceneText("");
                                }}>
                                    Start New Scene
                                </Button>
                                <Button variant="ghost" className="ml-2" onClick={() => {
                                    setPrompts(null);
                                    setStatus("Idle");
                                }}>
                                    Edit & Regenerate
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

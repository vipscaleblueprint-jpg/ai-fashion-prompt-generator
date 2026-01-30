import { useState, useEffect } from "react";
import PromptCard from "./PromptCard";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Video, Download } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface ResultsSectionProps {
  prompts: string[] | null;
  labels?: string[];
  combinedPromptFooter?: string;
  isFetchingFaceProfile?: boolean;
  isFetchingBodyProfile?: boolean;
  // Kling Generator Props
  klingPrompt?: string | null;
  isGeneratingKling?: boolean;
  onGenerateKling?: (prompt: string) => void;
  // Kling Video Generator Props
  startFrameImage?: File | null;
  endFrameImage?: File | null;
  isGeneratingKlingVideo?: boolean;
  videoStatus?: string; // Status text from polling
  videoUrl?: string | null; // Final video URL
  onGenerateKlingVideo?: (
    params: {
      prompt: string;
      negativePrompt: string;
      cfgScale: string;
      mode: string;
      duration: string;
      version: string;
      aspectRatio: string;
      startFrame: File;
      endFrame: File;
    }
  ) => void;
  // Regeneration Props
  onRegenerate?: () => void;
  isLoading?: boolean;
  hideAnalysis?: boolean;
  hideVariations?: boolean;
  hideMasterRandomize?: boolean;
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

export default function ResultsSection({
  prompts,
  labels,
  combinedPromptFooter,
  isFetchingFaceProfile,
  isFetchingBodyProfile,
  klingPrompt,
  isGeneratingKling,
  onGenerateKling,
  startFrameImage,
  endFrameImage,
  isGeneratingKlingVideo,
  videoStatus,
  videoUrl,
  onGenerateKlingVideo,
  onRegenerate,
  isLoading: isRegenerating,
  hideAnalysis = false,
  hideVariations = false,
  hideMasterRandomize = false
}: ResultsSectionProps) {
  const hasPrompts = (prompts && prompts.length > 0);
  const showSection = hasPrompts || isFetchingFaceProfile || isFetchingBodyProfile;

  // Track which fashion prompt is selected for combining
  const [selectedFashionPromptIndex, setSelectedFashionPromptIndex] = useState<number>(0);

  // Local state for video generator
  const [videoSceneInput, setVideoSceneInput] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const [localStartFrame, setLocalStartFrame] = useState<File | null>(null);
  const [localStartPreview, setLocalStartPreview] = useState<string | null>(null);
  const [localEndFrame, setLocalEndFrame] = useState<File | null>(null);
  const [localEndPreview, setLocalEndPreview] = useState<string | null>(null);

  // New fields state
  const [negativePrompt, setNegativePrompt] = useState("blur, jitter, artifacts, distortion");
  const [cfgScale, setCfgScale] = useState("0.5");
  const [mode, setMode] = useState("pro");
  const [duration, setDuration] = useState("5");
  const [version, setVersion] = useState("1.6");

  // Combined Prompt Randomizer State
  const [randomizedCombinedPrompt, setRandomizedCombinedPrompt] = useState("");
  const [isRandomizingCombined, setIsRandomizingCombined] = useState(false);

  // Helper function to get combined prompt content
  const getCombinedPromptContent = () => {
    if (!prompts || prompts.length === 0) return "";

    const analysisCount = labels ? labels.length : 0;
    const analysisPrompts = prompts.slice(0, analysisCount).filter(p => p && p.trim() !== "");

    // Get the selected variant prompt
    const variantPrompt = (prompts[selectedFashionPromptIndex] && prompts[selectedFashionPromptIndex].trim() !== "")
      ? prompts[selectedFashionPromptIndex]
      : "";

    let combinedParts: string[] = [];

    // Add analysis prompts if they exist
    if (analysisPrompts.length > 0) {
      combinedParts = combinedParts.concat(analysisPrompts);
    }

    // Add the selected variant prompt if it exists (only if it's not already in analysis)
    if (variantPrompt && selectedFashionPromptIndex >= analysisCount) {
      combinedParts.push(variantPrompt);
    }

    // If no prompts are combined yet, and there are prompts, just take the first non-empty one as a fallback
    if (combinedParts.length === 0 && prompts.length > 0) {
      const firstNonEmpty = prompts.find(p => p && p.trim() !== "");
      if (firstNonEmpty) {
        combinedParts.push(firstNonEmpty);
      }
    }

    // Deduplicate strings to prevent any double-counting (especially common in B-roll tools)
    const uniqueParts = combinedParts.reduce((acc: string[], current: string) => {
      const trimmed = current.trim();
      if (trimmed && !acc.some(p => p.trim() === trimmed)) {
        acc.push(trimmed);
      }
      return acc;
    }, []);

    let result = uniqueParts.join("\n\n");

    // Always add the footer if it exists
    if (combinedPromptFooter) {
      result = result + "\n\n" + combinedPromptFooter;
    }

    return result;
  };

  const combinedPromptContent = getCombinedPromptContent();

  // Initialize video scene input when prompts change
  useEffect(() => {
    if (klingPrompt) {
      const parseKlingPrompt = (prompt: string) => {
        const negativeMarkers = [
          /negative\s*prompt\s*[:：]\s*/i,
          /negative\s*[:：]\s*/i,
          /\[negative\s*prompt\]\s*[:：]?\s*/i,
          /\[negative\]\s*[:：]?\s*/i
        ];

        let sceneContent = prompt;
        let negativeContent = "";

        for (const marker of negativeMarkers) {
          const match = prompt.match(marker);
          if (match) {
            const splitIndex = match.index! + match[0].length;
            const beforeNegative = prompt.substring(0, match.index!).trim();
            const afterNegative = prompt.substring(splitIndex).trim();

            const negativeEndMatch = afterNegative.match(/\n\n|\r\n\r\n/);
            if (negativeEndMatch) {
              negativeContent = afterNegative.substring(0, negativeEndMatch.index!).trim();
              sceneContent = beforeNegative + "\n\n" + afterNegative.substring(negativeEndMatch.index! + negativeEndMatch[0].length).trim();
            } else {
              negativeContent = afterNegative;
              sceneContent = beforeNegative;
            }
            break;
          }
        }
        return { sceneContent, negativeContent };
      };

      const { sceneContent, negativeContent } = parseKlingPrompt(klingPrompt);
      setVideoSceneInput(sceneContent);
      if (negativeContent) setNegativePrompt(negativeContent);
    } else if (hasPrompts) {
      setVideoSceneInput(combinedPromptContent);
    }
  }, [prompts, combinedPromptFooter, klingPrompt, selectedFashionPromptIndex, combinedPromptContent]);

  // Reset selected index when prompts change
  useEffect(() => {
    if (prompts && prompts.length > 0) {
      const analysisCount = labels ? labels.length : 0;
      const defaultIndex = prompts.length > analysisCount ? analysisCount : (prompts.length - 1);
      setSelectedFashionPromptIndex(Math.max(0, defaultIndex));
    }
  }, [prompts, labels]);

  // Handlers
  const handleStartFrameSelect = (f: File) => {
    setLocalStartFrame(f);
    setLocalStartPreview(URL.createObjectURL(f));
  };

  const handleEndFrameSelect = (f: File) => {
    setLocalEndFrame(f);
    setLocalEndPreview(URL.createObjectURL(f));
  };

  const handleRandomizeCombinedPrompt = async () => {
    if (!combinedPromptContent) return;
    setIsRandomizingCombined(true);
    try {
      const formData = new FormData();
      formData.append("combined_prompt", combinedPromptContent);
      const res = await fetch("https://n8n.srv1151765.hstgr.cloud/webhook/ramdomize-comPrompt", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Randomization failed");
      const data = await res.json();
      let result = typeof data === "string" ? data : (data[0]?.output || data?.output || JSON.stringify(data));
      if (combinedPromptFooter) result = result + "\n\n" + combinedPromptFooter;
      setRandomizedCombinedPrompt(result);
      toast.success("Combined prompt randomized successfully");
    } catch (error) {
      toast.error("Failed to randomize combined prompt");
    } finally {
      setIsRandomizingCombined(false);
    }
  };

  const handleDownloadText = () => {
    if (!hasPrompts) return;
    const text = prompts!.join("\n\n---\n\n");
    download("fashion-prompt.txt", text, "text/plain;charset=utf-8");
  };

  const handleDownloadJson = () => {
    if (!hasPrompts) return;
    download("fashion-prompts.json", JSON.stringify({ input: prompts.map(p => ({ prompt: p })) }, null, 2), "application/json;charset=utf-8");
  };

  const getTitle = (i: number) => {
    if (labels && labels[i]) return labels[i];
    const analysisCount = labels ? labels.length : 0;
    if (i >= analysisCount) {
      const variantNum = i - analysisCount + 1;
      return (prompts && prompts.length > analysisCount) ? `Variation ${variantNum}` : "Generated Prompt";
    }
    return "Generated Prompt";
  };

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {showSection && (
        <div className="space-y-10">
          {/* Header & Main Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/20 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Photography Workspace
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {prompts && prompts.length > 0
                  ? `${prompts.length} Prompts Generated Successfully`
                  : "Analyzing and generating your creative assets..."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {onRegenerate && (
                <Button
                  variant="default"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95 flex-grow md:flex-grow-0"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {(prompts && prompts.length > 0) ? "Regenerate" : "Generate"}
                    </>
                  )}
                </Button>
              )}
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/50 border-border/50 hover:bg-white/80 transition-colors flex-1 md:flex-none"
                  onClick={handleDownloadText}
                  disabled={!hasPrompts}
                >
                  <Download className="mr-2 h-4 w-4" /> .TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/50 border-border/50 hover:bg-white/80 transition-colors flex-1 md:flex-none"
                  onClick={handleDownloadJson}
                  disabled={!hasPrompts}
                >
                  <Download className="mr-2 h-4 w-4" /> .JSON
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Analysis Row: Face & Body */}
            {!hideAnalysis && (isFetchingFaceProfile || isFetchingBodyProfile || (hasPrompts && prompts!.slice(0, 2).some(p => p))) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Source Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(isFetchingFaceProfile || (hasPrompts && prompts![0])) && (
                    <PromptCard
                      title={getTitle(0)}
                      prompt={prompts ? (prompts[0] || "") : ""}
                      isLoading={isFetchingFaceProfile}
                    />
                  )}
                  {(isFetchingBodyProfile || (hasPrompts && prompts![1])) && (
                    <PromptCard
                      title={getTitle(1)}
                      prompt={prompts ? (prompts[1] || "") : ""}
                      isLoading={isFetchingBodyProfile}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Variations Grid */}
            {hasPrompts && prompts!.length > 2 && !hideVariations && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Creative Variations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
                  {prompts!.slice(2).map((p, idx) => {
                    const i = idx + 2;
                    if (!p && !labels?.[i]) return null;
                    return (
                      <PromptCard
                        key={i}
                        title={getTitle(i)}
                        prompt={p}
                        showCombineButton={true}
                        onCombine={() => {
                          setSelectedFashionPromptIndex(i);
                          toast.success("Design Applied to Master Prompt");
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Master Master Box: The focal point */}
            {hasPrompts && prompts!.some(p => p.trim() !== "") && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Master Output</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <PromptCard
                    key="combined"
                    title="Master Photography Prompt"
                    prompt={combinedPromptContent}
                    showRandomizeButton={!hideMasterRandomize}
                    onRandomize={handleRandomizeCombinedPrompt}
                    isRandomizing={isRandomizingCombined}
                    isMaster={true}
                  />

                  {randomizedCombinedPrompt && (
                    <PromptCard
                      key="randomized-combined"
                      title="Optimized Creative Prompt"
                      prompt={randomizedCombinedPrompt}
                      isMaster={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* AI Generator Tools */}
            {hasPrompts && (onGenerateKling || onGenerateKlingVideo) && (
              <div className="space-y-6 pt-10 border-t border-border/50">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Advanced AI Production</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Kling Prompt Gen */}
                  {onGenerateKling && (
                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-lg">Kling AI Scripting</h4>
                        </div>
                        <Button
                          onClick={() => onGenerateKling(combinedPromptContent)}
                          disabled={isGeneratingKling}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200"
                        >
                          {isGeneratingKling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Generator"}
                        </Button>
                      </div>

                      {klingPrompt ? (
                        <PromptCard title="Kling Prompt" prompt={klingPrompt} />
                      ) : (
                        <div className="h-[180px] rounded-2xl border border-dashed border-purple-300/50 bg-purple-50/30 flex items-center justify-center p-8 text-center">
                          <p className="text-sm text-purple-600/60 font-medium italic">
                            Convert your master prompt into a high-quality Kling AI production script.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Kling Video Gen */}
                  {onGenerateKlingVideo && (
                    <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/20 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                          <Video className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-lg">Cinema Engine (V2)</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="w-full aspect-video bg-gray-900 rounded-2xl border border-border overflow-hidden relative group shadow-2xl">
                          {videoUrl ? (
                            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950">
                              {isGeneratingKlingVideo || (videoStatus && videoStatus !== "Failed") ? (
                                <div className="space-y-4">
                                  <div className="relative">
                                    <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                                    <div className="absolute inset-0 blur-lg bg-orange-500/20 animate-pulse"></div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold text-white text-lg tracking-tight">{videoStatus || "Processing..."}</p>
                                    <p className="text-xs text-white/40 font-mono uppercase tracking-[0.2em]">Engines Polling</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 opacity-40 group-hover:opacity-60 transition-opacity">
                                  <Video className="w-12 h-12 text-white mx-auto" />
                                  <p className="text-sm text-white font-medium">Ready for render</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {videoUrl && (
                          <Button className="w-full bg-white text-black hover:bg-gray-100 rounded-xl" variant="outline" asChild>
                            <a href={videoUrl} download target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Export Production File
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Video Controls (Manual Expand/Style) */}
                {onGenerateKlingVideo && (
                  <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-border/50 shadow-inner">
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/60">Cinematic Script</Label>
                            <textarea
                              className="w-full min-h-[160px] p-5 rounded-2xl border border-border/50 bg-white text-sm leading-relaxed shadow-sm focus:ring-2 ring-orange-500/20 transition-all resize-none"
                              value={videoSceneInput}
                              onChange={(e) => setVideoSceneInput(e.target.value)}
                              placeholder="Describe the scene movement, lighting, and camera dynamics..."
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/60">Negative Prompt</Label>
                            <textarea
                              className="w-full min-h-[80px] p-4 rounded-2xl border border-border/50 bg-white text-sm leading-relaxed shadow-sm focus:ring-2 ring-orange-500/20 transition-all resize-none"
                              value={negativePrompt}
                              onChange={(e) => setNegativePrompt(e.target.value)}
                              placeholder="blur, jitter, artifacts, distortion..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-foreground/40">Duration (seconds)</Label>
                              <select
                                className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                              >
                                <option value="5">5s (Standard)</option>
                                <option value="10">10s (High Quality)</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-foreground/40">Quality Mode</Label>
                              <select
                                className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                              >
                                <option value="pro">Pro (Professional)</option>
                                <option value="std">Standard</option>
                              </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-foreground/40">Model Version</Label>
                              <select
                                className="w-full h-11 px-4 rounded-xl border border-border/50 bg-white text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                              >
                                {mode === "pro" ? (
                                  <>
                                    <option value="1.0">1.0</option>
                                    <option value="1.5">1.5</option>
                                    <option value="1.6">1.6 (Default)</option>
                                    <option value="2.0">2.0</option>
                                    <option value="2.1">2.1</option>
                                    <option value="2.1 - master">2.1 - Master</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="1.0">1.0</option>
                                    <option value="1.5">1.5</option>
                                    <option value="1.6">1.6 (Default)</option>
                                    <option value="2.1">2.1</option>
                                    <option value="2.1 - master">2.1 - Master</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase text-foreground/60">Start Frame</Label>
                              <div className="aspect-square rounded-2xl border-2 border-dashed border-border/50 bg-white overflow-hidden relative hover:border-orange-500/50 transition-colors group">
                                {!localStartFrame ? (
                                  <UploadZone onFileSelected={handleStartFrameSelect} />
                                ) : (
                                  <ImagePreview src={localStartPreview!} onChangeImage={() => setLocalStartFrame(null)} />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase text-foreground/60">End Frame</Label>
                              <div className="aspect-square rounded-2xl border-2 border-dashed border-border/50 bg-white overflow-hidden relative hover:border-orange-500/50 transition-colors group">
                                {!localEndFrame ? (
                                  <UploadZone onFileSelected={handleEndFrameSelect} />
                                ) : (
                                  <ImagePreview src={localEndPreview!} onChangeImage={() => setLocalEndFrame(null)} />
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              if (localStartFrame) {
                                onGenerateKlingVideo({
                                  prompt: videoSceneInput,
                                  negativePrompt,
                                  cfgScale,
                                  mode,
                                  duration,
                                  version,
                                  aspectRatio,
                                  startFrame: localStartFrame,
                                  endFrame: localEndFrame || localStartFrame
                                });
                              }
                            }}
                            disabled={isGeneratingKlingVideo || !videoSceneInput.trim() || !localStartFrame}
                            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-orange-200"
                          >
                            {isGeneratingKlingVideo ? <Loader2 className="animate-spin" /> : "Initiate Final Render"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

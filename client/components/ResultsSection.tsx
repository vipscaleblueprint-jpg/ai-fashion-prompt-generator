import { useState, useEffect } from "react";
import PromptCard from "./PromptCard";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Video, Download } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import { toast } from "sonner";

interface ResultsSectionProps {
  prompts: string[] | null;
  labels?: string[];
  combinedPromptFooter?: string;
  isFetchingFaceProfile?: boolean; // New prop
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
  isLoading: isRegenerating
}: ResultsSectionProps) {
  const hasPrompts = (prompts && prompts.length > 0);
  const showSection = hasPrompts || isFetchingFaceProfile;

  // Track which fashion prompt is selected for combining (default to first fashion prompt, index 1)
  const [selectedFashionPromptIndex, setSelectedFashionPromptIndex] = useState<number>(1);

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
  const [mode, setMode] = useState("pro"); // Default to pro as per Kling.tsx usually? Or std. Kling.tsx default was pro.
  const [duration, setDuration] = useState("5");
  const [version, setVersion] = useState("1.6");

  // Initialize video scene input when prompts change
  useEffect(() => {
    // If we have a kling prompt, prioritize that!
    if (klingPrompt) {
      // Parse the Kling prompt to extract negative prompt and scene content
      const parseKlingPrompt = (prompt: string) => {
        // Look for negative prompt markers (case-insensitive)
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

            // The negative prompt is everything after the marker
            // Check if there's a newline or double newline that separates sections
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
      if (negativeContent) {
        setNegativePrompt(negativeContent);
      }
    } else if (prompts && prompts.length > 0) {
      const combined = getCombinedPromptContent();
      setVideoSceneInput(combined);
    }
  }, [prompts, combinedPromptFooter, klingPrompt, selectedFashionPromptIndex]);

  // Reset selected index when prompts change
  useEffect(() => {
    if (prompts && prompts.length > 1) {
      setSelectedFashionPromptIndex(1); // Default to first fashion prompt
    }
  }, [prompts]);

  // NO PROP SYNCING for frames - User wants to upload NEW images explicitly.
  // We strictly start empty unless user uploads.
  useEffect(() => {
    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Handle local uploads
  const handleStartFrameSelect = (f: File) => {
    setLocalStartFrame(f);
    setLocalStartPreview(URL.createObjectURL(f));
  };

  const handleEndFrameSelect = (f: File) => {
    setLocalEndFrame(f);
    setLocalEndPreview(URL.createObjectURL(f));
  };


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

  const getTitle = (i: number) => {
    if (labels && labels[i]) return labels[i];
    return (prompts && prompts.length > 1) ? `Variation ${i + 1}` : "Generated Prompt";
  };

  // Helper function to get combined prompt content
  const getCombinedPromptContent = () => {
    if (!prompts || prompts.length === 0) return "";

    // If we have labels (meaning face analysis + fashion prompts)
    if (labels && labels.length > 0 && prompts.length > 1) {
      // Combine face analysis (index 0) with selected fashion prompt
      const faceAnalysis = prompts[0] || "";
      const selectedFashion = prompts[selectedFashionPromptIndex] || prompts[1] || "";
      return faceAnalysis + "\n\n" + selectedFashion + (combinedPromptFooter ? `\n\n${combinedPromptFooter}` : "");
    }

    // Otherwise join all prompts
    return prompts.join("\n\n") + (combinedPromptFooter ? `\n\n${combinedPromptFooter}` : "");
  };

  const combinedPromptContent = getCombinedPromptContent();

  return (
    <section className="space-y-4">
      {showSection && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              Your Fashion Photography Prompt{prompts && prompts.length > 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-2">
              {onRegenerate && (
                <Button
                  variant="secondary"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadText} disabled={!hasPrompts}>
                Download as Text
              </Button>
              <Button onClick={handleDownloadJson} disabled={!hasPrompts}>Download Prompt</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">

            {/* If we are fetching face profile and have no prompts yet, show a loading card */}
            {isFetchingFaceProfile && !hasPrompts && (
              <PromptCard title="Face Analysis Prompt" prompt="" isLoading={true} />
            )}

            {hasPrompts && prompts!.map((p, i) => {
              // Hide empty prompts unless it's the first one loading
              if (!p && !(i === 0 && isFetchingFaceProfile)) return null;

              // Determine if this is a fashion prompt (not face analysis)
              const isFaceAnalysis = labels && labels[0] && i === 0;
              const isFashionPrompt = labels && labels.length > 0 && i > 0;

              return (
                <PromptCard
                  key={i}
                  title={getTitle(i)}
                  prompt={p}
                  // If it's the first prompt (Face Analysis) and we are currently re-fetching it, show loading
                  // Actually the requirement is "show face analysis text after prompt generation it should show after i select a client add a loading"
                  // If we already have prompts, and we select a client, we are re-fetching.
                  // We typically update the first prompt. So if isFetchingFaceProfile is true, the first card should be loading.
                  isLoading={isFetchingFaceProfile && i === 0}
                  showCombineButton={isFashionPrompt}
                  onCombine={isFashionPrompt ? () => {
                    setSelectedFashionPromptIndex(i);
                    toast.success("Combined successfully");
                  } : undefined}
                />
              );
            })}

            {hasPrompts && prompts!.filter(p => p && p.trim() !== "").length > 1 && (
              <>
                <PromptCard
                  key="combined"
                  title="Combined Prompt"
                  prompt={combinedPromptContent}
                />

                {onGenerateKling && (
                  <div className="pt-4 border-t border-dashed border-border mt-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Kling AI Prompt Generator
                        </h3>
                        <Button
                          onClick={() => onGenerateKling(combinedPromptContent)}
                          disabled={isGeneratingKling}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isGeneratingKling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                            </>
                          ) : (
                            "Generate Kling Prompt"
                          )}
                        </Button>
                      </div>

                      {klingPrompt && (
                        <PromptCard
                          key="kling"
                          title="Generated Kling Prompt"
                          prompt={klingPrompt}
                        />
                      )}
                    </div>
                  </div>
                )}

                {onGenerateKlingVideo && (
                  <div className="pt-4 border-t border-dashed border-border mt-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Video className="w-4 h-4 text-orange-500" />
                          Kling Video Generator
                        </h3>
                      </div>

                      {/* Video Player / Result Area */}
                      <div className="w-full aspect-video bg-muted rounded-xl flex items-center justify-center border border-border overflow-hidden relative">
                        {videoUrl ? (
                          <video
                            src={videoUrl}
                            controls
                            autoPlay
                            loop
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-6 text-muted-foreground w-full">
                            {isGeneratingKlingVideo || videoStatus ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="font-medium text-foreground">{videoStatus || "Processing..."}</p>
                                <p className="text-xs">This may take a few minutes...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Video className="w-12 h-12 text-muted-foreground/50" />
                                <p>Video preview will appear here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {videoUrl && (
                        <Button className="w-full" variant="outline" asChild>
                          <a href={videoUrl} download target="_blank" rel="noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download Video
                          </a>
                        </Button>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Scene Input</label>
                          <textarea
                            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                            value={videoSceneInput}
                            onChange={(e) => setVideoSceneInput(e.target.value)}
                          />
                        </div>

                        {/* Frame Uploaders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Start Frame</label>
                              {localStartFrame && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => {
                                  setLocalStartFrame(null);
                                  setLocalStartPreview(null);
                                }}>Clear</Button>
                              )}
                            </div>
                            {!localStartFrame ? (
                              <UploadZone onFileSelected={handleStartFrameSelect} />
                            ) : (
                              <ImagePreview src={localStartPreview!} onChangeImage={() => {
                                setLocalStartFrame(null);
                                setLocalStartPreview(null);
                              }} />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">End Frame</label>
                              {localEndFrame && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => {
                                  setLocalEndFrame(null);
                                  setLocalEndPreview(null);
                                }}>Clear</Button>
                              )}
                            </div>
                            {!localEndFrame ? (
                              <UploadZone onFileSelected={handleEndFrameSelect} />
                            ) : (
                              <ImagePreview src={localEndPreview!} onChangeImage={() => {
                                setLocalEndFrame(null);
                                setLocalEndPreview(null);
                              }} />
                            )}
                            {!localEndFrame && (
                              <div className="text-xs text-muted-foreground mt-1 text-center">
                                (Optional) If empty, Start Frame will be used.
                              </div>
                            )}
                          </div>
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Aspect Ratio</label>
                            <select
                              className="w-full p-2 rounded-md border border-input bg-background text-sm"
                              value={aspectRatio}
                              onChange={(e) => setAspectRatio(e.target.value)}
                            >
                              <option value="16:9">16:9 (Landscape)</option>
                              <option value="9:16">9:16 (Portrait)</option>
                              <option value="1:1">1:1 (Square)</option>
                            </select>
                          </div>

                          {/* New Advanced Fields */}
                          <div className="space-y-4 pt-4 border-t border-dashed border-border">
                            <h4 className="text-sm font-medium text-muted-foreground">Advanced Settings</h4>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Negative Prompt</label>
                              <textarea
                                className="w-full min-h-[60px] p-2 rounded-md border border-input bg-background text-sm"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="low quality, blur, distortion..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium flex justify-between">
                                  CFG Scale
                                  <span className="text-muted-foreground">{cfgScale}</span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-600"
                                  value={cfgScale}
                                  onChange={(e) => setCfgScale(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Mode</label>
                                <select
                                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                  value={mode}
                                  onChange={(e) => {
                                    const newMode = e.target.value;
                                    setMode(newMode);
                                    // Reset version if needed, or keep 1.6 if available in both (it is)
                                    setVersion("1.6");
                                  }}
                                >
                                  <option value="std">Standard</option>
                                  <option value="pro">Professional</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Duration</label>
                                <select
                                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                  value={duration}
                                  onChange={(e) => setDuration(e.target.value)}
                                >
                                  <option value="5">5 Seconds</option>
                                  <option value="10">10 Seconds</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Version</label>
                                <select
                                  className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                  value={version}
                                  onChange={(e) => setVersion(e.target.value)}
                                >
                                  {mode === "std" ? (
                                    <>
                                      <option value="1.0">1.0</option>
                                      <option value="1.5">1.5</option>
                                      <option value="1.6">1.6</option>
                                      <option value="2.1">2.1</option>
                                      <option value="2.1-master">2.1-master</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="1.0">1.0</option>
                                      <option value="1.5">1.5</option>
                                      <option value="1.6">1.6</option>
                                      <option value="2.0">2.0</option>
                                      <option value="2.1">2.1</option>
                                      <option value="2.1-master">2.1-master</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            if (localStartFrame) {
                              const end = localEndFrame || localStartFrame;
                              onGenerateKlingVideo({
                                prompt: videoSceneInput,
                                negativePrompt,
                                cfgScale,
                                mode,
                                duration,
                                version,
                                aspectRatio,
                                startFrame: localStartFrame,
                                endFrame: end
                              });
                            }
                          }}
                          disabled={isGeneratingKlingVideo || !videoSceneInput.trim() || !localStartFrame}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isGeneratingKlingVideo || (videoStatus && videoStatus !== "Failed") ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {videoStatus || "Generating Video..."}
                            </>
                          ) : (
                            "Generate Video"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

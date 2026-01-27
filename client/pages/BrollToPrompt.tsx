import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettings from "@/components/AdvancedSettings";
import { handleBrollImageSubmission, fetchFaceProfile, fetchBodyProfile } from "@/lib/broll-webhook";
import { fetchMarketingClients, MarketingClient } from "@/lib/marketing-client-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadThing } from "@/lib/uploadthing-config"; // Imported useUploadThing
import { Switch } from "@/components/ui/switch";

import { handleKlingPromptSubmission } from "@/lib/kling-webhook";

// Type definitions for PiAPI responses (copied from Kling.tsx)
interface PiApiTaskResponse {
  code: number;
  data: {
    task_id: string;
    status: string;
    output?: {
      video_url?: string;
    };
    error?: {
      code: number;
      message: string;
    };
  };
  message: string;
}

export default function BrollToPrompt() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [bodyPreviewUrl, setBodyPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kling State
  const [klingPrompt, setKlingPrompt] = useState<string | null>(null);
  const [isGeneratingKling, setIsGeneratingKling] = useState(false);

  // Kling Video State
  const [isGeneratingKlingVideo, setIsGeneratingKlingVideo] = useState(false); // Used for initial submission info
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null); // To track polling
  const [videoStatus, setVideoStatus] = useState<string>(""); // Polling status text
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Final video URL

  const { startUpload } = useUploadThing("imageUploader");


  // Advanced Settings State
  const [ethnicity, setEthnicity] = useState("");
  const [gender, setGender] = useState("");
  const [skinColor, setSkinColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [facialExpression, setFacialExpression] = useState("");
  const [bodyComposition, setBodyComposition] = useState("");
  const [imperfection, setImperfection] = useState("");
  // Facial Structure
  const [exactFacialStructure, setExactFacialStructure] = useState(false);
  const [eyes, setEyes] = useState("");
  const [eyebrows, setEyebrows] = useState("");
  const [nose, setNose] = useState("");
  const [mouth, setMouth] = useState("");
  const [ears, setEars] = useState("");
  // Transform Head
  const [transformHead, setTransformHead] = useState(false);
  const [angle, setAngle] = useState("");

  // Fashion Settings
  const [fashionStyle, setFashionStyle] = useState("");
  const [clothes, setClothes] = useState("");
  const [clothesColor, setClothesColor] = useState("");

  // Client List State
  const [selectedClient, setSelectedClient] = useState("");
  const [clientList, setClientList] = useState<MarketingClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isFetchingFaceProfile, setIsFetchingFaceProfile] = useState(false);
  const [isFetchingBodyProfile, setIsFetchingBodyProfile] = useState(false);
  const [useDatabaseProfiles, setUseDatabaseProfiles] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
      if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
    };
  }, [previewUrl, refPreviewUrl, bodyPreviewUrl]);

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const data = await fetchMarketingClients();
        setClientList(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load client list");
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Polling Effect for Kling Video
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (videoTaskId && isGeneratingKlingVideo) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/piapi/kling/task/${videoTaskId}`);

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[Client] Polling error status:", res.status, errorText);
            return;
          }

          const data: PiApiTaskResponse = await res.json();

          if (data.code === 200) {
            const taskStatus = data.data.status;
            setVideoStatus(`Status: ${taskStatus}`);

            if (taskStatus === "completed") {
              if (data.data.output?.video_url) {
                setVideoUrl(data.data.output.video_url);
                toast.success("Video generated successfully!");
              } else {
                toast.error("Completed but no video URL found.");
              }
              setIsGeneratingKlingVideo(false);
              setVideoTaskId(null);
            } else if (taskStatus === "failed") {
              toast.error(`Generation failed: ${data.data.error?.message || "Unknown error"}`);
              setIsGeneratingKlingVideo(false);
              setVideoTaskId(null);
            }
          } else {
            console.warn("Polling error:", data);
          }
        } catch (err) {
          console.error("Polling fetch error", err);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => clearInterval(intervalId);
  }, [videoTaskId, isGeneratingKlingVideo]);


  const onFileSelected = (f: File) => {
    setFile(f);
    setPrompts(null);
    setKlingPrompt(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    // Reset video state on new main image? Probably good UX
    setVideoUrl(null);
    setVideoTaskId(null);
    setIsGeneratingKlingVideo(false);
  };

  const onRefFileSelected = (f: File) => {
    setRefFile(f);
    // Don't clear main prompts/error necessarily, or maybe do?
    // Let's keep them if user is just adding a ref face.
    const url = URL.createObjectURL(f);
    setRefPreviewUrl(url);
  };

  const onBodyFileSelected = (f: File) => {
    setBodyFile(f);
    const url = URL.createObjectURL(f);
    setBodyPreviewUrl(url);
  };

  const resetAll = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRefFile(null);
    if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    setRefPreviewUrl(null);
    setBodyFile(null);
    if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
    setBodyPreviewUrl(null);
    setPrompts(null);
    setKlingPrompt(null);
    setError(null);
    setStatus("Idle");

    // Reset video state
    setVideoUrl(null);
    setVideoTaskId(null);
    setVideoStatus("");
    setIsGeneratingKlingVideo(false);
  };

  const startProgressMessages = () => {
    const messages = [
      "Analyzing your b-roll image...",
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

  const handleClientChange = async (value: string) => {
    setSelectedClient(value);
    setIsFetchingFaceProfile(true);
    setIsFetchingBodyProfile(true);
    try {
      // Use the shared library functions which handle the webhooks directly
      const [faceData, bodyData] = await Promise.all([
        fetchFaceProfile(value),
        fetchBodyProfile(value)
      ]);

      // Always update prompts, even if data is null (to clear previous client's data)
      setPrompts(prev => {
        // Logic: prompts[0] is Face, prompts[1] is Body, prompts[2] is Scene.
        // We ensure we have spaces for all 3 if they don't exist
        const currentPrompts = prev || ["", "", ""];
        const scenePrompt = currentPrompts[2] || "";
        return [faceData || "", bodyData || "", scenePrompt];
      });

      if (faceData) {
        toast.success("Face profile loaded successfully");
      }
      if (bodyData) {
        toast.success("Body profile loaded successfully");
      }

      if (!faceData && !bodyData) {
        toast.error("No profiles found for this client, prompts cleared.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load client profiles");
    } finally {
      setIsFetchingFaceProfile(false);
      setIsFetchingBodyProfile(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please select an image first");
      return;
    }
    setIsLoading(true);
    setError(null);
    const stop = startProgressMessages();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const out = await handleBrollImageSubmission(file, useDatabaseProfiles ? null : refFile, useDatabaseProfiles ? null : bodyFile, {
        signal: controller.signal,
        ethnicity,
        gender,
        skinColor,
        hairColor,
        facialExpression,
        bodyComposition,
        imperfection,
        exactFacialStructure,
        eyes,
        eyebrows,
        nose,
        mouth,
        ears,
        transformHead,
        angle: angle || "default",
        fashionStyle,
        clothes,
        clothesColor,
        client: useDatabaseProfiles ? (selectedClient || undefined) : undefined,
        database_profile_enabled: useDatabaseProfiles,
      });

      // Ensure out has at least 3 elements if we are in database mode or have 3 prompts
      // Actually, handleBrollImageSubmission returns an array of prompts.
      // If we are using database profiles, we might already have prompts[0] and [1] filled by handleClientChange.
      // We want to update only the scene prompt (out[0] or similar).

      setPrompts(prev => {
        if (!useDatabaseProfiles) {
          // In manual mode, the webhook returns prompts based on what was uploaded.
          // The order is typically Face, Body, Scene if all are provided.
          if (refFile && bodyFile) return out; // [Face, Body, Scene]
          if (refFile && !bodyFile) return [out[0], "", out[1]]; // [Face, "", Scene]
          if (!refFile && bodyFile) return ["", out[0], out[1]]; // ["", Body, Scene]
          return ["", "", out[0]]; // ["", "", Scene]
        } else {
          // In database mode, we preserve the face/body profiles fetched earlier
          // and only update the scene prompt (which should be the last one in 'out').
          const currentPrompts = prev || ["", "", ""];
          const newScenePrompt = out[out.length - 1] || "";
          return [currentPrompts[0], currentPrompts[1], newScenePrompt];
        }
      });
      // Persist to history with the original file
      try {
        await addHistoryEntry({ file, prompts: out });
      } catch { }
      toast.success("Prompts generated successfully");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Request canceled");
      } else if (e?.message) {
        setError(e.message);
      } else {
        setError("Analysis failed. Please try a different image.");
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

  const handleGenerateKling = async (combinedPrompt: string) => {
    setIsGeneratingKling(true);
    setKlingPrompt(null);
    try {
      const result = await handleKlingPromptSubmission(combinedPrompt);
      setKlingPrompt(result);
      toast.success("Kling prompt generated successfully");
    } catch (e: any) {
      toast.error("Failed to generate Kling prompt");
      console.error(e);
    } finally {
      setIsGeneratingKling(false);
    }
  };

  const handleGenerateKlingVideo = async (params: {
    prompt: string;
    negativePrompt: string;
    cfgScale: string;
    mode: string;
    duration: string;
    version: string;
    aspectRatio: string;
    startFrame: File;
    endFrame: File | null;
  }) => {

    setIsGeneratingKlingVideo(true);
    setVideoStatus("Uploading images...");
    setVideoUrl(null);
    setVideoTaskId(null);

    try {
      // 1. Upload Images using uploadthing
      const filesToUpload = [params.startFrame];
      if (params.endFrame) filesToUpload.push(params.endFrame);

      const uploadRes = await startUpload(filesToUpload);

      if (!uploadRes || uploadRes.length !== filesToUpload.length) {
        throw new Error("Failed to upload images");
      }

      const startImageUrl = uploadRes[0].url;
      const endImageUrl = params.endFrame ? uploadRes[1].url : undefined;

      setVideoStatus("Submitting task to Kling...");

      // 2. Submit Task to PiAPI (via Proxy)
      const payload = {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        cfg_scale: parseFloat(params.cfgScale),
        duration: parseInt(params.duration),
        image_url: startImageUrl,
        image_tail_url: endImageUrl,
        mode: params.mode,
        version: params.version,
        aspect_ratio: params.aspectRatio // Currently PiAPI Kling usually takes aspect_ratio if text-to-video or image-to-video? 
        // Note: Kling.tsx payload didn't strictly send aspect_ratio in the snippet I saw, but let's check.
        // Kling.tsx line 155 didn't have aspect_ratio. It just had image_url etc.
        // However, ResultsSection passes it. Let's send it if the API supports it, or ignore.
        // The Kling.tsx implementation was img-to-video, which usually respects input image ratio.
        // But let's check if 'aspect_ratio' is valid. The `Kling.tsx` payload logic didn't assume aspect ratio for I2V. 
        // We'll stick to what Kling.tsx did for I2V: which is mostly ignoring aspect ratio or relying on the image.
      };

      // NOTE: Kling.tsx used `mode` and `version`.

      const res = await fetch("/api/piapi/kling/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      console.log("[Client] Response received:", res.status, res.statusText);

      let data: PiApiTaskResponse;
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("[Client] Received non-JSON response:", text);
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`);
      }

      if (res.ok && data.code === 200 && data.data.task_id) {
        setVideoTaskId(data.data.task_id);
        setVideoStatus("Pending...");
        toast.success("Task submitted successfully!");
        // Polling effect will take over safely because isGeneratingKlingVideo is true and taskId is set.
      } else {
        throw new Error(data.message || data.data.error?.message || `Submission failed with status ${res.status}`);
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Something went wrong");
      setIsGeneratingKlingVideo(false);
      setVideoStatus("Failed");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <section className="mb-10">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            AI B-Roll IMAGE to Prompt Generator
          </h1>
          <p className="text-foreground/80 text-lg">
            Transform your b-roll images into professional photography prompts
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 shadow-sm mb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="database-profiles" className="text-lg font-bold text-primary flex items-center gap-2">
                  Database Profiles
                  <Sparkles className="w-4 h-4" />
                </Label>
                <p className="text-sm text-foreground/70">Enable to fetch client data from your database</p>
              </div>
              <Switch
                id="database-profiles"
                className="scale-125 data-[state=checked]:bg-primary"
                checked={useDatabaseProfiles}
                onCheckedChange={(checked) => {
                  setUseDatabaseProfiles(checked);
                  if (!checked) setSelectedClient("");
                }}
              />
            </div>
            {useDatabaseProfiles && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-semibold">Client List</Label>
                  <Select value={selectedClient} onValueChange={handleClientChange}>
                    <SelectTrigger id="client" disabled={isLoadingClients} className="bg-background">
                      <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a Client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientList.map((client, index) => (
                        <SelectItem key={`${client.clockify_id}-${client.clickup_id}-${client.client_name}-${index}`} value={client.client_name}>
                          {client.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/80">Main B-Roll Image</h3>
            {!file ? (
              <UploadZone onFileSelected={onFileSelected} />
            ) : (
              <ImagePreview src={previewUrl!} onChangeImage={resetAll} />
            )}
          </div>

          {!useDatabaseProfiles && (
            <>
              <div className="space-y-2 pt-4 border-t border-dashed border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/80">Reference Face Analyzer (Optional)</h3>
                  {refFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        setRefFile(null);
                        if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
                        setRefPreviewUrl(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {!refFile ? (
                  <div className="scale-90 origin-top-left w-[111%]">
                    {/* Scaling down slightly to indicate secondary importance */}
                    <UploadZone onFileSelected={onRefFileSelected} />
                  </div>
                ) : (
                  <ImagePreview
                    src={refPreviewUrl!}
                    alt="Reference face preview"
                    onChangeImage={() => {
                      setRefFile(null);
                      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
                      setRefPreviewUrl(null);
                    }}
                  />
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-dashed border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground/80">Reference Body Analyzer (Optional)</h3>
                  {bodyFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        setBodyFile(null);
                        if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
                        setBodyPreviewUrl(null);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {!bodyFile ? (
                  <div className="scale-90 origin-top-left w-[111%]">
                    <UploadZone onFileSelected={onBodyFileSelected} />
                  </div>
                ) : (
                  <ImagePreview
                    src={bodyPreviewUrl!}
                    alt="Reference body preview"
                    onChangeImage={() => {
                      setBodyFile(null);
                      if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
                      setBodyPreviewUrl(null);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <AdvancedSettings
            mode="model-angle"
            ethnicity={ethnicity}
            setEthnicity={setEthnicity}
            gender={gender}
            setGender={setGender}
            skinColor={skinColor}
            setSkinColor={setSkinColor}
            hairColor={hairColor}
            setHairColor={setHairColor}
            facialExpression={facialExpression}
            setFacialExpression={setFacialExpression}
            bodyComposition={bodyComposition}
            setBodyComposition={setBodyComposition}
            imperfection={imperfection}
            setImperfection={setImperfection}
            exactFacialStructure={exactFacialStructure}
            setExactFacialStructure={setExactFacialStructure}
            eyes={eyes}
            setEyes={setEyes}
            eyebrows={eyebrows}
            setEyebrows={setEyebrows}
            nose={nose}
            setNose={setNose}
            mouth={mouth}
            setMouth={setMouth}
            ears={ears}
            setEars={setEars}
            transformHead={transformHead}
            setTransformHead={setTransformHead}
            angle={angle}
            setAngle={setAngle}
            fashionStyle={fashionStyle}
            setFashionStyle={setFashionStyle}
            clothes={clothes}
            setClothes={setClothes}
            clothesColor={clothesColor}
            setClothesColor={setClothesColor}
          />

          {!prompts && !isFetchingFaceProfile && !isFetchingBodyProfile && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Get Started
              </h2>
              <p className="text-sm text-foreground/70 mb-4">
                Upload a JPG, PNG, or WEBP image up to 10MB. Then click Generate
                to receive a detailed b-roll photography prompt.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    (useDatabaseProfiles && selectedClient)
                      ? `Generate for ${selectedClient}`
                      : "Generate Prompts"
                  )}
                </Button>
                {isLoading && (
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="mr-2" /> Cancel
                  </Button>
                )}
                {file && !isLoading && (
                  <Button variant="ghost" onClick={resetAll}>
                    Try Another Image
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

          {(prompts || isFetchingFaceProfile || isFetchingBodyProfile) && (
            <ResultsSection
              prompts={prompts}
              labels={["Face Analysis Prompt", "Body Analysis Prompt", "Scene Description"]}
              combinedPromptFooter="using the exact facial structure, eyes, eyebrows, nose, mouth, ears, hair, skin tone, and details of the person in the reference image, without alteration or beautification."
              isFetchingFaceProfile={isFetchingFaceProfile}
              isFetchingBodyProfile={isFetchingBodyProfile}
              klingPrompt={klingPrompt}
              isGeneratingKling={isGeneratingKling}
              onGenerateKling={handleGenerateKling}
              startFrameImage={file}
              endFrameImage={refFile}

              // Video Generation Props
              isGeneratingKlingVideo={isGeneratingKlingVideo}
              videoStatus={videoStatus}
              videoUrl={videoUrl}
              onGenerateKlingVideo={handleGenerateKlingVideo}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import { useUploadThing } from "@/lib/uploadthing-config";
import { toast } from "sonner";
import { Loader2, Play, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Type definitions for API responses
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

export default function Kling() {
  // Image State
  const [startImage, setStartImage] = useState<File | null>(null);
  const [startPreview, setStartPreview] = useState<string | null>(null);

  const [endImage, setEndImage] = useState<File | null>(null);
  const [endPreview, setEndPreview] = useState<string | null>(null);

  // Form State
  const [prompt, setPrompt] = useState("Smooth cinematic transition from daylight to golden hour, natural camera motion");
  const [negativePrompt, setNegativePrompt] = useState("blur, jitter, artifacts, distortion");
  const [duration, setDuration] = useState("5"); // 5 or 10
  const [cfgScale, setCfgScale] = useState("0.5");
  const [mode, setMode] = useState("pro");
  const [version, setVersion] = useState("1.6");

  // Update version defaults when mode changes strictly if needed, but for now we just keep the selected one if valid, otherwise reset.
  // Actually the requirement says "the default is 1.6".
  // Since 1.6 exists in both, we can just default to 1.6 initially.
  // We can add an effect to sanity check the version if we wanted to be strict, but the user didn't ask for strict validation logic, just the dropdown options.

  // Processing State
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const { startUpload } = useUploadThing("imageUploader");

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (startPreview) URL.revokeObjectURL(startPreview);
      if (endPreview) URL.revokeObjectURL(endPreview);


    };
  }, [startPreview, endPreview]);

  // Polling Effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (taskId && isProcessing) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/piapi/kling/task/${taskId}`);
          const data: PiApiTaskResponse = await res.json();

          if (data.code === 200) {
            const taskStatus = data.data.status;
            setStatus(`Status: ${taskStatus}`);

            if (taskStatus === "completed") {
              if (data.data.output?.video_url) {
                setVideoUrl(data.data.output.video_url);
                toast.success("Video generated successfully!");
              } else {
                toast.error("Completed but no video URL found.");
              }
              setIsProcessing(false);
              setTaskId(null);
            } else if (taskStatus === "failed") {
              toast.error(`Generation failed: ${data.data.error?.message || "Unknown error"}`);
              setIsProcessing(false);
              setTaskId(null);
            }
          } else {
            // Keep retrying or handle error?
            // If code is not 200, it might be a temp error or 404
            console.warn("Polling error:", data);
          }
        } catch (err) {
          console.error("Polling fetch error", err);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => clearInterval(intervalId);
  }, [taskId, isProcessing]);


  const handleStartImageSelect = (f: File) => {
    setStartImage(f);
    setStartPreview(URL.createObjectURL(f));
    // Reset previous results
    setVideoUrl(null);
    setTaskId(null);
  };

  const handleEndImageSelect = (f: File) => {
    setEndImage(f);
    setEndPreview(URL.createObjectURL(f));
  };

  const handleGenerate = async () => {
    if (!startImage) {
      toast.error("Start image is required");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading images...");
    setVideoUrl(null);

    try {
      // 1. Upload Images
      const filesToUpload = [startImage];
      if (endImage) filesToUpload.push(endImage);

      const uploadRes = await startUpload(filesToUpload);

      if (!uploadRes || uploadRes.length !== filesToUpload.length) {
        throw new Error("Failed to upload images");
      }

      const startImageUrl = uploadRes[0].url;
      const endImageUrl = endImage ? uploadRes[1].url : undefined;

      setIsUploading(false);
      setIsProcessing(true);
      setStatus("Submitting task...");

      // 2. Submit Task to PiAPI (via Proxy)
      // 2. Submit Task to PiAPI (via Proxy)
      const payload = {
        prompt,
        negative_prompt: negativePrompt,
        cfg_scale: parseFloat(cfgScale),
        duration: parseInt(duration),
        image_url: startImageUrl,
        image_tail_url: endImageUrl,
        mode,
        version
      };

      const res = await fetch("/api/piapi/kling/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data: PiApiTaskResponse = await res.json();

      if (data.code === 200 && data.data.task_id) {
        setTaskId(data.data.task_id);
        setStatus("Pending...");
        toast.success("Task submitted successfully!");
      } else {
        throw new Error(data.message || data.data.error?.message || "Submission failed");
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Something went wrong");
      setIsUploading(false);
      setIsProcessing(false);
      setStatus("Failed");
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <section className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Kling Video Generator (PiAPI)
        </h1>
        <p className="text-foreground/80 text-lg">
          Generate realistic videos from images using the Kling 2.5 model.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Inputs */}
        <div className="space-y-8">

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Upload Images</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Image (Required)</Label>
                {!startImage ? (
                  <UploadZone onFileSelected={handleStartImageSelect} />
                ) : (
                  <ImagePreview
                    src={startPreview!}
                    onChangeImage={() => {
                      setStartImage(null);
                      setStartPreview(null);
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>End Image (Optional)</Label>
                {!endImage ? (
                  <UploadZone onFileSelected={handleEndImageSelect} />
                ) : (
                  <ImagePreview
                    src={endPreview!}
                    onChangeImage={() => {
                      setEndImage(null);
                      setEndPreview(null);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Settings</h3>

            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Negative Prompt</Label>
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="5">5s (Standard)</option>
                  <option value="10">10s (High Quality)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quality Mode</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="pro">Pro (Professional)</option>
                  <option value="std">Standard</option>
                </select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Model Version</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          <Button
            onClick={handleGenerate}
            disabled={!startImage || isUploading || isProcessing}
            className="w-full text-lg h-12"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Uploading Images...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> {status}
              </>
            ) : (
              <>
                <Play className="mr-2 fill-current" /> Generate Video
              </>
            )}
          </Button>

        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">3. Result</h3>

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
              <div className="text-center p-6 text-muted-foreground">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>{status}</p>
                    <p className="text-xs">This may take a few minutes...</p>
                  </div>
                ) : (
                  <p>Video preview will appear here</p>
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
        </div>
      </div>
    </div>
  );
}

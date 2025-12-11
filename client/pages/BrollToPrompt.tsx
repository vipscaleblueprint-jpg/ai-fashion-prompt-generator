import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettings from "@/components/AdvancedSettings";
import { handleBrollImageSubmission } from "@/lib/broll-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

export default function BrollToPrompt() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    };
  }, [previewUrl, refPreviewUrl]);

  const onFileSelected = (f: File) => {
    setFile(f);
    setPrompts(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onRefFileSelected = (f: File) => {
    setRefFile(f);
    // Don't clear main prompts/error necessarily, or maybe do?
    // Let's keep them if user is just adding a ref face.
    const url = URL.createObjectURL(f);
    setRefPreviewUrl(url);
  };

  const resetAll = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRefFile(null);
    if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
    setRefPreviewUrl(null);
    setPrompts(null);
    setError(null);
    setStatus("Idle");
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

  const handleGenerate = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    const stop = startProgressMessages();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const out = await handleBrollImageSubmission(file, refFile, {
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
        angle,
      });
      // Combine all prompts (if required) or show them separately.
      // User requested dynamic behavior: if 2 items, show separate prompts.
      // So we just pass the array 'out' directly, and ResultsSection will iterate them.
      setPrompts(out);
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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/80">Main B-Roll Image</h3>
            {!file ? (
              <UploadZone onFileSelected={onFileSelected} />
            ) : (
              <ImagePreview src={previewUrl!} onChangeImage={resetAll} />
            )}
          </div>

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
        </div>

        <div className="space-y-6">
          <AdvancedSettings
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
          />

          {!prompts && (
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

          {prompts && <ResultsSection prompts={prompts} labels={prompts.length === 2 ? ["Scene Description", "Face Analysis Prompt"] : undefined} />}
        </div>
      </div>
    </div>
  );
}


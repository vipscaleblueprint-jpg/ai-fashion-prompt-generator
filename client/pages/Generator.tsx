import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettings from "@/components/AdvancedSettings";
import { compressImage } from "@/lib/image";
import { handleImageSubmission } from "@/lib/webhook";
import { fetchFaceProfile, fetchBodyProfile } from "@/lib/broll-webhook";
import { fetchMarketingClients, MarketingClient } from "@/lib/marketing-client-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Generator() {
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

  // Advanced Settings State
  const [mode, setMode] = useState("");
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
  // Pose
  const [pose, setPose] = useState("");

  // Fashion Settings
  const [fashionStyle, setFashionStyle] = useState("");
  const [clothes, setClothes] = useState("");
  const [clothesColor, setClothesColor] = useState("");

  // Client List State
  const [useDatabaseProfiles, setUseDatabaseProfiles] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [clientList, setClientList] = useState<MarketingClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isFetchingFaceProfile, setIsFetchingFaceProfile] = useState(false);
  const [isFetchingBodyProfile, setIsFetchingBodyProfile] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Load clients on mount
    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const clients = await fetchMarketingClients();
        setClientList(clients);
      } catch (error) {
        console.error("Error loading clients:", error);
      } finally {
        setIsLoadingClients(false);
      }
    };
    loadClients();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
      if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
    };
  }, [previewUrl, refPreviewUrl, bodyPreviewUrl]);

  const onFileSelected = (f: File) => {
    setFile(f);
    setPrompts(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const onRefFileSelected = (f: File) => {
    setRefFile(f);
    setError(null);
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
    setBodyFile(null);
    if (bodyPreviewUrl) URL.revokeObjectURL(bodyPreviewUrl);
    setBodyPreviewUrl(null);
    setPrompts(null);
    setError(null);
    setStatus("Idle");
    setSelectedClient("");
  };

  const handleClientChange = async (clientName: string) => {
    setSelectedClient(clientName);
    if (!clientName) {
      setPrompts(null);
      return;
    }

    // Initialize prompts for 2 analysis slots, preserve existing variants
    setPrompts(prev => {
      const current = prev || ["", ""];
      return ["", "", ...current.slice(2)];
    });

    // Fetch Face Profile
    setIsFetchingFaceProfile(true);
    fetchFaceProfile(clientName).then(facePrompt => {
      if (facePrompt) {
        setPrompts(prev => {
          const current = prev || ["", ""];
          return [facePrompt, current[1] || "", ...current.slice(2)];
        });
      }
      setIsFetchingFaceProfile(false);
    });

    // Fetch Body Profile
    setIsFetchingBodyProfile(true);
    fetchBodyProfile(clientName).then(bodyPrompt => {
      if (bodyPrompt) {
        setPrompts(prev => {
          const current = prev || ["", ""];
          return [current[0] || "", bodyPrompt, ...current.slice(2)];
        });
      }
      setIsFetchingBodyProfile(false);
    });
  };

  const startProgressMessages = () => {
    const messages = [
      "Analyzing your image...",
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
      const compressed = await compressImage(file);
      const out = await handleImageSubmission(compressed, useDatabaseProfiles ? null : refFile, useDatabaseProfiles ? null : bodyFile, {
        signal: controller.signal,
        mode,
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
        pose,
        fashionStyle,
        clothes,
        clothesColor,
        client: useDatabaseProfiles ? (selectedClient || undefined) : undefined,
        database_profile_enabled: useDatabaseProfiles,
      });

      // Mapping logic: handle [Face, Body, ...Fashion] slots
      if (useDatabaseProfiles) {
        setPrompts(prev => {
          const current = prev || ["", "", ""];
          // If 'out' contains the analysis text that we already have in 'current', skip it.
          // normalizeToPrompts prepends faceAnalysis if it found one.
          let variants = [...out];
          if (variants.length > 0 && variants[0].toLowerCase().includes("face analysis")) {
            variants = variants.slice(1);
          }
          return [current[0] || "", current[1] || "", ...variants];
        });
      } else {
        // Adapt 'out' to [Face, Body, ...Fashion]
        if (refFile && bodyFile) {
          // out[0]=Face, out[1]=Body, out[2+]=Variants
          setPrompts(out);
        } else if (refFile && !bodyFile) {
          // out[0]=Face, out[1+]=Variants. Insert empty slot for Body at index 1.
          setPrompts([out[0] || "", "", ...out.slice(1)]);
        } else if (!refFile && bodyFile) {
          // If refFile is missing but bodyFile is present, out[0] is Body analysis.
          // Insert empty slot for Face at index 0.
          setPrompts(["", out[0] || "", ...out.slice(1)]);
        } else {
          // Only variants. Insert empty slots for Face and Body.
          setPrompts(["", "", ...out]);
        }
      }
      // Persist to history with the original file (not compressed, for better thumbnail quality)
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
            AI Fashion Image to Prompt Generator
          </h1>
          <p className="text-foreground/80 text-lg">
            Transform your fashion images into professional photography prompts
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
            <h3 className="text-sm font-semibold text-foreground/80">Main Fashion Image</h3>
            {!file ? (
              <UploadZone onFileSelected={onFileSelected} />
            ) : (
              <ImagePreview src={previewUrl!} onChangeImage={resetAll} />
            )}
          </div>

          {!useDatabaseProfiles && (
            <>
              <div className="space-y-2 border-t border-dashed border-border pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground/80">Reference Face Analyzer (Optional)</Label>
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
                    <UploadZone onFileSelected={onRefFileSelected} />
                  </div>
                ) : (
                  <ImagePreview
                    src={refPreviewUrl!}
                    onChangeImage={() => {
                      setRefFile(null);
                      if (refPreviewUrl) URL.revokeObjectURL(refPreviewUrl);
                      setRefPreviewUrl(null);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger id="mode">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="editorial-portrait">Editorial Portrait</SelectItem>
                <SelectItem value="model-angle">Model Angle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AdvancedSettings
            mode={mode}
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
            pose={pose}
            setPose={setPose}
            fashionStyle={fashionStyle}
            setFashionStyle={setFashionStyle}
            clothes={clothes}
            setClothes={setClothes}
            clothesColor={clothesColor}
            setClothesColor={setClothesColor}
          />

          <ResultsSection
            prompts={prompts}
            isFetchingFaceProfile={isFetchingFaceProfile}
            isFetchingBodyProfile={isFetchingBodyProfile}
            onRegenerate={handleGenerate}
            isLoading={isLoading}
            labels={["Face Analysis Prompt", "Body Analysis Prompt"]}
            combinedPromptFooter={(refFile || bodyFile || useDatabaseProfiles) ? "using the exact facial structure, eyes, eyebrows, nose, mouth, ears, hair, skin tone, and details of the person in the reference image, without alteration or beautification." : undefined}
          />

          {!prompts && (
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Get Started
              </h2>
              <p className="text-sm text-foreground/70 mb-4">
                Upload a JPG, PNG, or WEBP image up to 10MB. Then click Generate
                to receive a detailed fashion photography prompt.
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
        </div>
      </div>
    </div>
  );
}

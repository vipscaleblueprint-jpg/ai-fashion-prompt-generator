import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettingsAlwaysOpen from "@/components/AdvancedSettingsAlwaysOpen";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import { handleFakeAvatarSubmission } from "@/lib/fake-avatar-webhook";
import { toast } from "sonner";
import { Loader2, X, Sparkles, Image as ImageIcon, UserCircle } from "lucide-react";

export default function FakeAvatarGenerator() {
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

    // Fashion Settings
    const [fashionStyle, setFashionStyle] = useState("");
    const [clothes, setClothes] = useState("");
    const [clothesColor, setClothesColor] = useState("");

    // Transformation Settings
    const [transformHead, setTransformHead] = useState(false);
    const [angle, setAngle] = useState("");
    const [cameraAngleImperfection, setCameraAngleImperfection] = useState("");

    // Background Environment
    const [backgroundEnvironment, setBackgroundEnvironment] = useState("");

    // Image Uploads
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [facePreview, setFacePreview] = useState<string | null>(null);
    const [sceneFile, setSceneFile] = useState<File | null>(null);
    const [scenePreview, setScenePreview] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (facePreview) URL.revokeObjectURL(facePreview);
            if (scenePreview) URL.revokeObjectURL(scenePreview);
        };
    }, [facePreview, scenePreview]);

    const onFaceSelected = (f: File) => {
        setFaceFile(f);
        const url = URL.createObjectURL(f);
        setFacePreview(url);
    };

    const onSceneSelected = (f: File) => {
        setSceneFile(f);
        const url = URL.createObjectURL(f);
        setScenePreview(url);
    };


    const abortRef = useRef<AbortController | null>(null);

    const resetAll = (preserveImages = true) => {
        if (!preserveImages) {
            setFaceFile(null);
            setFacePreview(null);
            setSceneFile(null);
            setScenePreview(null);
        }
        setEthnicity("");
        setGender("");
        setSkinColor("");
        setHairColor("");
        setFacialExpression("");
        setBodyComposition("");
        setImperfection("");
        setExactFacialStructure(false);
        setEyes("");
        setEyebrows("");
        setNose("");
        setMouth("");
        setEars("");
        setFashionStyle("");
        setClothes("");
        setClothesColor("");
        setTransformHead(false);
        setAngle("");
        setCameraAngleImperfection("");
        setBackgroundEnvironment("");
        setPrompts(null);
        setError(null);
        setStatus("Idle");
    };

    const startProgressMessages = () => {
        const messages = [
            "Creating your professional prompt...",
            "Analyzing image features...",
            "Applying your advanced settings...",
            "Thinking about fashion details...",
            "Perfecting the masterwork...",
            "Still working, don't close the window...",
            "Finalizing your creative assets..."
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
        // Validation: Only Environment is strictly required if no images are present
        if (!backgroundEnvironment && !faceFile && !sceneFile) {
            setError("Please select an Environment Template or upload reference images to begin.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPrompts(null);
        const stop = startProgressMessages();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const out = await handleFakeAvatarSubmission({
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
                fashionStyle,
                clothes,
                clothesColor,
                transformHead,
                angle: angle || "default",
                cameraAngleImperfection: cameraAngleImperfection || "default",
                backgroundEnvironment,
                faceFile: faceFile || undefined,
                sceneFile: sceneFile || undefined,
            });
            setPrompts(out);
            toast.success("Prompt generated successfully");
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
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto py-12 px-4 max-w-7xl">
                {/* Header Section */}
                <section className="mb-12 text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
                        <Sparkles className="w-3 h-3" />
                        AI Synthesis Engine
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
                        NO LIMITER <br />
                        <span className="text-primary uppercase">SCENE TO PROMPT</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        Master-grade AI prompt engineering for professional scenes.
                        Define every detail or let our analyzer extract it from images.
                    </p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Image References (4/12) */}
                    <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
                            <h3 className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60">
                                <span className="h-1 w-4 rounded-full bg-primary" />
                                Visual References
                            </h3>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Face Analysis</Label>
                                        <UserCircle className="w-4 h-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-dashed border-border bg-accent/20 transition-colors hover:bg-accent/40">
                                        {!faceFile ? (
                                            <UploadZone onFileSelected={onFaceSelected} />
                                        ) : (
                                            <ImagePreview
                                                src={facePreview!}
                                                onChangeImage={() => { setFaceFile(null); setFacePreview(null); }}
                                                onFileSelected={onFaceSelected}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scene Context</Label>
                                        <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                                    </div>
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-dashed border-border bg-accent/20 transition-colors hover:bg-accent/40">
                                        {!sceneFile ? (
                                            <UploadZone onFileSelected={onSceneSelected} />
                                        ) : (
                                            <ImagePreview
                                                src={scenePreview!}
                                                onChangeImage={() => { setSceneFile(null); setScenePreview(null); }}
                                                onFileSelected={onSceneSelected}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle & Right Column: settings (8/12) */}
                    <div className="lg:col-span-8 flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        <AdvancedSettingsAlwaysOpen
                            comingSoon={true}
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
                            backgroundEnvironment={backgroundEnvironment}
                            setBackgroundEnvironment={setBackgroundEnvironment}
                            fashionStyle={fashionStyle}
                            setFashionStyle={setFashionStyle}
                            clothes={clothes}
                            setClothes={setClothes}
                            clothesColor={clothesColor}
                            setClothesColor={setClothesColor}
                            transformHead={transformHead}
                            setTransformHead={setTransformHead}
                            angle={angle}
                            setAngle={setAngle}
                            cameraAngleImperfection={cameraAngleImperfection}
                            setCameraAngleImperfection={setCameraAngleImperfection}
                        />

                        {/* Action Section */}
                        {!prompts && (
                            <div className="sticky bottom-8 rounded-xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-md shadow-lg">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1 text-center md:text-left">
                                        <h4 className="font-bold text-foreground">Ready for Synthesis</h4>
                                        <p className="text-sm text-muted-foreground font-medium">Click to generate your professional scene prompt.</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={isLoading}
                                            className="w-full md:w-auto h-12 px-8 shadow-lg shadow-primary/10"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 animate-spin w-4 h-4" />
                                                    {status.length > 20 ? "Processing..." : status}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 w-4 h-4" /> Generate Prompt
                                                </>
                                            )}
                                        </Button>
                                        {isLoading && (
                                            <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {error && (
                                    <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}
                                <div className="mt-2 text-[10px] text-center text-muted-foreground/30 uppercase tracking-widest font-bold">
                                    Standard Processing Time: 30-60 Seconds
                                </div>
                            </div>
                        )}

                        {prompts && (
                            <div className="mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
                                    <h2 className="text-2xl font-bold tracking-tight">Generated Masterwork</h2>
                                </div>

                                <div className="max-w-4xl mx-auto">
                                    <ResultsSection
                                        prompts={prompts}
                                        hideAnalysis={false}
                                        labels={["Facial Analysis", "Scene Analysis"]}
                                        combinedPromptFooter={`using the exact facial structure, eyes, eyebrows, nose, mouth, ears, hair, skin tone, and details of the person or people in the reference image, without alteration or beautification. ${fashionStyle ? `The fashion style must be ${fashionStyle}.` : ""} ${clothes ? `Wearing ${clothes}.` : ""} ${clothesColor ? `The color of the clothes is ${clothesColor}.` : ""} ${backgroundEnvironment ? `The environment is ${backgroundEnvironment}.` : ""} ${transformHead ? `Presented as a talking head with a ${angle || "close-up"} camera angle.` : ""} ${cameraAngleImperfection ? `The camera angle features a ${cameraAngleImperfection}.` : ""}`}
                                    />
                                </div>

                                <div className="flex justify-center pt-8">
                                    <Button
                                        variant="outline"
                                        onClick={() => resetAll()}
                                        className="rounded-full px-8 h-12"
                                    >
                                        <Sparkles className="mr-2 w-4 h-4" /> Start New Project
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettingsAlwaysOpen from "@/components/AdvancedSettingsAlwaysOpen";
import { toast } from "sonner";
import { Loader2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FASHION_RANDOMIZER_WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/fashion-randomizer";

const THEMES = [
    "Casual",
    "Formal",
    "Casual Formal",
    "Flora/Beach",
    "Vintage/Retro",
];

export default function FashionRandomizer() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [prompts, setPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Theme / Fashion Style State
    const [fashionStyle, setFashionStyle] = useState("");

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
    const [clothes, setClothes] = useState("");
    const [clothesColor, setClothesColor] = useState("");

    // Transformation Settings
    const [transformHead, setTransformHead] = useState(false);
    const [angle, setAngle] = useState("");
    const [cameraAngleImperfection, setCameraAngleImperfection] = useState("");

    // Background Environment
    const [backgroundEnvironment, setBackgroundEnvironment] = useState("");

    const abortRef = useRef<AbortController | null>(null);

    const resetAll = () => {
        setPrompts(null);
        setError(null);
        setStatus("Idle");
        // Optional: Reset form? Probably keep settings for easy regeneration.
    };

    const startProgressMessages = () => {
        const messages = [
            "Randomizing fashion styles...",
            "Applying selected theme...",
            "Generating AI prompt...",
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
        if (!fashionStyle) {
            setError("Please select a fashion theme.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPrompts(null);
        const stop = startProgressMessages();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const formData = new FormData();
            formData.append("theme", fashionStyle);
            formData.append("fashionStyle", fashionStyle);
            if (ethnicity) formData.append("ethnicity", ethnicity);
            if (gender) formData.append("gender", gender);
            if (skinColor) formData.append("skinColor", skinColor);
            if (hairColor) formData.append("hairColor", hairColor);
            if (facialExpression) formData.append("facialExpression", facialExpression);
            if (bodyComposition) formData.append("bodyComposition", bodyComposition);
            if (imperfection) formData.append("imperfection", imperfection);
            if (exactFacialStructure) formData.append("exactFacialStructure", String(exactFacialStructure));
            if (eyes) formData.append("eyes", eyes);
            if (eyebrows) formData.append("eyebrows", eyebrows);
            if (nose) formData.append("nose", nose);
            if (mouth) formData.append("mouth", mouth);
            if (ears) formData.append("ears", ears);

            if (backgroundEnvironment) formData.append("backgroundEnvironment", backgroundEnvironment);
            if (clothes) formData.append("clothes", clothes);
            if (clothesColor) formData.append("clothesColor", clothesColor);
            if (transformHead) formData.append("transformHead", String(transformHead));
            formData.append("angle", angle || "default");
            formData.append("cameraAngleImperfection", cameraAngleImperfection || "default");

            // Add isnotempty flag if any advanced setting is set (mimicking fake avatar logic just in case)
            const hasAdvancedSettings = [
                ethnicity, gender, skinColor, hairColor, facialExpression,
                bodyComposition, imperfection, eyes, eyebrows, nose, mouth, ears,
                backgroundEnvironment, clothes, clothesColor, angle, cameraAngleImperfection
            ].some(val => val && val.trim() !== "") || exactFacialStructure || transformHead;

            if (hasAdvancedSettings) {
                formData.append("isnotempty", "true");
            }

            const res = await fetch(FASHION_RANDOMIZER_WEBHOOK_URL, {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error(`Generation failed with status ${res.status}`);
            }

            const contentType = res.headers.get("content-type") || "";
            let data: any;
            if (contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }
            }

            // Normalize prompts
            let outPrompts: string[] = [];

            // 1. Direct Array Handling (Standard n8n)
            if (Array.isArray(data)) {
                outPrompts = data
                    .map((item: any) => {
                        // Check for output.prompt
                        if (item?.output?.prompt && typeof item.output.prompt === 'string') return item.output.prompt;
                        // Check for input.prompt
                        if (item?.input?.prompt && typeof item.input.prompt === 'string') return item.input.prompt;
                        // Check for top-level prompt
                        if (item?.prompt && typeof item.prompt === 'string') return item.prompt;
                        // Check for body.output.prompt (sometimes n8n wraps in body)
                        if (item?.body?.output?.prompt && typeof item.body.output.prompt === 'string') return item.body.output.prompt;

                        return null;
                    })
                    .filter((p): p is string => p !== null && p !== "");
            }
            // 2. Object handling (Single Execution or wrapped)
            else if (typeof data === "object") {
                // Check if 'output' is the array of items
                if (Array.isArray(data.output)) {
                    outPrompts = data.output.map((item: any) => {
                        if (typeof item === 'string') return item;
                        if (item?.prompt) return item.prompt;
                        return null;
                    }).filter((p: any): p is string => typeof p === 'string');
                }
                // Check if 'input' is the array
                else if (Array.isArray(data.input)) {
                    outPrompts = data.input.map((item: any) => item?.prompt).filter((p: any): p is string => typeof p === 'string');
                }
                // Single item object
                else {
                    if (data?.output?.prompt) outPrompts.push(data.output.prompt);
                    else if (data?.input?.prompt) outPrompts.push(data.input.prompt);
                    else if (data?.prompt) outPrompts.push(data.prompt);
                }
            }

            if (outPrompts.length === 0) {
                console.warn("Could not parse prompts from response", data);
                // Last resort: if data IS a string, use it
                if (typeof data === 'string') outPrompts = [data];
                else outPrompts = ["Generated successfully but could not find prompt text in response."];
            }


            setPrompts(outPrompts);
            toast.success("Fashion prompt generated successfully");

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
                        Fashion Randomizer
                    </h1>
                    <p className="text-foreground/80 text-lg">
                        Select a theme and customize settings to generate unique fashion prompts.
                    </p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Theme Selection */}
                <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        1. Select Theme <span className="text-destructive">*</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {THEMES.map((t) => (
                            <Button
                                key={t}
                                variant={fashionStyle === t ? "default" : "outline"}
                                onClick={() => setFashionStyle(t)}
                                disabled={t === "Flora/Beach"}
                                className={cn(
                                    "h-auto py-4 px-2 flex flex-col gap-2 items-center justify-center text-center whitespace-normal",
                                    fashionStyle === t ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                                    t === "Flora/Beach" && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <span className="font-medium">{t}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Advanced Settings - Shown only after theme is selected (or we can just show it) 
                    User requested: "when select one of that it will then show the advance settings"
                */}
                {fashionStyle && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-2">
                            <h2 className="text-lg font-semibold text-foreground mb-4">
                                2. Configure Settings
                            </h2>
                        </div>
                        <AdvancedSettingsAlwaysOpen
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

                        {!prompts && (
                            <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90 min-w-[200px]"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 animate-spin" /> Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2" /> Generate Fashion Prompt
                                            </>
                                        )}
                                    </Button>
                                    {isLoading && (
                                        <Button variant="outline" onClick={handleCancel} size="lg">
                                            <X className="mr-2" /> Cancel
                                        </Button>
                                    )}
                                </div>
                                <div className="mt-4 text-sm text-foreground/70">
                                    {isLoading && <p className="mt-1 text-primary font-medium">{status}</p>}
                                    {error && <p className="mt-2 text-destructive font-medium">{error}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {prompts && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ResultsSection
                            prompts={prompts}
                            onRegenerate={handleGenerate}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

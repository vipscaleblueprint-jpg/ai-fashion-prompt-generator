import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettingsAlwaysOpen from "@/components/AdvancedSettingsAlwaysOpen";
import { handleFakeAvatarSubmission } from "@/lib/fake-avatar-webhook";
import { toast } from "sonner";
import { Loader2, X, Sparkles } from "lucide-react";

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
    // Transform Head
    const [transformHead, setTransformHead] = useState(false);
    const [angle, setAngle] = useState("");
    // Background Environment
    const [backgroundEnvironment, setBackgroundEnvironment] = useState("");


    const abortRef = useRef<AbortController | null>(null);

    const resetAll = () => {
        setPrompts(null);
        setError(null);
        setStatus("Idle");
    };

    const startProgressMessages = () => {
        const messages = [
            "Creating your fake avatar...",
            "Generating AI prompt...",
            "Applying advanced settings...",
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
                transformHead,
                angle,
                backgroundEnvironment,
            });
            // Only use the first prompt (1 variation)
            const singlePrompt = out.length > 0 ? [out[0]] : [];
            setPrompts(singlePrompt);
            toast.success("Fake avatar prompt generated successfully");
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
                        AI Fake Avatar Generator
                    </h1>
                    <p className="text-foreground/80 text-lg">
                        Generate professional AI avatar prompts using advanced customization settings
                    </p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto space-y-6">
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
                    transformHead={transformHead}
                    setTransformHead={setTransformHead}
                    angle={angle}
                    setAngle={setAngle}
                    backgroundEnvironment={backgroundEnvironment}
                    setBackgroundEnvironment={setBackgroundEnvironment}
                />

                {!prompts && (
                    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            Get Started
                        </h2>
                        <p className="text-sm text-foreground/70 mb-4">
                            Configure your avatar settings above, then click Generate to create
                            a professional AI prompt for your fake avatar.
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
                                    <>
                                        <Sparkles className="mr-2" /> Generate Avatar Prompt
                                    </>
                                )}
                            </Button>
                            {isLoading && (
                                <Button variant="outline" onClick={handleCancel}>
                                    <X className="mr-2" /> Cancel
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
                        <div className="flex justify-center">
                            <Button variant="outline" onClick={resetAll}>
                                Generate Another Avatar
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

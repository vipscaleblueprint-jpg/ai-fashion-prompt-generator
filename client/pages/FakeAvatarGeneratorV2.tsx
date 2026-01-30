import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ResultsSection from "@/components/ResultsSection";
import { handleAvatarV2Submission } from "@/lib/avatar-v2-webhook";
import { toast } from "sonner";
import {
    Loader2,
    Sparkles,
    User,
    Camera,
    Smile,
    ScanFace,
    Zap,
    RotateCw,
    Eye,
    Palette,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const ETHNICITIES = [
    "American", "Asian", "Australian", "European", "Filipino", "Spanish"
];

const GENDERS = ["Male", "Female", "Non-binary", "Androgynous"];
const SKIN_COLORS = ["Fair", "Light", "Medium", "Tan", "Dark", "Deep", "Olive", "Pale"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Auburn", "Gray", "White", "Platinum", "Pink", "Blue"];

const EXPRESSIONS = ["Neutral", "Happy", "Sad", "Angry", "Surprised", "Serious", "Smiling"];

const ENVIRONMENTS = [
    "Minimalist Studio",
    "Cyberpunk Tokyo",
    "Sun-drenched Beach",
    "Industrial Warehouse",
    "Luxury Penthouse",
    "Modern Art Gallery",
    "Enchanted Forest",
    "Snowy Mountains",
    "Desert Dunes",
    "Digital Void",
    "Parisian Café"
];

export default function FakeAvatarGeneratorV2() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [prompts, setPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isManualEnv, setIsManualEnv] = useState(false);
    const [isManualExpression, setIsManualExpression] = useState(false);

    // Form State
    const [gender, setGender] = useState("");
    const [skinColor, setSkinColor] = useState("");
    const [facialExpression, setFacialExpression] = useState("");
    const [bodyComposition, setBodyComposition] = useState("");
    const [imperfection, setImperfection] = useState("");
    const [hairColor, setHairColor] = useState("");
    const [eyes, setEyes] = useState("");
    const [eyebrows, setEyebrows] = useState("");
    const [nose, setNose] = useState("");
    const [mouth, setMouth] = useState("");
    const [ears, setEars] = useState("");
    const [ethnicity, setEthnicity] = useState("");
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
    const [backgroundEnvironment, setBackgroundEnvironment] = useState("");

    const abortRef = useRef<AbortController | null>(null);

    const handleEthnicityToggle = (eth: string) => {
        setSelectedEthnicities((prev) => {
            const isSelected = prev.includes(eth);
            let newSelection;
            if (isSelected) {
                newSelection = prev.filter((e) => e !== eth);
            } else {
                if (prev.length >= 2) {
                    newSelection = [prev[1], eth];
                } else {
                    newSelection = [...prev, eth];
                }
            }

            if (newSelection.length === 0) {
                setEthnicity("");
            } else if (newSelection.length === 1) {
                setEthnicity(newSelection[0]);
            } else {
                setEthnicity(`Mixed - ${newSelection[0]} & ${newSelection[1]}`);
            }
            return newSelection;
        });
    };

    const resetAll = () => {
        setGender("");
        setSkinColor("");
        setFacialExpression("");
        setBodyComposition("");
        setImperfection("");
        setHairColor("");
        setEyes("");
        setEyebrows("");
        setNose("");
        setMouth("");
        setEars("");
        setEthnicity("");
        setSelectedEthnicities([]);
        setBackgroundEnvironment("");
        setPrompts(null);
        setError(null);
        setStatus("Idle");
    };

    const handleGenerate = async () => {
        if (!gender && !ethnicity && !backgroundEnvironment) {
            toast.error("Please fill in some basic details");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPrompts(null);
        setStatus("Synthesizing Identity...");

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const result = await handleAvatarV2Submission({
                gender,
                angle: "default", // Fixed or internal setting now
                skinColor,
                facialExpression,
                bodyComposition,
                imperfection,
                hairColor,
                eyes,
                eyebrows,
                nose,
                mouth,
                ears,
                ethnicity,
                backgroundEnvironment,
            }, controller.signal);

            setPrompts(result);
            toast.success("Avatar Identity Synthesized!");
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                setError(e?.message || "Synthesis failed. Please try again.");
                toast.error("Synthesis failed");
            }
        } finally {
            setIsLoading(false);
            setStatus("Idle");
            abortRef.current = null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto py-12 px-4 max-w-5xl relative z-10">
                {/* Header */}
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-primary uppercase shadow-sm">
                        <Zap className="w-3 h-3" />
                        Neural Identity Engine v2.0
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
                        AVATAR <span className="text-primary italic">GENERATOR</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                        Craft hyper-realistic virtual personas with precise anatomical control.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {/* Section: Ethnicity Selection (Mixed) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Ethnicity & Heritage</h3>
                                <p className="text-slate-400 text-xs">Select up to 2 for a mixed background</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto border border-slate-100 rounded-xl p-4 bg-slate-50/50 custom-scrollbar">
                            {ETHNICITIES.map((eth) => (
                                <div key={eth} className="flex items-center space-x-2 group cursor-pointer" onClick={() => handleEthnicityToggle(eth)}>
                                    <Checkbox
                                        id={`eth-${eth}`}
                                        checked={selectedEthnicities.includes(eth)}
                                        onCheckedChange={() => { }} // Handled by div click
                                        className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label
                                        htmlFor={`eth-${eth}`}
                                        className="text-sm font-medium leading-none text-slate-600 transition-colors group-hover:text-primary cursor-pointer"
                                    >
                                        {eth}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {selectedEthnicities.length > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Profile:</span>
                                <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">{ethnicity}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section: Core traits */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Core Appearance</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {GENDERS.map(g => (
                                            <Button
                                                key={g}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setGender(g.toLowerCase())}
                                                className={cn(
                                                    "h-10 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-[11px] font-bold uppercase",
                                                    gender === g.toLowerCase() && "border-primary bg-primary text-white hover:bg-primary shadow-sm"
                                                )}
                                            >
                                                {g}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skin Tone</Label>
                                        <Select value={skinColor} onValueChange={setSkinColor}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary shadow-none">
                                                <SelectValue placeholder="Skin" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 text-slate-800">
                                                {SKIN_COLORS.map(c => (
                                                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hair Color</Label>
                                        <Select value={hairColor} onValueChange={setHairColor}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary shadow-none">
                                                <SelectValue placeholder="Hair" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 text-slate-800">
                                                {HAIR_COLORS.map(c => (
                                                    <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <Smile className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Vibe & Physique</h3>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsManualExpression(!isManualExpression);
                                        if (!isManualExpression) setFacialExpression("");
                                    }}
                                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"
                                >
                                    {isManualExpression ? "Switch to List" : "Manual Moody"}
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facial Expression</Label>
                                    {isManualExpression ? (
                                        <Input
                                            value={facialExpression}
                                            onChange={e => setFacialExpression(e.target.value)}
                                            placeholder="e.g. smirking confidently, mysterious"
                                            className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary shadow-none"
                                        />
                                    ) : (
                                        <Select value={facialExpression} onValueChange={setFacialExpression}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200 h-11 rounded-xl shadow-none">
                                                <SelectValue placeholder="Select mood" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 text-slate-800">
                                                {EXPRESSIONS.map(e => (
                                                    <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Body Composition</Label>
                                    <Input
                                        value={bodyComposition}
                                        onChange={e => setBodyComposition(e.target.value)}
                                        placeholder="e.g. lean and athletic"
                                        className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Imperfections</Label>
                                    <Input
                                        value={imperfection}
                                        onChange={e => setImperfection(e.target.value)}
                                        placeholder="e.g. faint scars, vitiligo, moles"
                                        className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Anatomical Details */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <ScanFace className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Anatomical Precision</h3>
                                <p className="text-slate-400 text-xs">Define specific micro-features</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { id: 'eyes', label: 'Eyes', icon: <Eye className="w-3 h-3" />, val: eyes, set: setEyes, placeholder: "e.g. almond shaped, hazel" },
                                { id: 'eyebrows', label: 'Eyebrows', icon: null, val: eyebrows, set: setEyebrows, placeholder: "e.g. thick, feathered" },
                                { id: 'nose', label: 'Nose', icon: null, val: nose, set: setNose, placeholder: "e.g. aquiline" },
                                { id: 'mouth', label: 'Mouth', icon: null, val: mouth, set: setMouth, placeholder: "e.g. Cupid's bow" },
                                { id: 'ears', label: 'Ears', icon: null, val: ears, set: setEars, placeholder: "e.g. small" }
                            ].map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        {field.icon} {field.label}
                                    </Label>
                                    <Input
                                        value={field.val}
                                        onChange={e => field.set(e.target.value)}
                                        placeholder={field.placeholder}
                                        className="bg-slate-50 border-slate-200 h-11 rounded-xl focus:ring-primary shadow-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Scene Background</h3>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsManualEnv(!isManualEnv);
                                    if (!isManualEnv) setBackgroundEnvironment("");
                                }}
                                className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"
                            >
                                {isManualEnv ? "Switch to List" : "Custom Environment"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment Description</Label>
                            {isManualEnv ? (
                                <Input
                                    value={backgroundEnvironment}
                                    onChange={e => setBackgroundEnvironment(e.target.value)}
                                    placeholder="e.g. minimalist high-end designer studio"
                                    className="bg-slate-50 border-slate-200 h-12 rounded-xl focus:ring-primary shadow-none"
                                />
                            ) : (
                                <Select value={backgroundEnvironment} onValueChange={setBackgroundEnvironment}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl shadow-none">
                                        <SelectValue placeholder="Select a scene setting" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                                        {ENVIRONMENTS.map(env => (
                                            <SelectItem key={env} value={env}>{env}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Final Action Button */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full max-w-md h-16 rounded-2xl bg-primary text-white font-bold text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="animate-spin w-6 h-6" />
                                <span className="uppercase tracking-widest text-sm">{status}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                                <span>Initialize Synthesis</span>
                            </div>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={resetAll}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-2 hover:bg-slate-100/50 rounded-xl"
                    >
                        <RotateCw className="w-4 h-4" />
                        System Reset
                    </Button>
                </div>

                {/* Results Section */}
                {prompts && (
                    <div className="mt-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <div className="flex flex-col items-center gap-4 mb-12 text-center">
                            <div className="h-1.5 w-24 bg-primary rounded-full" />
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">IDENTITY SYNTHESIS COMPLETE</h2>
                            <p className="text-slate-400 font-medium">The following prompts have been generated based on your settings.</p>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <ResultsSection
                                prompts={prompts}
                                hideAnalysis={true}
                                hideVariations={true}
                                hideMasterRandomize={true}
                            />
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Comprehensive list of ethnicities
const ETHNICITIES = [
    "American",
    "Asian",
    "Australian",
    "European",
    "Filipino",
    "Spanish",
];

export interface AdvancedSettingsAlwaysOpenProps {
    ethnicity: string;
    setEthnicity: (value: string) => void;
    gender: string;
    setGender: (value: string) => void;
    skinColor: string;
    setSkinColor: (value: string) => void;
    hairColor: string;
    setHairColor: (value: string) => void;
    facialExpression: string;
    setFacialExpression: (value: string) => void;
    bodyComposition: string;
    setBodyComposition: (value: string) => void;
    imperfection: string;
    setImperfection: (value: string) => void;
    // Facial Structure
    exactFacialStructure: boolean;
    setExactFacialStructure: (value: boolean) => void;
    eyes: string;
    setEyes: (value: string) => void;
    eyebrows: string;
    setEyebrows: (value: string) => void;
    nose: string;
    setNose: (value: string) => void;
    mouth: string;
    setMouth: (value: string) => void;
    ears: string;
    setEars: (value: string) => void;

    // Background Environment
    backgroundEnvironment: string;
    setBackgroundEnvironment: (value: string) => void;
    // Pose (Optional)
    pose?: string;
    setPose?: (value: string) => void;

    // Fashion Settings (New)
    fashionStyle?: string;
    setFashionStyle?: (value: string) => void;
    clothes?: string;
    setClothes?: (value: string) => void;
    clothesColor?: string;
    setClothesColor?: (value: string) => void;

    // Transformation Settings (New)
    transformHead: boolean;
    setTransformHead: (value: boolean) => void;
    angle?: string;
    setAngle?: (value: string) => void;
    cameraAngleImperfection?: string;
    setCameraAngleImperfection?: (value: string) => void;
    // Coming Soon mode
    comingSoon?: boolean;
}

export default function AdvancedSettingsAlwaysOpen({
    ethnicity,
    setEthnicity,
    gender,
    setGender,
    skinColor,
    setSkinColor,
    hairColor,
    setHairColor,
    facialExpression,
    setFacialExpression,
    bodyComposition,
    setBodyComposition,
    imperfection,
    setImperfection,
    exactFacialStructure,
    setExactFacialStructure,
    eyes,
    setEyes,
    eyebrows,
    setEyebrows,
    nose,
    setNose,
    mouth,
    setMouth,
    ears,
    setEars,

    backgroundEnvironment,
    setBackgroundEnvironment,
    pose,
    setPose,

    fashionStyle,
    setFashionStyle,
    clothes,
    setClothes,
    clothesColor,
    setClothesColor,

    transformHead,
    setTransformHead,
    angle,
    setAngle,
    cameraAngleImperfection,
    setCameraAngleImperfection,
    comingSoon = false,
}: AdvancedSettingsAlwaysOpenProps) {
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
    const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
    const [isFacialExpanded, setIsFacialExpanded] = useState(false);
    const [isEnvExpanded, setIsEnvExpanded] = useState(false);
    const [isFashionExpanded, setIsFashionExpanded] = useState(false);
    const [isTransformationExpanded, setIsTransformationExpanded] = useState(false);
    const [isCameraImperfectionExpanded, setIsCameraImperfectionExpanded] = useState(false);
    const [isFashionManual, setIsFashionManual] = useState(false);

    // Parse existing ethnicity value on mount
    useState(() => {
        if (ethnicity && ethnicity.startsWith("Mixed - ")) {
            const parts = ethnicity.replace("Mixed - ", "").split(" & ");
            setSelectedEthnicities(parts);
        }
    });

    const handleEthnicityToggle = (ethnicityName: string) => {
        setSelectedEthnicities((prev) => {
            const isSelected = prev.includes(ethnicityName);

            if (isSelected) {
                // Remove if already selected
                const newSelection = prev.filter((e) => e !== ethnicityName);
                updateEthnicityValue(newSelection);
                return newSelection;
            } else {
                // Add if not selected and limit to 2
                if (prev.length >= 2) {
                    // Replace the first one with the new selection
                    const newSelection = [prev[1], ethnicityName];
                    updateEthnicityValue(newSelection);
                    return newSelection;
                } else {
                    const newSelection = [...prev, ethnicityName];
                    updateEthnicityValue(newSelection);
                    return newSelection;
                }
            }
        });
    };

    const updateEthnicityValue = (selected: string[]) => {
        if (selected.length === 0) {
            setEthnicity("");
        } else if (selected.length === 1) {
            setEthnicity(selected[0]);
        } else {
            setEthnicity(`Mixed - ${selected[0]} & ${selected[1]}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Avatar Identity Group */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className={`flex items-center justify-between group ${comingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    onClick={() => !comingSoon && setIsIdentityExpanded(!isIdentityExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                            <span className="h-1 w-4 rounded-full bg-primary" />
                            Avatar Identity
                            <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                        </h3>
                    </div>
                    {comingSoon ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-primary animate-pulse bg-primary/10 px-2 py-1 rounded-md">
                                In Progress - Coming Soon
                            </span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isIdentityExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {isIdentityExpanded && (
                    <div className="grid gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Ethnicity (Select up to 2)
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {ETHNICITIES.map((eth) => {
                                    const isSelected = selectedEthnicities.includes(eth);
                                    return (
                                        <button
                                            key={eth}
                                            type="button"
                                            onClick={() => handleEthnicityToggle(eth)}
                                            className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isSelected
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-foreground hover:bg-accent"
                                                }`}
                                        >
                                            {eth}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender</Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skin Color</Label>
                                <Select value={skinColor} onValueChange={setSkinColor}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Skin Color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["fair", "light", "medium", "tan", "dark", "deep"].map(c => (
                                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hair Color</Label>
                                <Select value={hairColor} onValueChange={setHairColor}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hair Color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["black", "brown", "blonde", "red", "auburn", "gray", "white", "platinum"].map(c => (
                                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facial Expression</Label>
                                <Select value={facialExpression} onValueChange={setFacialExpression}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Expression" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["neutral", "happy", "serious", "smiling", "surprised", "angry"].map(c => (
                                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Facial Structure Group */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className={`flex items-center justify-between group ${comingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    onClick={() => !comingSoon && setIsFacialExpanded(!isFacialExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                            <span className="h-1 w-4 rounded-full bg-secondary" />
                            Facial Details
                            <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                        </h3>
                    </div>
                    {comingSoon ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-secondary animate-pulse bg-secondary/10 px-2 py-1 rounded-md">
                                In Progress - Coming Soon
                            </span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isFacialExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {isFacialExpanded && (
                    <div className="grid gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center space-x-2 rounded-lg bg-accent/30 px-3 py-2 border border-border/50 max-w-fit">
                            <Checkbox
                                id="exactFacialStructure"
                                checked={exactFacialStructure}
                                onCheckedChange={(checked) => setExactFacialStructure(checked === true)}
                            />
                            <Label htmlFor="exactFacialStructure" className="text-xs font-bold text-foreground cursor-pointer uppercase tracking-tight">
                                Enable Exact Structure
                            </Label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 border-dashed border-border/50">
                            {exactFacialStructure ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eyes</Label>
                                        <Input
                                            value={eyes}
                                            onChange={(e) => setEyes(e.target.value)}
                                            placeholder="e.g. almond-shaped, blue"
                                            className="bg-accent/10 border-border/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nose</Label>
                                        <Input
                                            value={nose}
                                            onChange={(e) => setNose(e.target.value)}
                                            placeholder="e.g. straight, small"
                                            className="bg-accent/10 border-border/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mouth</Label>
                                        <Input
                                            value={mouth}
                                            onChange={(e) => setMouth(e.target.value)}
                                            placeholder="e.g. full lips, wide smile"
                                            className="bg-accent/10 border-border/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Imperfections</Label>
                                        <Input
                                            value={imperfection}
                                            onChange={(e) => setImperfection(e.target.value)}
                                            placeholder="e.g. freckles, scar"
                                            className="bg-accent/10 border-border/40"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-full py-4 text-center rounded-xl bg-accent/20 border border-dashed border-border/40">
                                    <p className="text-xs italic text-muted-foreground">
                                        Enable "Exact Structure" above to define specific features.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Background & Body */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className={`flex items-center justify-between group ${comingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    onClick={() => !comingSoon && setIsEnvExpanded(!isEnvExpanded)}
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                        <span className="h-1 w-4 rounded-full bg-emerald-500" />
                        Environment & Body
                        <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                    </h3>
                    {comingSoon ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-600 animate-pulse bg-emerald-500/10 px-2 py-1 rounded-md">
                                In Progress - Coming Soon
                            </span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isEnvExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {isEnvExpanded && (
                    <div className="grid gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Environment Template</Label>
                            <Select value={backgroundEnvironment} onValueChange={setBackgroundEnvironment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Environment" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {[
                                        "studio", "urban-street", "nature-outdoor", "office", "cafe",
                                        "beach", "mountain", "city-skyline", "industrial", "minimalist",
                                        "luxury", "vintage", "futuristic", "bokeh"
                                    ].map(v => (
                                        <SelectItem key={v} value={v} className="capitalize">{v.replace('-', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body Composition</Label>
                            <Input
                                value={bodyComposition}
                                onChange={(e) => setBodyComposition(e.target.value)}
                                placeholder="e.g. athletic, slim, curves"
                                className="bg-accent/10 border-border/40"
                            />
                        </div>

                        {pose !== undefined && setPose && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pose</Label>
                                <Input
                                    value={pose}
                                    onChange={(e) => setPose(e.target.value)}
                                    placeholder="e.g. hands on hips, walking"
                                    className="bg-accent/10 border-border/40"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fashion Settings */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className={`flex items-center justify-between group ${comingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    onClick={() => !comingSoon && setIsFashionExpanded(!isFashionExpanded)}
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                        <span className="h-1 w-4 rounded-full bg-orange-500" />
                        Fashion Settings
                        <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                    </h3>
                    {comingSoon ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-orange-600 animate-pulse bg-orange-500/10 px-2 py-1 rounded-md">
                                In Progress - Coming Soon
                            </span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isFashionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {isFashionExpanded && (
                    <div className="grid gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fashion Style</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFashionManual(!isFashionManual);
                                    }}
                                    className="h-7 text-[10px] px-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-black uppercase"
                                >
                                    {isFashionManual ? "Switch to Select" : "Manual Input"}
                                </Button>
                            </div>
                            {isFashionManual ? (
                                <Input
                                    placeholder="Enter style manualy..."
                                    value={fashionStyle}
                                    onChange={(e) => setFashionStyle(e.target.value)}
                                    className="bg-accent/10 border-border/40"
                                />
                            ) : (
                                <Select value={fashionStyle} onValueChange={setFashionStyle}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["Casual", "Formal", "Casual Formal", "Flora/Beach", "Vintage/Retro"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clothes Color</Label>
                                <Input
                                    value={clothesColor}
                                    onChange={(e) => setClothesColor(e.target.value)}
                                    placeholder="e.g. Navy Blue, Red"
                                    className="bg-accent/10 border-border/40"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clothes Description</Label>
                                <Input
                                    value={clothes}
                                    onChange={(e) => setClothes(e.target.value)}
                                    placeholder="e.g. Silk dress, Linen shirt"
                                    className="bg-accent/10 border-border/40"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Talking Head / Transformation */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className={`flex items-center justify-between group ${comingSoon ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    onClick={() => !comingSoon && setIsTransformationExpanded(!isTransformationExpanded)}
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                        <span className="h-1 w-4 rounded-full bg-purple-500" />
                        Talking Head
                        <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                    </h3>
                    {comingSoon ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-purple-600 animate-pulse bg-purple-500/10 px-2 py-1 rounded-md">
                                In Progress - Coming Soon
                            </span>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isTransformationExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {isTransformationExpanded && (
                    <div className="grid gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center space-x-2 rounded-lg bg-accent/30 px-3 py-2 border border-border/50 max-w-fit">
                            <Checkbox
                                id="transformHead"
                                checked={transformHead}
                                onCheckedChange={(checked) => setTransformHead(checked === true)}
                            />
                            <Label htmlFor="transformHead" className="text-xs font-bold text-foreground cursor-pointer uppercase tracking-tight">
                                Enable Talking Head
                            </Label>
                        </div>

                        {transformHead && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300 border-t pt-4 border-dashed border-border/50">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Angle</Label>
                                <Select value={angle} onValueChange={setAngle}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Angle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["close-up", "medium-close-up", "wide-close-up", "full-body"].map(v => (
                                            <SelectItem key={v} value={v} className="capitalize">{v.replace(/-/g, ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {!transformHead && (
                            <div className="col-span-full py-4 text-center rounded-xl bg-accent/20 border border-dashed border-border/40">
                                <p className="text-xs italic text-muted-foreground">
                                    Enable "Talking Head" above to set specific camera angles.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Camera Angle Imperfections */}
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => setIsCameraImperfectionExpanded(!isCameraImperfectionExpanded)}
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover:text-foreground">
                        <span className="h-1 w-4 rounded-full bg-blue-500" />
                        Camera Angle Imperfections
                        <span className="ml-2 rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Optional</span>
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isCameraImperfectionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {isCameraImperfectionExpanded && (
                    <div className="grid gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Angle Selection</Label>
                            <Select value={cameraAngleImperfection} onValueChange={setCameraAngleImperfection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Imperfection" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Slightly noticeable tilt (6° roll)">Slightly noticeable tilt (6° roll)</SelectItem>
                                    <SelectItem value="Moderate tilt (8° roll)">Moderate tilt (8° roll)</SelectItem>
                                    <SelectItem value="Strong tilt (10° roll)">Strong tilt (10° roll)</SelectItem>
                                    <SelectItem value="Pronounced tilt (12° roll)">Pronounced tilt (12° roll)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

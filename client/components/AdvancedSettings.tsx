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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Comprehensive list of ethnicities
const ETHNICITIES = [
    // "Afghan",
    // "African",
    // "Albanian",
    "American",
    // "Arab",
    // "Argentine",
    // "Armenian",
    "Asian",
    "Australian",
    // "Austrian",
    // "Bangladeshi",
    // "Belgian",
    // "Brazilian",
    // "British",
    // "Britsh",
    // "Bulgarian",
    // "Cambodian",
    // "Canadian",
    // "Chilean",
    // "Chinese",
    // "Colombian",
    // "Croatian",
    // "Cuban",
    // "Czech",
    // "Danish",
    // "Dominican",
    // "Dutch",
    // "Egyptian",
    // "Ethiopian",
    "European",
    "Filipino",
    // "Finnish",
    // "French",
    // "German",
    // "Greek",
    // "Guatemalan",
    // "Haitian",
    // "Hawaiian",
    // "Hispanic",
    // "Hungarian",
    // "Indian",
    // "Indonesian",
    // "Iranian",
    // "Iraqi",
    // "Irish",
    // "Israeli",
    // "Italian",
    // "Jamaican",
    // "Japanese",
    // "Jordanian",
    // "Korean",
    // "Kurdish",
    // "Laotian",
    // "Lebanese",
    // "Malaysian",
    // "Mexican",
    // "Moroccan",
    // "Native American",
    // "Nepalese",
    // "Nigerian",
    // "Norwegian",
    // "Pakistani",
    // "Palestinian",
    // "Peruvian",
    // "Polish",
    // "Portuguese",
    // "Puerto Rican",
    // "Romanian",
    // "Russian",
    // "Salvadoran",
    // "Saudi",
    // "Scottish",
    // "Serbian",
    // "Singaporean",
    // "Somali",
    // "South African",
    "Spanish",
    // "Sri Lankan",
    // "Swedish",
    // "Swiss",
    // "Syrian",
    // "Taiwanese",
    // "Thai",
    // "Turkish",
    // "Ukrainian",
    // "Venezuelan",
    // "Vietnamese",
    // "Welsh",
    // "Yemeni",
];

export interface AdvancedSettingsProps {
    mode?: string;
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
    // Transform Head
    transformHead: boolean;
    setTransformHead: (value: boolean) => void;
    angle: string;
    setAngle: (value: string) => void;
    // Pose (Optional - only for main Generator)
    pose?: string;
    setPose?: (value: string) => void;
    // Fashion Settings
    fashionStyle?: string;
    setFashionStyle?: (value: string) => void;
    clothes?: string;
    setClothes?: (value: string) => void;
    clothesColor?: string;
    setClothesColor?: (value: string) => void;
    cameraAngleImperfection?: string;
    setCameraAngleImperfection?: (value: string) => void;
}

export default function AdvancedSettings({
    mode,
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
    transformHead,
    setTransformHead,
    angle,
    setAngle,
    pose,
    setPose,
    fashionStyle,
    setFashionStyle,
    clothes,
    setClothes,
    clothesColor,
    setClothesColor,
    cameraAngleImperfection,
    setCameraAngleImperfection,
}: AdvancedSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
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
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-xl border border-border bg-white shadow-sm">
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between p-6 hover:bg-accent"
                    >
                        <h2 className="text-lg font-semibold text-foreground">
                            Advanced Settings (Optional)
                        </h2>
                        {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-6 pb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Ethnicity (Select up to 2)</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
                                    {ETHNICITIES.map((eth) => (
                                        <div key={eth} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`ethnicity-${eth}`}
                                                checked={selectedEthnicities.includes(eth)}
                                                onCheckedChange={() => handleEthnicityToggle(eth)}
                                            />
                                            <label
                                                htmlFor={`ethnicity-${eth}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {eth}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {selectedEthnicities.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Selected: {ethnicity || selectedEthnicities.join(", ")}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skinColor">Skin Color</Label>
                                <Select value={skinColor} onValueChange={setSkinColor}>
                                    <SelectTrigger id="skinColor">
                                        <SelectValue placeholder="Select Skin Color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fair">Fair</SelectItem>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="tan">Tan</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="deep">Deep</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hairColor">Hair Color</Label>
                                <Select value={hairColor} onValueChange={setHairColor}>
                                    <SelectTrigger id="hairColor">
                                        <SelectValue placeholder="Select Hair Color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="black">Black</SelectItem>
                                        <SelectItem value="brown">Brown</SelectItem>
                                        <SelectItem value="blonde">Blonde</SelectItem>
                                        <SelectItem value="red">Red</SelectItem>
                                        <SelectItem value="auburn">Auburn</SelectItem>
                                        <SelectItem value="gray">Gray</SelectItem>
                                        <SelectItem value="white">White</SelectItem>
                                        <SelectItem value="platinum">Platinum</SelectItem>
                                        <SelectItem value="burgundy">Burgundy</SelectItem>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="pink">Pink</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="facialExpression">Facial Expression</Label>
                                <Select value={facialExpression} onValueChange={setFacialExpression}>
                                    <SelectTrigger id="facialExpression">
                                        <SelectValue placeholder="Select Expression" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="neutral">Neutral</SelectItem>
                                        <SelectItem value="happy">Happy</SelectItem>
                                        <SelectItem value="sad">Sad</SelectItem>
                                        <SelectItem value="angry">Angry</SelectItem>
                                        <SelectItem value="surprised">Surprised</SelectItem>
                                        <SelectItem value="serious">Serious</SelectItem>
                                        <SelectItem value="smiling">Smiling</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="exactFacialStructure"
                                        checked={exactFacialStructure}
                                        onCheckedChange={(checked) => setExactFacialStructure(checked === true)}
                                    />
                                    <Label
                                        htmlFor="exactFacialStructure"
                                        className="text-base font-medium cursor-pointer"
                                    >
                                        Enable Exact Facial Structure
                                    </Label>
                                </div>
                            </div>

                            {exactFacialStructure && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="eyes">Eyes</Label>
                                        <Input
                                            id="eyes"
                                            placeholder="e.g. almond-shaped, blue eyes"
                                            value={eyes}
                                            onChange={(e) => setEyes(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="eyebrows">Eyebrows</Label>
                                        <Input
                                            id="eyebrows"
                                            placeholder="e.g. thick, arched eyebrows"
                                            value={eyebrows}
                                            onChange={(e) => setEyebrows(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nose">Nose</Label>
                                        <Input
                                            id="nose"
                                            placeholder="e.g. straight, small nose"
                                            value={nose}
                                            onChange={(e) => setNose(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mouth">Mouth</Label>
                                        <Input
                                            id="mouth"
                                            placeholder="e.g. full lips, wide smile"
                                            value={mouth}
                                            onChange={(e) => setMouth(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ears">Ears</Label>
                                        <Input
                                            id="ears"
                                            placeholder="e.g. small, close-set ears"
                                            value={ears}
                                            onChange={(e) => setEars(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2 sm:col-span-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="transformHead"
                                        checked={transformHead}
                                        onCheckedChange={(checked) => setTransformHead(checked === true)}
                                    />
                                    <Label
                                        htmlFor="transformHead"
                                        className="text-base font-medium cursor-pointer"
                                    >
                                        Enable Talking Head
                                    </Label>
                                </div>
                            </div>

                            {transformHead && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="angle">Angle</Label>
                                    <Select value={angle} onValueChange={setAngle}>
                                        <SelectTrigger id="angle">
                                            <SelectValue placeholder="Select Angle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="close-up">Close-Up</SelectItem>
                                            <SelectItem value="medium-close-up">Medium Close-Up</SelectItem>
                                            <SelectItem value="wide-close-up">Wide Close-Up</SelectItem>
                                            <SelectItem value="full-body">Full-Body</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2 sm:col-span-2 border-t pt-4">
                                <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider block mb-2">Camera Angle Imperfections</Label>
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

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="bodyComposition">Body Composition</Label>
                                <Input
                                    id="bodyComposition"
                                    placeholder="e.g. athletic, slim, curvy, muscular"
                                    value={bodyComposition}
                                    onChange={(e) => setBodyComposition(e.target.value)}
                                />
                            </div>

                            {pose !== undefined && setPose && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="pose">Pose</Label>
                                    <Input
                                        id="pose"
                                        placeholder="e.g. standing, sitting, walking, hands on hips"
                                        value={pose}
                                        onChange={(e) => setPose(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="imperfection">Imperfection</Label>
                                <Input
                                    id="imperfection"
                                    placeholder="e.g. freckles, scar, mole"
                                    value={imperfection}
                                    onChange={(e) => setImperfection(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4 sm:col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Fashion Settings</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="fashionStyle">Fashion Randomizer</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsFashionManual(!isFashionManual)}
                                                className="h-7 text-xs px-3 text-primary border-primary/40 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all shadow-sm"
                                            >
                                                {isFashionManual ? "Switch to Dropdown" : "Switch to Manual Input"}
                                            </Button>
                                        </div>
                                        {isFashionManual ? (
                                            <Input
                                                id="fashionStyle"
                                                placeholder="Enter style manualy"
                                                value={fashionStyle}
                                                onChange={(e) => setFashionStyle(e.target.value)}
                                            />
                                        ) : (
                                            <Select value={fashionStyle} onValueChange={setFashionStyle}>
                                                <SelectTrigger id="fashionStyle">
                                                    <SelectValue placeholder="Select Style" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Casual">Casual</SelectItem>
                                                    <SelectItem value="Formal">Formal</SelectItem>
                                                    <SelectItem value="Casual Formal">Casual Formal</SelectItem>
                                                    <SelectItem value="Flora/Beach">Flora/Beach</SelectItem>
                                                    <SelectItem value="Vintage/Retro">Vintage/Retro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="clothesColor">Clothes Color</Label>
                                        <Input
                                            id="clothesColor"
                                            placeholder="e.g. Red, Navy Blue, Pastel Green"
                                            value={clothesColor}
                                            onChange={(e) => setClothesColor(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="clothes">Clothes Description</Label>
                                        <Input
                                            id="clothes"
                                            placeholder="e.g. Silk dress, Linen shirt, Leather jacket"
                                            value={clothes}
                                            onChange={(e) => setClothes(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

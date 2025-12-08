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
    // Transform Head
    transformHead: boolean;
    setTransformHead: (value: boolean) => void;
    angle: string;
    setAngle: (value: string) => void;
    // Background Environment
    backgroundEnvironment: string;
    setBackgroundEnvironment: (value: string) => void;
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
    transformHead,
    setTransformHead,
    angle,
    setAngle,
    backgroundEnvironment,
    setBackgroundEnvironment,
}: AdvancedSettingsAlwaysOpenProps) {
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);

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
        <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Avatar Settings
                </h2>
                <div className="space-y-4">
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

                        <div className="space-y-2">
                            <Label htmlFor="backgroundEnvironment">Background/Environment Theme</Label>
                            <Select value={backgroundEnvironment} onValueChange={setBackgroundEnvironment}>
                                <SelectTrigger id="backgroundEnvironment">
                                    <SelectValue placeholder="Select Background" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="studio">Studio</SelectItem>
                                    <SelectItem value="urban-street">Urban Street</SelectItem>
                                    <SelectItem value="nature-outdoor">Nature/Outdoor</SelectItem>
                                    <SelectItem value="office">Office</SelectItem>
                                    <SelectItem value="cafe">Cafe</SelectItem>
                                    <SelectItem value="beach">Beach</SelectItem>
                                    <SelectItem value="mountain">Mountain</SelectItem>
                                    <SelectItem value="desert">Desert</SelectItem>
                                    <SelectItem value="forest">Forest</SelectItem>
                                    <SelectItem value="city-skyline">City Skyline</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                    <SelectItem value="luxury">Luxury</SelectItem>
                                    <SelectItem value="vintage">Vintage</SelectItem>
                                    <SelectItem value="futuristic">Futuristic</SelectItem>
                                    <SelectItem value="abstract">Abstract</SelectItem>
                                    <SelectItem value="gradient">Gradient</SelectItem>
                                    <SelectItem value="bokeh">Bokeh</SelectItem>
                                    <SelectItem value="solid-color">Solid Color</SelectItem>
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
                                    Enable Transform Head
                                </Label>
                            </div>
                        </div>

                        {transformHead && (
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="angle">Angle</Label>
                                <Select value={angle} onValueChange={setAngle} disabled={!transformHead}>
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

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="bodyComposition">Body Composition</Label>
                            <Input
                                id="bodyComposition"
                                placeholder="e.g. athletic, slim, curvy, muscular"
                                value={bodyComposition}
                                onChange={(e) => setBodyComposition(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="imperfection">Imperfection</Label>
                            <Input
                                id="imperfection"
                                placeholder="e.g. freckles, scar, mole"
                                value={imperfection}
                                onChange={(e) => setImperfection(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

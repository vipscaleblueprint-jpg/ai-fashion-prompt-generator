import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ImagePreview from "@/components/ImagePreview";
import ResultsSection from "@/components/ResultsSection";
import AdvancedSettings from "@/components/AdvancedSettings";
import { handleBrollImageSubmission2, fetchFaceProfile } from "@/lib/broll-webhook";
import { fetchMarketingClients, MarketingClient } from "@/lib/marketing-client-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


// Local definition removed in favor of import
// type MarketingClient = {
//     client_name: string;
//     clickup_id: string;
//     clockify_id: string;
// };

export default function BrollToPrompt2() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    // refFile state removed
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [prompts, setPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Kling State (Removed)



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

    // Fashion Settings
    const [fashionStyle, setFashionStyle] = useState("");
    const [clothes, setClothes] = useState("");
    const [clothesColor, setClothesColor] = useState("");

    // Client List State
    const [selectedClient, setSelectedClient] = useState("");
    const [clientList, setClientList] = useState<MarketingClient[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isFetchingFaceProfile, setIsFetchingFaceProfile] = useState(false);

    // UI State - Upload section only shows when image is selected
    const [isUploadSectionOpen, setIsUploadSectionOpen] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [allResults, setAllResults] = useState<string[]>([]); // Store all results
    const [originalResults, setOriginalResults] = useState<string[]>([]); // Store original unfiltered results
    const [visibleCount, setVisibleCount] = useState(8);
    const [generatingUrl, setGeneratingUrl] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<"all" | "most-used">("all");

    const abortRef = useRef<AbortController | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);
        setVisibleCount(8);
        setSelectedImageUrl(null); // Reset selection when searching
        try {
            const response = await fetch('/api/broll-scene/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
            });
            if (response.ok) {
                const data = await response.json();
                const urls = data.map((item: any) => item.image_url || item.imageUrl || item.url).filter(Boolean);
                if (urls && urls.length > 0) {
                    setSearchResults(urls);
                    setAllResults(urls);
                    // Do NOT overwrite originalResults here - we want to keep the full list for resetting
                    toast.success(`Found ${urls.length} images`);
                } else {
                    toast.error("No images found for your query.");
                }
            } else {
                toast.error("Failed to search images.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to search images.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectImage = async (url: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const fileName = `search-result-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: blob.type });
            onFileSelected(file);
            // Set selected image and filter results to show only this one
            setSelectedImageUrl(url);
            setSearchResults([url]);
            toast.success("Image loaded!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to load selected image.");
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoadingClients(true);
            try {
                // Modified to use the new webhook-based fetcher
                const data = await fetchMarketingClients();
                setClientList(data);
            } catch (error) {
                console.error("Error fetching clients:", error);
                toast.error("Failed to load client list");
            } finally {
                setIsLoadingClients(false);
            }
        };

        fetchClients();
    }, []);

    // Load all images on page mount
    useEffect(() => {
        const loadAllImages = async () => {
            setIsSearching(true);
            try {
                // Fetch all images from MongoDB (with cache busting)
                const response = await fetch(`/api/broll-scene?t=${Date.now()}`);
                console.log('BrollToPrompt2: Fetch response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('BrollToPrompt2: Raw data fetched:', data);
                    // Extract image URLs from the data
                    const urls = data.map((item: any) => item.image_url || item.imageUrl || item.url).filter(Boolean);
                    console.log('BrollToPrompt2: Extracted URLs:', urls);
                    if (urls && urls.length > 0) {
                        setSearchResults(urls);
                        setAllResults(urls);
                        setOriginalResults(urls);
                    } else {
                        console.warn('BrollToPrompt2: No images returned from initial load');
                    }
                } else {
                    console.error('BrollToPrompt2: Fetch failed with status:', response.status);
                }
            } catch (e) {
                console.error("Error loading images:", e);
            } finally {
                setIsSearching(false);
            }
        };

        loadAllImages();
    }, []);

    // Handle filter mode changes
    useEffect(() => {
        const applyFilter = async () => {
            if (filterMode === "most-used") {
                try {
                    // Fetch from MongoDB API which has usageCount
                    const response = await fetch('/api/broll-scene');
                    if (response.ok) {
                        const data = await response.json();
                        // Sort by usageCount descending
                        const sorted = data.sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0));
                        const urls = sorted.map((item: any) => item.image_url).filter(Boolean);
                        setSearchResults(urls);
                        setAllResults(urls);
                    }
                } catch (err) {
                    console.error("Failed to fetch most used:", err);
                }
            } else {
                // Reset to original unfiltered results
                if (originalResults.length > 0) {
                    setSearchResults(originalResults);
                    setAllResults(originalResults);
                }
            }
        };

        applyFilter();
    }, [filterMode]);

    const onFileSelected = (f: File) => {
        setFile(f);
        // Do not clear prompts or Kling prompt when selecting a file, as requested for persistence
        setError(null);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        // Show upload section when image is selected
        setIsUploadSectionOpen(true);
    };

    const resetAll = () => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPrompts(null);
        setError(null);
        setStatus("Idle");
        // Hide upload section when resetting
        setIsUploadSectionOpen(false);
        // Restore all search results
        setSelectedImageUrl(null);
        if (originalResults.length > 0) {
            setSearchResults(originalResults);
            setAllResults(originalResults);
        }
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

    const handleGenerate = async (imageSourceOverride?: File | string) => {
        const sourceToUse = imageSourceOverride || file;
        if (!sourceToUse) return;
        setIsLoading(true);
        setError(null);
        const stop = startProgressMessages();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const out = await handleBrollImageSubmission2(sourceToUse, null, {
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
                angle: angle || "default",
                fashionStyle,
                clothes,
                clothesColor,
            });

            // Logic: prompts[0] is Face, prompts[1] is Scene.
            // We just generated the Scene prompt (out).
            // Usually 'out' is an array, take the first valid one or join them if multiple?
            // Existing logic expected 'out' to be array. We'll take the first one or join.
            // Requirement says "textbox below that will will show the combine prompt face analysis above and broll image analysis below"
            // So we assume index 1 is the B-roll/Scene prompt.

            const scenePrompt = out.join('\n'); // Join if multiple, usually just one

            setPrompts(prev => {
                const facePrompt = prev && prev[0] ? prev[0] : "";
                return [facePrompt, scenePrompt];
            });

            // Persist to history with the original file
            try {
                if (sourceToUse instanceof File) {
                    await addHistoryEntry({ file: sourceToUse, prompts: out });
                }
            } catch { }

            // Increment usage count if image was selected from search
            if (selectedImageUrl) {
                console.log('Incrementing usage count for:', selectedImageUrl);
                try {
                    const response = await fetch('/api/broll-scene/increment-usage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: selectedImageUrl })
                    });
                    const result = await response.json();
                    console.log('Usage increment response:', result);
                } catch (err) {
                    console.error('Failed to increment usage count:', err);
                }
            } else {
                console.log('No selectedImageUrl, skipping usage increment');
            }

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





    const handleClientChange = async (value: string) => {
        setSelectedClient(value);
        setIsFetchingFaceProfile(true);
        try {
            // Use the shared library function which handles the webhook directly
            const faceData = await fetchFaceProfile(value);

            // Always update prompts, even if faceData is null (to clear previous client's data)
            setPrompts(prev => {
                // Logic: prompts[0] is Face, prompts[1] is Scene.
                const scenePrompt = prev && prev[1] ? prev[1] : "";
                return [faceData || "", scenePrompt];
            });

            if (faceData) {
                toast.success("Face profile loaded successfully");
            } else {
                toast.error("No face profile found for this client, face prompt cleared.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load face profile");
        } finally {
            setIsFetchingFaceProfile(false);
        }
    };

    const handleSelectAndGenerate = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setGeneratingUrl(url);
        try {
            toast.info("Loading and generating...");
            const res = await fetch(url);
            const blob = await res.blob();
            const fileName = `search-result-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: blob.type });
            onFileSelected(file);
            // Pass the URL directly for generation
            await handleGenerate(url);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load and generate.");
        } finally {
            setGeneratingUrl(null);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <section className="mb-10">
                <div className="max-w-3xl space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                        B-Roll Scene Image to Prompt 2.0
                    </h1>
                    <p className="text-foreground/80 text-lg">
                        Transform your b-roll images into professional photography prompts
                    </p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Filter</Label>
                        <Select value={filterMode} onValueChange={(value: "all" | "most-used") => setFilterMode(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Images</SelectItem>
                                <SelectItem value="most-used">Most Used</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Search for an Image</Label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g. sunset beach..."
                                value={searchQuery}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setSearchQuery(newValue);
                                    console.log('Search query changed to:', newValue);
                                    console.log('originalResults length:', originalResults.length);
                                    console.log('allResults length:', allResults.length);
                                    console.log('searchResults length:', searchResults.length);
                                    // If search is cleared, restore all results
                                    if (newValue.trim() === '') {
                                        console.log('Search cleared, restoring images...');
                                        if (originalResults.length > 0) {
                                            setSearchResults(originalResults);
                                            setAllResults(originalResults);
                                            setSelectedImageUrl(null);
                                            setVisibleCount(8); // Reset pagination
                                            console.log('Restored', originalResults.length, 'images');
                                            toast.info("Showing all images");
                                        } else {
                                            console.log('No originalResults to restore!');
                                            // Fallback: try to re-fetch if originalResults is inexplicably empty
                                            // But standard flow makes originalResults populated on mount.
                                        }
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                                {isSearching ? <Loader2 className="animate-spin w-4 h-4" /> : "Search"}
                            </Button>
                        </div>
                        {searchResults.length > 0 && !selectedImageUrl && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {searchResults.slice(0, visibleCount).map((url, idx) => (
                                        <div
                                            key={idx}
                                            className="relative cursor-pointer hover:opacity-80 transition-opacity aspect-[3/4] rounded-md overflow-hidden border border-border group"
                                            onClick={() => handleSelectImage(url)}
                                        >
                                            <img
                                                src={url}
                                                alt={`Result ${idx}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="text-white text-sm font-medium">Click to Select</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {visibleCount < searchResults.length && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setVisibleCount((prev) => prev + 8)}
                                        className="w-full text-xs"
                                    >
                                        See More ({searchResults.length - visibleCount} remaining)
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {isUploadSectionOpen && (
                        <div className="space-y-4">
                            {!file ? (
                                <UploadZone onFileSelected={onFileSelected} />
                            ) : (
                                <ImagePreview src={previewUrl!} onChangeImage={resetAll} />
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="client">Client List</Label>
                        <Select value={selectedClient} onValueChange={handleClientChange}>
                            <SelectTrigger id="client" disabled={isLoadingClients}>
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

                    <AdvancedSettings
                        mode="model-angle"
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
                        fashionStyle={fashionStyle}
                        setFashionStyle={setFashionStyle}
                        clothes={clothes}
                        setClothes={setClothes}
                        clothesColor={clothesColor}
                        setClothesColor={setClothesColor}
                    />

                    {(prompts || isFetchingFaceProfile) && (
                        <ResultsSection
                            prompts={prompts}
                            labels={["Face Analysis Prompt", "Scene Description"]}
                            combinedPromptFooter="using the exact facial structure, eyes, eyebrows, nose, mouth, ears, hair, skin tone, and details of the person in the reference image, without alteration or beautification."
                            isFetchingFaceProfile={isFetchingFaceProfile}
                            startFrameImage={file}
                            onRegenerate={() => handleGenerate()}
                            isLoading={isLoading}
                        />
                    )}

                    {isUploadSectionOpen && (
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
                                    onClick={() => handleGenerate()}
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
                </div>
            </div>
        </div>
    );
}

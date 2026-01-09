import { useRef, useState, useEffect } from "react";
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
import { compressImage } from "@/lib/image";
import { handleFaceAnalyzerSubmission, MARKETING_CLIENTS_WEBHOOK_URL, updateSheet } from "@/lib/face-analyzer-webhook";
import { addHistoryEntry } from "@/lib/history";
import { toast } from "sonner";
import { Loader2, X, ScanFace } from "lucide-react";
import { FaceAnalyzerSidebar } from "@/components/FaceAnalyzerSidebar";

type MarketingClient = {
    client_name: string;
    clickup_id: string;
    clockify_id: string;
};

export default function FaceAnalyzer() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [prompts, setPrompts] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [selectedClient, setSelectedClient] = useState("");
    const [clientList, setClientList] = useState<MarketingClient[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoadingClients(true);
            try {
                const response = await fetch(MARKETING_CLIENTS_WEBHOOK_URL, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch clients');
                }
                const data = await response.json();
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

    const onFileSelected = (f: File) => {
        setFile(f);
        setPrompts(null);
        setError(null);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
    };

    const resetAll = () => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPrompts(null);
        setError(null);
        setStatus("Idle");
    };

    const startProgressMessages = () => {
        const messages = [
            "Analyzing face features...",
            "Generating detailed description...",
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
            const out = await handleFaceAnalyzerSubmission(compressed, {
                signal: controller.signal,
                client: selectedClient,
            });
            setPrompts(out);
            try {
                await addHistoryEntry({ file, prompts: out });
            } catch { }
            toast.success("Analysis complete");
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

    const handleUpdateSheet = async () => {
        if (!prompts || prompts.length === 0 || !selectedClient) {
            toast.error("Missing prompts or client selection");
            return;
        }

        setIsUpdatingSheet(true);
        try {
            const success = await updateSheet(selectedClient, prompts[0]);
            if (success) {
                toast.success("Sheet updated successfully");
            } else {
                toast.error("Failed to update sheet");
            }
        } catch (error) {
            toast.error("Error updating sheet");
            console.error(error);
        } finally {
            setIsUpdatingSheet(false);
        }
    };

    const handleCancel = () => {
        abortRef.current?.abort();
    };

    return (
        <div className="flex">
            <FaceAnalyzerSidebar />
            <div className="flex-1 container mx-auto py-10 px-6">
                <section className="mb-10">
                    <div className="max-w-3xl space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <ScanFace className="h-10 w-10 text-primary" />
                            Face Analyzer
                        </h1>
                        <p className="text-foreground/80 text-lg">
                            Analyze facial features and generate detailed descriptions.
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        {!file ? (
                            <UploadZone onFileSelected={onFileSelected} />
                        ) : (
                            <ImagePreview src={previewUrl!} onChangeImage={resetAll} />
                        )}
                    </div>

                    <div className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="client">Client List</Label>
                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                <SelectTrigger id="client" disabled={isLoadingClients}>
                                    <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a Client"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientList.map((client) => (
                                        <SelectItem key={client.clockify_id || client.clickup_id || client.client_name} value={client.client_name}>
                                            {client.client_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <ResultsSection prompts={prompts} />

                        {prompts && (
                            <Button
                                onClick={handleUpdateSheet}
                                disabled={isUpdatingSheet || !selectedClient}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isUpdatingSheet ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Sheet...
                                    </>
                                ) : (
                                    "Update Sheet"
                                )}
                            </Button>
                        )}

                        {!prompts && (
                            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-foreground mb-2">
                                    Start Analysis
                                </h2>
                                <p className="text-sm text-foreground/70 mb-4">
                                    Upload a clear face image. Click Analyze to get started.
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!file || isLoading}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 animate-spin" /> Analyzing...
                                            </>
                                        ) : (
                                            "Face Analyzer"
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
                                    <p>Estimated time: 30-60 seconds</p>
                                    {isLoading && <p className="mt-1 text-primary">{status}</p>}
                                    {error && <p className="mt-2 text-destructive">{error}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

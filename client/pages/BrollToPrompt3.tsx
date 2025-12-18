import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing-config";
import { sendToWebhook, normalizeWebhookResponse } from "@/lib/broll3-webhook";
import { toast } from "sonner";
import { Loader2, X, Upload as UploadIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressToSize } from "@/lib/image";
import { BrollDataResponse, fetchBrollData } from "@/lib/broll3-data-webhook";
import { BrollDataTable } from "@/components/BrollDataTable";

interface FileWithPreview {
    file: File;
    preview: string;
    id: string;
    status: "pending" | "uploading" | "processing" | "complete" | "error";
    uploadedUrl?: string;
    prompts?: string[];
    error?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function BrollToPrompt3() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [webhookData, setWebhookData] = useState<BrollDataResponse[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Track processed file IDs to prevent duplicate webhook calls
    const processedIds = useRef<Set<string>>(new Set());

    const { startUpload } = useUploadThing("imageUploader");

    const loadData = async () => {
        try {
            setIsLoadingData(true);
            const data = await fetchBrollData();
            if (Array.isArray(data)) {
                setWebhookData(data);
            } else if (data) {
                setWebhookData([data]);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("no data found to load analysis history");
        } finally {
            setIsLoadingData(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            files.forEach((f) => URL.revokeObjectURL(f.preview));
        };
    }, []);

    // Updated imports to include useRef


    const validateFile = (file: File): boolean => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error(`${file.name}: Invalid file type. Use JPG, PNG, or WEBP`);
            return false;
        }
        if (file.size > MAX_SIZE) {
            toast.error(`${file.name}: File too large. Max 10MB`);
            return false;
        }
        return true;
    };

    const handleFilesSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        const validFiles: FileWithPreview[] = [];

        Array.from(selectedFiles).forEach((file) => {
            if (validateFile(file)) {
                validFiles.push({
                    file,
                    preview: URL.createObjectURL(file),
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    status: "pending",
                });
            }
        });

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
            toast.success(`${validFiles.length} image(s) added`);
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file) URL.revokeObjectURL(file.preview);
            return prev.filter((f) => f.id !== id);
        });
        processedIds.current.delete(id);
    };

    const updateFileStatus = (
        id: string,
        updates: Partial<FileWithPreview>
    ) => {
        setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
    };

    const uploadFile = async (fileItem: FileWithPreview) => {
        // Guard against duplicate processing
        if (processedIds.current.has(fileItem.id)) {
            return;
        }
        processedIds.current.add(fileItem.id);

        try {
            updateFileStatus(fileItem.id, { status: "uploading" });

            // Compress image before uploading (target ~10KB, force WebP)
            const compressed = await compressToSize(fileItem.file, 10, 5, true);

            const result = await startUpload([compressed]);

            if (!result || !result[0]?.url) {
                throw new Error("Upload failed - no URL returned");
            }

            const uploadedUrl = result[0].url;
            updateFileStatus(fileItem.id, {
                uploadedUrl,
                status: "processing"
            });

            // Send to webhook
            const response = await sendToWebhook(uploadedUrl);
            const prompts = normalizeWebhookResponse(response);

            updateFileStatus(fileItem.id, {
                prompts: prompts.length > 0 ? prompts : ["No prompts generated"],
                status: "complete",
            });

            // Refresh data table
            await loadData();

            toast.success(`${fileItem.file.name} processed successfully!`);
        } catch (err: any) {
            console.error(`Error processing ${fileItem.file.name}:`, err);
            updateFileStatus(fileItem.id, {
                status: "error",
                error: err.message || "Upload failed",
            });
            toast.error(`${fileItem.file.name}: ${err.message || "Upload failed"}`);
        }
    };

    const handleUploadAll = async () => {
        const pendingFiles = files.filter((f) => f.status === "pending");

        if (pendingFiles.length === 0) {
            toast.error("No pending files to upload");
            return;
        }

        setIsProcessing(true);
        toast.info(`Uploading ${pendingFiles.length} image(s)...`);

        // Upload files sequentially to avoid overwhelming the server
        for (const fileItem of pendingFiles) {
            await uploadFile(fileItem);
        }

        setIsProcessing(false);
        toast.success("All uploads complete!");
    };

    const clearAll = () => {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setFiles([]);
        processedIds.current.clear();
    };

    const getStatusIcon = (status: FileWithPreview["status"]) => {
        switch (status) {
            case "uploading":
            case "processing":
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case "complete":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: FileWithPreview["status"]) => {
        switch (status) {
            case "uploading":
                return "Uploading...";
            case "processing":
                return "Processing...";
            case "complete":
                return "Complete";
            case "error":
                return "Failed";
            default:
                return "Pending";
        }
    };

    const pendingCount = files.filter((f) => f.status === "pending").length;
    const completeCount = files.filter((f) => f.status === "complete").length;
    const errorCount = files.filter((f) => f.status === "error").length;

    return (
        <div className="container mx-auto py-10">
            <section className="mb-10">
                <div className="max-w-3xl space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                        Broll Scene Image Uploader
                    </h1>
                    <p className="text-foreground/80 text-lg">
                        Upload single or multiple b-roll images to generate professional prompts
                    </p>
                </div>
            </section>

            <div className="space-y-6">
                {/* Upload Zone */}
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors cursor-pointer bg-white",
                        isDragging
                            ? "border-primary bg-accent/50"
                            : "border-border hover:border-primary/60"
                    )}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFilesSelect(e.dataTransfer.files);
                    }}
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <div className="flex items-center justify-center rounded-full bg-primary/10 text-primary size-16">
                        <UploadIcon className="size-7" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">
                            Drop your images here or click to browse
                        </p>
                        <p className="text-sm text-foreground/70">
                            Supports JPG, PNG, WEBP • Max 10MB per file • Multiple files allowed
                        </p>
                    </div>
                    <input
                        id="file-input"
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        multiple
                        className="sr-only"
                        onChange={(e) => handleFilesSelect(e.target.files)}
                    />
                </div>

                {/* Stats Bar */}
                {files.length > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex gap-4 text-sm">
                            <span className="font-medium">{files.length} total</span>
                            {pendingCount > 0 && (
                                <span className="text-muted-foreground">{pendingCount} pending</span>
                            )}
                            {completeCount > 0 && (
                                <span className="text-green-600">{completeCount} complete</span>
                            )}
                            {errorCount > 0 && (
                                <span className="text-red-600">{errorCount} failed</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUploadAll}
                                disabled={isProcessing || pendingCount === 0}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Upload ${pendingCount > 0 ? `${pendingCount} Image${pendingCount > 1 ? 's' : ''}` : 'All'}`
                                )}
                            </Button>
                            <Button variant="outline" onClick={clearAll} disabled={isProcessing}>
                                Clear All
                            </Button>
                        </div>
                    </div>
                )}

                {/* Files Grid */}
                {files.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((fileItem) => (
                            <div
                                key={fileItem.id}
                                className="rounded-xl border border-border bg-white overflow-hidden shadow-sm"
                            >
                                {/* Image Preview */}
                                <div className="relative aspect-video bg-muted">
                                    <img
                                        src={fileItem.preview}
                                        alt={fileItem.file.name}
                                        className="w-full h-full object-cover"
                                    />
                                    {fileItem.status === "pending" && (
                                        <button
                                            onClick={() => removeFile(fileItem.id)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(fileItem.status)}
                                        <span className="text-xs font-medium truncate flex-1">
                                            {fileItem.file.name}
                                        </span>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {getStatusText(fileItem.status)}
                                        {fileItem.status === "complete" && fileItem.uploadedUrl && (
                                            <span className="block truncate mt-1 text-green-600">
                                                URL: {fileItem.uploadedUrl}
                                            </span>
                                        )}
                                        {fileItem.status === "error" && fileItem.error && (
                                            <span className="block mt-1 text-red-600">
                                                Error: {fileItem.error}
                                            </span>
                                        )}
                                    </div>

                                    {/* Prompts */}
                                    {fileItem.prompts && fileItem.prompts.length > 0 && (
                                        <div className="pt-2 border-t border-border space-y-2">
                                            {fileItem.prompts.map((prompt, idx) => (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium">
                                                            {fileItem.prompts!.length > 1 ? `Prompt ${idx + 1}` : "Prompt"}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(prompt);
                                                                toast.success("Copied to clipboard!");
                                                            }}
                                                        >
                                                            Copy
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2 rounded">
                                                        {prompt}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {files.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No images selected. Drop files or click the upload zone above.</p>
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="mt-10 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadData}
                        disabled={isLoadingData}
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingData && "animate-spin")} />
                        Refresh Data
                    </Button>
                </div>
                <BrollDataTable data={webhookData} />
            </div>
        </div>
    );
}

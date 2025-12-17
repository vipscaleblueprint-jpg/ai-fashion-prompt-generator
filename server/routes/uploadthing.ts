import { createUploadthing, type FileRouter } from "uploadthing/server";
import type { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * UploadThing File Router
 * Define your upload endpoints here
 */
export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 2 } })
        .middleware(async ({ req }) => {
            // You can add authentication logic here if needed
            return { userId: "anonymous" };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for file:", (file as any).key);
            console.log("File metadata:", metadata);

            // Webhook notification removed to prevent double invocation (handled client-side)

            // Return data available to the client
            return { uploadedBy: metadata.userId, url: `https://utfs.io/f/${(file as any).key}` };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

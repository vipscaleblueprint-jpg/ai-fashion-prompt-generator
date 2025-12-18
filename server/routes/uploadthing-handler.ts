import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./uploadthing.js";

/**
 * Express route handler for UploadThing
 */
export const uploadthingRouteHandler = createRouteHandler({
    router: ourFileRouter,
    config: {
        token: process.env.UPLOADTHING_TOKEN,
    },
});

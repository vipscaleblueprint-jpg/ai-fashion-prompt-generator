const DEFAULT_BROLL_WEBHOOK_URL =
  "https://n8n.srv1151765.hstgr.cloud/webhook/brolltoprompts3";
export const BROLL_WEBHOOK_URL: string =
  ((import.meta as any)?.env?.VITE_BROLL_WEBHOOK_URL as string | undefined) ||
  DEFAULT_BROLL_WEBHOOK_URL;

const WEBHOOK_URL_2 = "https://n8n.srv1151765.hstgr.cloud/webhook/brolltoprompts";
export const BROLL_WEBHOOK_URL_2: string =
  ((import.meta as any)?.env?.VITE_BROLL_WEBHOOK_URL_2 as string | undefined) ||
  WEBHOOK_URL_2;

type LegacyWebhookPromptItem = { prompt: string };
type LegacyWebhookResponse = { input: LegacyWebhookPromptItem[] };

type VariationItem = {
  model?: string;
  task_type?: string;
  variation?: number;
  input?: { prompt?: string;[k: string]: unknown };
  [k: string]: unknown;
};

async function normalizeToPrompts(data: unknown): Promise<string[]> {
  if (!data) return [];
  if (Array.isArray(data)) {
    // Iterate over the array and extract prompt from each item based on its structure
    return (data as any[])
      .map((item) => {
        // Case 1: Simple string
        if (typeof item === 'string') return item;

        // Case 2: Object with input.prompt (Standard structure)
        if (item?.input?.prompt && typeof item.input.prompt === 'string') return item.input.prompt;

        // Case 3: Object with 'content.parts[0].text' (Gemini/Face Analysis structure)
        if (item?.content?.parts && Array.isArray(item.content.parts) && item.content.parts.length > 0) {
          if (item.content.parts[0]?.text && typeof item.content.parts[0].text === 'string') {
            return item.content.parts[0].text;
          }
        }

        // Case 4: Direct fields (prompt, text, output)
        if (item?.prompt && typeof item.prompt === 'string') return item.prompt;
        if (item?.text && typeof item.text === 'string') return item.text;
        if (item?.output && typeof item.output === 'string') return item.output;

        return null;
      })
      .filter((p): p is string => typeof p === "string");
  }
  if (typeof data === "object") {
    const obj = data as any;
    // Handle nested input array
    if (Array.isArray(obj.input)) {
      return obj.input
        .map((x: any) => x?.prompt)
        .filter((p: any): p is string => typeof p === "string");
    }
    // Handle specific nested content like Gemini if returned as single object
    if (obj.content?.parts && Array.isArray(obj.content.parts)) {
      if (obj.content.parts[0]?.text && typeof obj.content.parts[0].text === 'string') {
        return [obj.content.parts[0].text];
      }
    }

    // Handle direct fields
    const candidates = [obj.output, obj.text, obj.prompt, obj.result];
    const found = candidates.filter(c => typeof c === "string");
    if (found.length > 0) return found;
  }
  return [];
}

export async function handleBrollImageSubmission(
  imageFile: File,
  referenceImageFile: File | null,
  bodyAnalyzerImageFile: File | null,
  opts?: {
    signal?: AbortSignal;
    ethnicity?: string;
    gender?: string;
    skinColor?: string;
    hairColor?: string;
    facialExpression?: string;
    bodyComposition?: string;
    imperfection?: string;
    exactFacialStructure?: boolean;
    eyes?: string;
    eyebrows?: string;
    nose?: string;
    mouth?: string;
    ears?: string;
    transformHead?: boolean;
    angle?: string;
    pose?: string;
    fashionStyle?: string;
    clothes?: string;
    clothesColor?: string;
    client?: string;
    database_profile_enabled?: boolean;
  },
): Promise<string[]> {
  // BROLL_WEBHOOK_URL is always set via env or default

  const formData = new FormData();
  formData.append("data", imageFile); // Using same field name as webhook expects
  if (referenceImageFile) formData.append("Face_Analyzer", referenceImageFile);
  if (bodyAnalyzerImageFile) formData.append("Body_Analyzer", bodyAnalyzerImageFile);
  if (opts?.ethnicity) formData.append("ethnicity", opts.ethnicity);
  if (opts?.gender) formData.append("gender", opts.gender);
  if (opts?.skinColor) formData.append("skinColor", opts.skinColor);
  if (opts?.hairColor) formData.append("hairColor", opts.hairColor);
  if (opts?.facialExpression) formData.append("facialExpression", opts.facialExpression);
  if (opts?.bodyComposition) formData.append("bodyComposition", opts.bodyComposition);
  if (opts?.imperfection) formData.append("imperfection", opts.imperfection);
  if (opts?.exactFacialStructure) formData.append("exactFacialStructure", String(opts.exactFacialStructure));
  if (opts?.eyes) formData.append("eyes", opts.eyes);
  if (opts?.eyebrows) formData.append("eyebrows", opts.eyebrows);
  if (opts?.nose) formData.append("nose", opts.nose);
  if (opts?.mouth) formData.append("mouth", opts.mouth);
  if (opts?.ears) formData.append("ears", opts.ears);
  if (opts?.transformHead) formData.append("transformHead", String(opts.transformHead));
  if (opts?.angle) formData.append("angle", opts.angle);
  if (opts?.pose) formData.append("pose", opts.pose);
  if (opts?.fashionStyle) formData.append("fashionStyle", opts.fashionStyle);
  if (opts?.clothes) formData.append("clothes", opts.clothes);
  if (opts?.clothesColor) formData.append("clothesColor", opts.clothesColor);
  if (opts?.client) formData.append("client", opts.client);
  if (opts?.database_profile_enabled !== undefined) {
    formData.append("database_profile_enabled", String(opts.database_profile_enabled));
  }

  if (opts?.fashionStyle && (opts?.clothes || opts?.clothesColor)) {
    formData.append("fashion_randomizer", "true");
  } else {
    formData.append("fashion_randomizer", "false");
  }

  // Logic for "talking head enabled"
  // User allows "options under transform head" (e.g. angle) to be present,
  // but if any OTHER field is present, we do not send the signal.
  const hasTalkingHeadConflictingFields = [
    opts?.ethnicity,
    opts?.gender,
    opts?.skinColor,
    opts?.hairColor,
    opts?.facialExpression,
    opts?.bodyComposition,
    opts?.imperfection,
    opts?.exactFacialStructure ? "true" : "", // Boolean check
    opts?.eyes,
    opts?.eyebrows,
    opts?.nose,
    opts?.mouth,
    opts?.ears,
    opts?.pose,
    opts?.fashionStyle,
    opts?.clothes,
    opts?.clothesColor,
  ].some(val => val && val.trim() !== "");

  if (opts?.transformHead && !hasTalkingHeadConflictingFields) {
    formData.append("talking_head", "talking head enabled");
  }

  // Check if any advanced settings are populated
  const hasAdvancedSettings = [
    opts?.ethnicity,
    opts?.gender,
    opts?.skinColor,
    opts?.hairColor,
    opts?.facialExpression,
    opts?.bodyComposition,
    opts?.imperfection,
    opts?.exactFacialStructure ? "true" : "",
    opts?.eyes,
    opts?.eyebrows,
    opts?.nose,
    opts?.mouth,
    opts?.ears,
    opts?.transformHead ? "true" : "",
    opts?.angle,
    opts?.pose,
    opts?.fashionStyle,
    opts?.clothes,
    opts?.clothesColor,
  ].some(val => val && val.trim() !== "");

  if (hasAdvancedSettings) {
    formData.append("isnotempty", "true");
  }

  // Try direct POST first (may fail due to CORS)
  try {
    const res = await fetch(BROLL_WEBHOOK_URL, {
      method: "POST",
      body: formData,
      signal: opts?.signal,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    console.log("B-Roll Webhook Response:", data);

    const prompts = await normalizeToPrompts(data);
    if (prompts.length > 0) return prompts;
  } catch (err) {
    console.warn(
      "Direct b-roll webhook POST failed, falling back to server proxy:",
      err,
    );
  }

  // Fallback: proxy through our server to avoid CORS/network issues
  const proxyRes = await fetch("/api/proxy-broll-webhook", {
    method: "POST",
    body: formData,
    signal: opts?.signal,
  });

  if (!proxyRes.ok) {
    throw new Error(`Proxy upload failed with status ${proxyRes.status}`);
  }

  const proxyCt = proxyRes.headers.get("content-type") || "";
  let proxyData: unknown;
  if (proxyCt.includes("application/json")) {
    proxyData = await proxyRes.json();
  } else {
    const text = await proxyRes.text();
    try {
      proxyData = JSON.parse(text);
    } catch {
      proxyData = text;
    }
  }

  const prompts = await normalizeToPrompts(proxyData);
  if (prompts.length === 0)
    throw new Error("Unexpected response from webhook/proxy");
  return prompts;
}

export async function handleBrollImageSubmission2(
  imageSource: File | string,
  referenceImageFile: File | null,
  opts?: {
    signal?: AbortSignal;
    ethnicity?: string;
    gender?: string;
    skinColor?: string;
    hairColor?: string;
    facialExpression?: string;
    bodyComposition?: string;
    imperfection?: string;
    exactFacialStructure?: boolean;
    eyes?: string;
    eyebrows?: string;
    nose?: string;
    mouth?: string;
    ears?: string;
    transformHead?: boolean;
    angle?: string;
    pose?: string;
    clothesColor?: string;
    fashionStyle?: string;
    clothes?: string;
    client?: string;
    database_profile_enabled?: boolean;
  },
): Promise<string[]> {
  const formData = new FormData();
  if (typeof imageSource === 'string') {
    formData.append("image_url", imageSource);
  } else {
    formData.append("data", imageSource);
  }
  if (referenceImageFile) formData.append("Face_Analyzer", referenceImageFile);

  // Append all opts similarly to v1
  if (opts) {
    Object.entries(opts).forEach(([key, value]) => {
      if (key !== 'signal' && value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
  }

  if (opts?.fashionStyle && (opts?.clothes || opts?.clothesColor)) {
    formData.append("fashion_randomizer", "true");
  } else {
    formData.append("fashion_randomizer", "false");
  }

  // Talking Head Logic (copied from v1)
  const hasTalkingHeadConflictingFields = [
    opts?.ethnicity,
    opts?.gender,
    opts?.skinColor,
    opts?.hairColor,
    opts?.facialExpression,
    opts?.bodyComposition,
    opts?.imperfection,
    opts?.exactFacialStructure ? "true" : "",
    opts?.eyes,
    opts?.eyebrows,
    opts?.nose,
    opts?.mouth,
    opts?.ears,
    opts?.pose,
    opts?.fashionStyle,
    opts?.clothes,
    opts?.clothesColor,
  ].some(val => val && val.trim() !== "");

  if (opts?.transformHead && !hasTalkingHeadConflictingFields) {
    formData.append("talking_head", "talking head enabled");
  }

  // Advanced Settings logic (copied from v1)
  const hasAdvancedSettings = [
    opts?.ethnicity,
    opts?.gender,
    opts?.skinColor,
    opts?.hairColor,
    opts?.facialExpression,
    opts?.bodyComposition,
    opts?.imperfection,
    opts?.exactFacialStructure ? "true" : "",
    opts?.eyes,
    opts?.eyebrows,
    opts?.nose,
    opts?.mouth,
    opts?.ears,
    opts?.transformHead ? "true" : "",
    opts?.angle,
    opts?.pose,
    opts?.fashionStyle,
    opts?.clothes,
    opts?.clothesColor,
  ].some(val => val && val.trim() !== "");

  if (hasAdvancedSettings) {
    formData.append("isnotempty", "true");
  }

  try {
    const res = await fetch(BROLL_WEBHOOK_URL_2, {
      method: "POST",
      body: formData,
      signal: opts?.signal,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    let data: unknown;
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    console.log("B-Roll 2.0 Webhook Response:", data);

    const prompts = await normalizeToPrompts(data);
    if (prompts.length > 0) return prompts;
  } catch (err) {
    console.warn(
      "Direct b-roll 2.0 webhook POST failed, falling back to server proxy:",
      err,
    );
  }

  // Fallback: proxy with target=test
  const proxyRes = await fetch("/api/proxy-broll-webhook?target=test", {
    method: "POST",
    body: formData,
    signal: opts?.signal,
  });

  if (!proxyRes.ok) {
    throw new Error(`Proxy upload failed with status ${proxyRes.status}`);
  }

  const proxyCt = proxyRes.headers.get("content-type") || "";
  let proxyData: unknown;
  if (proxyCt.includes("application/json")) {
    proxyData = await proxyRes.json();
  } else {
    const text = await proxyRes.text();
    try {
      proxyData = JSON.parse(text);
    } catch {
      proxyData = text;
    }
  }

  const prompts = await normalizeToPrompts(proxyData);
  if (prompts.length === 0)
    throw new Error("Unexpected response from webhook/proxy");
  return prompts;
}

export const FETCH_FACE_PROFILE_WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/fetch-faceprofile";

export async function fetchFaceProfile(clientName: string): Promise<string | null> {
  try {
    const response = await fetch(FETCH_FACE_PROFILE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ client_name: clientName }),
    });

    if (!response.ok) {
      console.error(`Failed to fetch face profile: ${response.status} ${response.statusText}`);
      return null;
    } else {
      console.log("Face profile fetch triggered successfully for:", clientName);
      const data = await response.json();
      console.log("Face profile data received:", data);

      if (Array.isArray(data) && data.length > 0) {
        return data[0].face || null;
      }
      return data.face || null;
    }
  } catch (error) {
    console.error("Error fetching face profile:", error);
    return null;
  }
}

export const SEARCH_IMAGE_WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/fetch-data";

export async function searchImage(query: string): Promise<string[]> {
  try {
    const response = await fetch(SEARCH_IMAGE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Sending query as part of the body, assuming the webhook can filter by it
      // or we just fetch data and might filter client side if the webhook returns everything.
      // Based on typical search patterns and the user request "apply it to broll image to prompt 2.0 search",
      // we will send the query.
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error(`Failed to search image: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log("Search Image Response:", data);

    const urls: string[] = [];

    const extractUrl = (item: any): string | null => {
      if (!item) return null;
      if (typeof item === 'string') return item.trim();
      // Prioritize image_url as per Broll 3.0
      if (item.image_url && typeof item.image_url === 'string') return item.image_url.trim();
      if (item["preview image"] && typeof item["preview image"] === 'string') return item["preview image"].trim();
      if (item.url && typeof item.url === 'string') return item.url.trim();
      if (item.output && typeof item.output === 'string') return item.output.trim();
      return null;
    };

    if (Array.isArray(data)) {
      const lowerQuery = query.toLowerCase().trim();
      data.forEach(item => {
        // Client-side filtering if query is provided and the item has searchable fields
        let match = true;

        // If query is non-empty, check for matches
        if (lowerQuery) {
          match = false; // Default to no match if query exists

          // Check Description
          if (item.Description && typeof item.Description === 'string' && item.Description.toLowerCase().includes(lowerQuery)) match = true;
          // Check Category
          else if (item.Category && typeof item.Category === 'string' && item.Category.toLowerCase().includes(lowerQuery)) match = true;
          // Check Camera Angle
          else if (item["Camera Angle"] && typeof item["Camera Angle"] === 'string' && item["Camera Angle"].toLowerCase().includes(lowerQuery)) match = true;
          // Check Setting_Location
          else if (item.Setting_Location && typeof item.Setting_Location === 'string' && item.Setting_Location.toLowerCase().includes(lowerQuery)) match = true;
          // Check Tags (array)
          else if (Array.isArray(item.Tags)) {
            if (item.Tags.some((tag: any) => typeof tag === 'string' && tag.toLowerCase().includes(lowerQuery))) match = true;
          }
          // Check output field just in case
          else if (item.output && typeof item.output === 'string' && item.output.toLowerCase().includes(lowerQuery)) match = true;
        }

        if (match) {
          const url = extractUrl(item);
          if (url) urls.push(url);
        }
      });
    } else {
      const url = extractUrl(data);
      if (url) urls.push(url);
    }

    return urls;
  } catch (error) {
    console.error("Error searching image:", error);
    return [];
  }
}

export const FETCH_BODY_PROFILE_WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/fetch-bodyprofile";

export async function fetchBodyProfile(clientName: string): Promise<string | null> {
  try {
    const response = await fetch(FETCH_BODY_PROFILE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ client_name: clientName }),
    });

    if (!response.ok) {
      console.error(`Failed to fetch body profile: ${response.status} ${response.statusText}`);
      return null;
    } else {
      console.log("Body profile fetch triggered successfully for:", clientName);
      const data = await response.json();
      console.log("Body profile data received:", data);

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return item.body || item.body_analysis || item.face || item.output || item.prompt || null;
      }
      const obj = data as any;
      return obj.body || obj.body_analysis || obj.face || obj.output || obj.prompt || null;
    }
  } catch (error) {
    console.error("Error fetching body profile:", error);
    return null;
  }
}

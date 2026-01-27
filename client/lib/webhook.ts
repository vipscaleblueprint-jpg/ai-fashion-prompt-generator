const DEFAULT_WEBHOOK_URL =
  "https://n8n.srv1151765.hstgr.cloud/webhook/baseimagetoprompt";
export const WEBHOOK_URL: string =
  ((import.meta as any)?.env?.VITE_WEBHOOK_URL as string | undefined) ||
  DEFAULT_WEBHOOK_URL;

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
    // Separate face analysis from fashion prompts
    let faceAnalysis: string | null = null;
    const fashionPrompts: string[] = [];

    // Iterate over the array and extract prompts
    (data as any[]).forEach((item) => {
      // Case 1: analysis_text field (Face Analysis)
      if (item?.analysis_text && typeof item.analysis_text === 'string') {
        faceAnalysis = item.analysis_text;
        return;
      }

      // Case 2: Simple string
      if (typeof item === 'string') {
        fashionPrompts.push(item);
        return;
      }

      // Case 3: Object with input.prompt (Standard structure - Fashion prompts)
      if (item?.input?.prompt && typeof item.input.prompt === 'string') {
        fashionPrompts.push(item.input.prompt);
        return;
      }

      // Case 4: Object with 'content.parts[0].text' (Gemini structure)
      if (item?.content?.parts && Array.isArray(item.content.parts) && item.content.parts.length > 0) {
        if (item.content.parts[0]?.text && typeof item.content.parts[0].text === 'string') {
          fashionPrompts.push(item.content.parts[0].text);
          return;
        }
      }

      // Case 5: Direct fields (prompt, text, output)
      if (item?.prompt && typeof item.prompt === 'string') {
        fashionPrompts.push(item.prompt);
        return;
      }
      if (item?.text && typeof item.text === 'string') {
        fashionPrompts.push(item.text);
        return;
      }
      if (item?.output && typeof item.output === 'string') {
        fashionPrompts.push(item.output);
        return;
      }
    });

    // Return face analysis first, then fashion prompts
    const result: string[] = [];
    if (faceAnalysis) result.push(faceAnalysis);
    result.push(...fashionPrompts);
    return result;
  }
  if (typeof data === "object") {
    const obj = data as any;
    // Handle nested input array or variants array
    if (Array.isArray(obj.input)) {
      return obj.input
        .map((x: any) => x?.prompt || x)
        .filter((p: any): p is string => typeof p === "string");
    }
    if (Array.isArray(obj.variants)) {
      return obj.variants
        .map((x: any) => x?.prompt || x?.text || x)
        .filter((p: any): p is string => typeof p === "string");
    }
    // Handle specific nested content like Gemini if returned as single object
    if (obj.content?.parts && Array.isArray(obj.content.parts)) {
      if (obj.content.parts[0]?.text && typeof obj.content.parts[0].text === 'string') {
        return [obj.content.parts[0].text];
      }
    }

    // Handle direct fields
    const candidates = [obj.output, obj.text, obj.prompt, obj.result, obj.analysis_text];
    const found = candidates.filter(c => typeof c === "string");
    if (found.length > 0) return found;
  }
  return [];
}

export async function handleImageSubmission(
  imageFile: File,
  referenceImageFile: File | null,
  bodyAnalyzerImageFile: File | null,
  opts?: {
    signal?: AbortSignal;
    mode?: string;
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
  // WEBHOOK_URL is always set via env or default

  const formData = new FormData();
  formData.append("Base_Image", imageFile);
  if (referenceImageFile) formData.append("Face_Analyzer", referenceImageFile);
  if (bodyAnalyzerImageFile) formData.append("Body_Analyzer", bodyAnalyzerImageFile);

  // Handle mode specific payload
  if (opts?.mode === 'editorial-portrait') {
    formData.append("editorial", "enabled");
  } else if (opts?.mode) {
    formData.append("mode", opts.mode);
  }

  // Explicitly send editorial_mode flag as requested
  formData.append("editorial_mode", String(opts?.mode === 'editorial-portrait'));

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

  // Check if any advanced settings are populated
  const hasAdvancedSettings = [
    opts?.mode,
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
    const res = await fetch(WEBHOOK_URL, {
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

    const prompts = await normalizeToPrompts(data);
    if (prompts.length > 0) return prompts;
  } catch (err) {
    console.warn(
      "Direct webhook POST failed, falling back to server proxy:",
      err,
    );
  }

  // Fallback: proxy through our server to avoid CORS/network issues
  const proxyRes = await fetch("/api/proxy-webhook", {
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

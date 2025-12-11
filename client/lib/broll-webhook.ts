const DEFAULT_BROLL_WEBHOOK_URL =
  "https://n8n.srv1151765.hstgr.cloud/webhook/broll-scene-image";
export const BROLL_WEBHOOK_URL: string =
  ((import.meta as any)?.env?.VITE_BROLL_WEBHOOK_URL as string | undefined) ||
  DEFAULT_BROLL_WEBHOOK_URL;

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
  },
): Promise<string[]> {
  // BROLL_WEBHOOK_URL is always set via env or default

  const formData = new FormData();
  formData.append("data", imageFile); // Using same field name as webhook expects
  if (referenceImageFile) formData.append("Face_Analyzer", referenceImageFile);
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


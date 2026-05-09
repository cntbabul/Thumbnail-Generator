/**
 * pollinations_service.ts
 *
 * Standalone service for generating thumbnail images via the Pollinations
 * Flux API. Completely independent of Gemini — no LLM hop, no external SDK.
 */

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const TIMEOUT_MS = 90_000; // cold-starts can exceed 60 s

/**
 * Builds a structured, thumbnail-optimised Flux prompt from the style
 * descriptor and raw user prompt.
 */
const buildPrompt = (prompt: string, stylePrompt: string): string =>
    [
        stylePrompt,
        prompt,
        'professional YouTube thumbnail',
        'cinematic 16:9 composition',
        'high resolution',
        'dramatic lighting',
        'ultra-detailed',
    ]
        .filter(Boolean)
        .join(', ');

/**
 * Generates a 1280×720 thumbnail image via Pollinations (Flux model).
 *
 * @param prompt      - Raw user idea / topic
 * @param stylePrompt - Style descriptor from the STYLES map
 * @returns             PNG/JPEG image as a Node.js Buffer
 */
export const generateWithPollinations = async (
    prompt: string,
    stylePrompt: string
): Promise<Buffer> => {
    const enhancedPrompt = buildPrompt(prompt, stylePrompt);
    const seed = Math.floor(Math.random() * 1_000_000);

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&model=flux&seed=${seed}&nologo=true`;

    console.log(`[Pollinations] seed=${seed}`);
    console.log(`[Pollinations] prompt: ${enhancedPrompt}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const headers: Record<string, string> = {};
    if (process.env.POLLINATIONS_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
    }

    let response: Response;
    const fetchWithRetry = async (isRetry = false): Promise<Response> => {
        const res = await fetch(url, { 
            signal: controller.signal,
            headers 
        });

        if (res.status === 429 && !isRetry) {
            console.warn(`[Pollinations] Rate limited (429). Retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchWithRetry(true);
        }
        return res;
    };

    try {
        response = await fetchWithRetry();
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error(`[Pollinations] HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
        const body = await response.text();
        throw new Error(
            `[Pollinations] Non-image response (${contentType}): ${body.slice(0, 200)}`
        );
    }

    const buffer = await response.arrayBuffer();
    console.log(`[Pollinations] Received ${buffer.byteLength} bytes`);
    return Buffer.from(buffer);
};

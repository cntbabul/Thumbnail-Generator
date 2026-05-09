import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
});

export const generateWithGemini = async (prompt: string, stylePrompt: string, headshotUrl: string): Promise<Buffer> => {
    try {
        // Step 1: Use Gemini 1.5 Flash to craft a detailed, professional image prompt
        const enhancementPrompt = `Act as a YouTube thumbnail expert. 
        Create a detailed, vivid image generation prompt for a high-end YouTube thumbnail based on:
        Style: ${stylePrompt}
        User Idea: ${prompt}
        Rules: Be specific about lighting, composition, colors, mood. No meta-commentary. Return ONLY the prompt text.`;

        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: enhancementPrompt }] }]
        });

        const enhancedPrompt = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
            || `${stylePrompt}, ${prompt}, high-end YouTube thumbnail, cinematic 16:9`;

        console.log(`Gemini enhanced prompt: ${enhancedPrompt}`);

        // Step 2: Use Pollinations (Flux model) for free, high-quality image generation
        const seed = Math.floor(Math.random() * 1_000_000);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&model=flux&seed=${seed}&nologo=true`;

        // Add a 60s timeout — Pollinations can be slow on first request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);

        let imageResp: Response;
        try {
            imageResp = await fetch(pollinationsUrl, { signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }

        if (!imageResp.ok) {
            throw new Error(`Pollinations returned HTTP ${imageResp.status}`);
        }

        const contentType = imageResp.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            const body = await imageResp.text();
            throw new Error(`Pollinations returned non-image response (${contentType}): ${body.slice(0, 200)}`);
        }

        const buffer = await imageResp.arrayBuffer();
        return Buffer.from(buffer);



    } catch (error) {
        console.error('Gemini generation failed:', error);
        throw error;
    }
};




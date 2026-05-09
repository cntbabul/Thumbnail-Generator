import { generateWithPollinations } from './pollinations_service.js';

export type ImageProvider = 'pollinations';

/**
 * Unified entry-point for all image generation.
 * Add new providers here — generator_service.ts never needs to change.
 */
export const generateThumbnail = async (
    provider: ImageProvider,
    prompt: string,
    stylePrompt: string,
    headshotUrl: string
): Promise<Buffer> => {
    // Only Pollinations is active — extend ImageProvider type to add more
    return generateWithPollinations(prompt, stylePrompt);
};

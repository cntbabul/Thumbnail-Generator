import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});
export const generateThumbnailImage = async (prompt, stylePrompt, headshotUrl) => {
    const fullPrompt = `${stylePrompt}\n\nUser request: ${prompt}\n\nIMPORTANT: The generated thumbnail MUST prominently feature the person from the headshot shown in the provided reference headshot photo. Keep their likeness accurate.`;
    // Using the experimental /responses API via raw request as mirrored from Python code
    const responseRaw = await openai.request({
        method: 'post',
        path: '/responses',
        body: {
            model: 'gpt-4o',
            input: [
                {
                    role: 'user',
                    content: [
                        { type: 'input_image', url: headshotUrl },
                        { type: 'text', text: fullPrompt }
                    ]
                }
            ],
            tools: [
                {
                    type: 'image_generation',
                    model: 'gpt-image-2',
                    size: '1536x1024',
                    quality: 'high',
                    output_format: 'png'
                }
            ]
        }
    });
    if (responseRaw && responseRaw.output) {
        for (const item of responseRaw.output) {
            if (item.type === 'image_generation_call' && item.result) {
                return Buffer.from(item.result, 'base64');
            }
        }
    }
    throw new Error('No image generated');
};

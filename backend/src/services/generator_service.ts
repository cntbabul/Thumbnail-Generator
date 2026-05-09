import { Job, Thumbnail } from '../models/index.js';
import { generateThumbnail, ImageProvider } from './image_generation_service.js';
import { uploadFile } from './imagekit_service.js';

export const STYLES: Record<string, string> = {
  bold_dramatic:
    "Create a bold, dramatic youtube thumnail with high contrast, cinematic lighting, dark moody background, and a powerful composition. The person's face should be prominent with a dramatic expression.",
  clean_minimal:
    "Create a clean, minimal youtube thumnail with bright studio lighting, white/light background, modern professional aesthetic, plenty of whitespace, and sharp clean composition. The person should look approachable and professional.",
  vibrant_energetic:
    "Create a vibrant, energetic Youtube thumbnail with colourful gradients, dynamic angles, eye-catching pop-art style colors, and energetic composition. The person should look excited and engaging expression.",
};

export const STYLE_ORDER = ['bold_dramatic', 'clean_minimal', 'vibrant_energetic'];

export const generateSingleThumbnail = async (thumbnailId: string, prompt: string, headshotUrl: string, provider: ImageProvider = 'pollinations'): Promise<void> => {
  try {
    const thumb = await Thumbnail.findById(thumbnailId);
    if (!thumb) return;

    thumb.status = 'processing';
    await thumb.save();

    const stylePrompt = STYLES[thumb.style_name] || '';

    // Use the unified generation service with the chosen provider
    const imageBuffer = await generateThumbnail(provider, prompt, stylePrompt, headshotUrl);

    const fileName = `${thumbnailId}.png`;
    const folderPath = `thumbnails/${thumb.job_id}/`;

    const url = await uploadFile(imageBuffer, fileName, folderPath);

    thumb.imagekit_url = url;
    thumb.status = 'completed';
    await thumb.save();

    console.log(`Thumbnail ${thumbnailId} generated via ${provider} and uploaded successfully. ${url}`);
  } catch (error: any) {
    console.error(`Error generating thumbnail ${thumbnailId} with ${provider}:`, error);
    const thumb = await Thumbnail.findById(thumbnailId);
    if (thumb) {
      thumb.status = 'failed';
      // SDK errors may not have a .message — serialize the full error object as a fallback
      const errMsg = error?.message || error?.toString?.() || JSON.stringify(error);
      thumb.error_message = (errMsg || 'Unknown error').slice(0, 500);
      await thumb.save();

    }
  }
};

export const processJob = async (jobId: string, provider: ImageProvider = 'pollinations'): Promise<void> => {
  try {
    const job = await Job.findById(jobId);
    if (!job) return;

    job.status = 'processing';
    await job.save();

    const thumbnails = await Thumbnail.find({ job_id: jobId });
    
    // Sequential processing to avoid rate limits (429)
    for (const t of thumbnails) {
      await generateSingleThumbnail(t.id, job.prompt, job.headshot_url, provider);
    }

    const updatedThumbnails = await Thumbnail.find({ job_id: jobId });
    const allFailed = updatedThumbnails.every((t) => t.status === 'failed');

    job.status = allFailed ? 'failed' : 'completed';
    await job.save();
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    const job = await Job.findById(jobId);
    if (job) {
      job.status = 'failed';
      await job.save();
    }
  }
};

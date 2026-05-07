import { Job, Thumbnail } from '../models/index.js';
import { generateThumbnailImage } from './openai_service.js';
import { uploadFile } from './imagekit_service.js';
export const STYLES = {
    bold_dramatic: "Create a bold, dramatic youtube thumnail with high contrast, cinematic lighting, dark moody background, and a powerful composition. The person's face should be prominent with a dramatic expression.",
    clean_minimal: "Create a clean, minimal youtube thumnail with bright studio lighting, white/light background, modern professional aesthetic, plenty of whitespace, and sharp clean composition. The person should look approachable and professional.",
    vibrant_energetic: "Create a vibrant, energetic Youtube thumbnail with colourful gradients, dynamic angles, eye-catching pop-art style colors, and energetic composition. The person should look excited and engaging expression.",
};
export const STYLE_ORDER = ['bold_dramatic', 'clean_minimal', 'vibrant_energetic'];
export const generateSingleThumbnail = async (thumbnailId, prompt, headshotUrl) => {
    try {
        const thumb = await Thumbnail.findByPk(thumbnailId);
        if (!thumb)
            return;
        thumb.status = 'generating';
        await thumb.save();
        const stylePrompt = STYLES[thumb.style_name] || '';
        const imageBuffer = await generateThumbnailImage(prompt, stylePrompt, headshotUrl);
        const fileName = `${thumbnailId}.png`;
        const folderPath = `thumbnails/${thumb.job_id}/`;
        const url = await uploadFile(imageBuffer, fileName, folderPath);
        thumb.imagekit_url = url;
        thumb.status = 'uploaded';
        await thumb.save();
        console.log(`Thumbnail ${thumbnailId} generated and uploaded successfully. ${url}`);
    }
    catch (error) {
        console.error(`Error generating thumbnail ${thumbnailId}:`, error);
        const thumb = await Thumbnail.findByPk(thumbnailId);
        if (thumb) {
            thumb.status = 'failed';
            thumb.error_message = error.message?.slice(0, 500) || 'Unknown error';
            await thumb.save();
        }
    }
};
export const processJob = async (jobId) => {
    try {
        const job = await Job.findByPk(jobId);
        if (!job)
            return;
        job.status = 'processing';
        await job.save();
        const thumbnails = await Thumbnail.findAll({ where: { job_id: jobId } });
        const tasks = thumbnails.map((t) => generateSingleThumbnail(t.id, job.prompt, job.headshot_url));
        await Promise.all(tasks);
        const updatedThumbnails = await Thumbnail.findAll({ where: { job_id: jobId } });
        const allFailed = updatedThumbnails.every((t) => t.status === 'failed');
        job.status = allFailed ? 'failed' : 'completed';
        await job.save();
    }
    catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        const job = await Job.findByPk(jobId);
        if (job) {
            job.status = 'failed';
            await job.save();
        }
    }
};

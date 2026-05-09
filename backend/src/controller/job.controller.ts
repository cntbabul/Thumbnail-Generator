import { Request, Response } from 'express';
import { Job, Thumbnail } from '../models/index.js';
import { IThumbnail } from '../models/Thumbnail.js';
import { uploadFile, getVariants } from '../services/imagekit_service.js';
import { processJob, STYLE_ORDER } from '../services/generator_service.js';
import { ImageProvider } from '../services/image_generation_service.js';

export class JobController {
  async uploadHeadshot(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const url = await uploadFile(
        req.file.buffer,
        req.file.originalname || 'headshot.jpg',
        'headshots'
      );

      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload headshot' });
    }
  }

  async createJob(req: Request, res: Response) {
    try {
      const { prompt, num_thumbnails, headshot_url, provider = 'pollinations' } = req.body;

      if (num_thumbnails < 1 || num_thumbnails > 10) {
        return res.status(400).json({ error: 'num_thumbnails must be between 1 and 10' });
      }

      const job = await Job.create({
        prompt,
        num_thumbnails,
        headshot_url,
        provider: provider as ImageProvider,
        status: 'pending'
      });

      const styles = Array.from({ length: num_thumbnails }).map((_, i) => STYLE_ORDER[i % STYLE_ORDER.length]);

      for (const style of styles) {
        await Thumbnail.create({
          job_id: job._id,
          style_name: style,
          status: 'pending'
        });
      }

      // Background processing - do not await
      processJob(job.id, provider as ImageProvider).catch(err => {
        console.error(`[Background] Job ${job.id} failed:`, err);
      });

      res.json({ job_id: job.id });
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  }

  async getJob(req: Request, res: Response) {
    try {
      const job = await Job.findById(req.params.job_id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // MongoDB doesn't use "include". We find thumbnails by job_id.
      const thumbnails = await Thumbnail.find({ job_id: job._id }) as IThumbnail[];

      const thumbnailResponses = thumbnails.map((t) => ({
        id: t.id,
        style_name: t.style_name,
        status: t.status,
        imagekit_url: t.imagekit_url,
        error_message: t.error_message,
        variants: t.imagekit_url ? getVariants(t.imagekit_url) : null,
      }));

      res.json({
        id: job.id,
        prompt: job.prompt,
        num_thumbnails: job.num_thumbnails,
        headshot_url: job.headshot_url,
        provider: job.provider,
        status: job.status,
        thumbnails: thumbnailResponses,
      });
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ error: 'Failed to get job' });
    }
  }

  async streamJob(req: Request, res: Response) {
    const { job_id } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sentThumbnails = new Set<string>();
    console.log(`[Stream] Starting stream for job: ${job_id}`);

    // Send immediate keep-alive and connection event to flush headers
    res.write(': connected\n\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ job_id })}\n\n`);

    const intervalId = setInterval(async () => {
      try {
        // Keep-alive heartbeat
        res.write(': heartbeat\n\n');

        const job = await Job.findById(job_id);
        if (!job) {
          console.error(`[Stream] Job not found: ${job_id}`);
          res.write(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
          clearInterval(intervalId);
          res.end();
          return;
        }

        const thumbnails = await Thumbnail.find({ job_id: job._id }) as IThumbnail[];

        for (const t of thumbnails) {
          if (sentThumbnails.has(t.id)) continue;

          if (t.status === 'completed') {
            console.log(`[Stream] Sending thumbnail_ready: ${t.id}`);
            const data = JSON.stringify({
              thumbnail_id: t.id,
              style_name: t.style_name,
              imagekit_url: t.imagekit_url,
              variants: getVariants(t.imagekit_url),
            });
            res.write(`event: thumbnail_ready\ndata: ${data}\n\n`);
            sentThumbnails.add(t.id);
          } else if (t.status === 'failed') {
            console.log(`[Stream] Sending thumbnail_failed: ${t.id}`);
            const data = JSON.stringify({
              thumbnail_id: t.id,
              style_name: t.style_name,
              error_message: t.error_message,
            });
            res.write(`event: thumbnail_failed\ndata: ${data}\n\n`);
            sentThumbnails.add(t.id);
          }
        }

        const allDone = thumbnails.every((t) => ['completed', 'failed'].includes(t.status));

        if (allDone && sentThumbnails.size === thumbnails.length) {
          console.log(`[Stream] Job complete, closing stream: ${job_id}`);
          const data = JSON.stringify({ job_id, status: job.status });
          res.write(`event: job_completed\ndata: ${data}\n\n`);
          clearInterval(intervalId);
          res.end();
        }
      } catch (error: any) {
        console.error(`[Stream] Error for job ${job_id}:`, error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(intervalId);
    });
  }
  async listAllThumbnails(req: Request, res: Response) {
    try {
      const thumbnails = await Thumbnail.find({ status: 'completed' }).sort({ created_at: -1 }) as IThumbnail[];
      
      const response = thumbnails.map(t => ({
        id: t.id,
        style_name: t.style_name,
        imagekit_url: t.imagekit_url,
        variants: t.imagekit_url ? getVariants(t.imagekit_url) : null,
        created_at: t.created_at
      }));

      res.json(response);
    } catch (error) {
      console.error('List thumbnails error:', error);
      res.status(500).json({ error: 'Failed to fetch thumbnails' });
    }
  }

}

export const jobController = new JobController();

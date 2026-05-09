import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import dotenv from 'dotenv';
import sequelize from './db/index.js';
import { Job, Thumbnail } from './models/index.js';
import { uploadFile, getVariants } from './services/imagekit_service.js';
import { processJob, STYLE_ORDER } from './services/generator_service.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const upload = multer({ storage: multer.memoryStorage() });
// Routes
app.post('/upload-headshot', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const url = await uploadFile(req.file.buffer, req.file.originalname || 'headshot.jpg', 'headshots');
        res.json({ url });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload headshot' });
    }
});
app.post('/jobs', async (req, res) => {
    try {
        const { prompt, num_thumbnails, headshot_url } = req.body;
        if (num_thumbnails < 1 || num_thumbnails > 3) {
            return res.status(400).json({ error: 'num_thumbnails must be between 1 and 3' });
        }
        const job = await Job.create({
            prompt,
            num_thumbnails,
            headshot_url,
            status: 'pending'
        });
        const styles = STYLE_ORDER.slice(0, num_thumbnails);
        for (const style of styles) {
            await Thumbnail.create({
                job_id: job.id,
                style_name: style,
                status: 'pending'
            });
        }
        // Fire and forget background task
        processJob(job.id);
        res.json({ job_id: job.id });
    }
    catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Failed to create job' });
    }
});
app.get('/jobs/:job_id', async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.job_id, {
            include: [{ model: Thumbnail, as: 'thumbnails' }],
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const thumbnails = job.thumbnails || [];
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
            status: job.status,
            thumbnails: thumbnailResponses,
        });
    }
    catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Failed to get job' });
    }
});
app.get('/jobs/:job_id/stream', async (req, res) => {
    const { job_id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const sentThumbnails = new Set();
    const intervalId = setInterval(async () => {
        try {
            const job = await Job.findByPk(job_id);
            if (!job) {
                res.write(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
                clearInterval(intervalId);
                res.end();
                return;
            }
            const thumbnails = await Thumbnail.findAll({ where: { job_id } });
            for (const t of thumbnails) {
                if (sentThumbnails.has(t.id))
                    continue;
                if (t.status === 'uploaded') {
                    const data = JSON.stringify({
                        thumbnail_id: t.id,
                        style_name: t.style_name,
                        imagekit_url: t.imagekit_url,
                        variants: getVariants(t.imagekit_url),
                    });
                    res.write(`event: thumbnail ready\ndata: ${data}\n\n`);
                    sentThumbnails.add(t.id);
                }
                else if (t.status === 'failed') {
                    const data = JSON.stringify({
                        thumbnail_id: t.id,
                        style_name: t.style_name,
                        error_message: t.error_message,
                    });
                    res.write(`event: thumbnail failed\ndata: ${data}\n\n`);
                    sentThumbnails.add(t.id);
                }
            }
            const allDone = thumbnails.every((t) => ['uploaded', 'failed'].includes(t.status));
            if (allDone && sentThumbnails.size === thumbnails.length) {
                const data = JSON.stringify({ job_id, status: job.status });
                res.write(`event: job done\ndata: ${data}\n\n`);
                clearInterval(intervalId);
                res.end();
            }
        }
        catch (error) {
            console.error('Streaming error:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            clearInterval(intervalId);
            res.end();
        }
    }, 1500);
    req.on('close', () => {
        clearInterval(intervalId);
    });
});
// Sync database and start server
sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Express server running on http://localhost:${port}`);
    });
});

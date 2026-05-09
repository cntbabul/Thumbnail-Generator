import { Router } from 'express';
import multer from 'multer';
import { jobController } from '../controller/job.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-headshot', upload.single('file'), jobController.uploadHeadshot);
router.post('/jobs', jobController.createJob);
router.get('/jobs/:job_id', jobController.getJob);
router.get('/jobs/:job_id/stream', jobController.streamJob);
router.get('/thumbnails', jobController.listAllThumbnails);

export default router;
